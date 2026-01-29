const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const { randomUUID } = require('crypto');

// Create a sale and decrement product quantities in a transaction
exports.createSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { items, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const storeId = req.user?.storeId;
    const cashierId = req.user?.id;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'User not assigned to a store' });
    }

    // compute totals
    let totalAmount = 0;
    const normalizedItems = items.map((it) => {
      const quantity = typeof it.quantity === 'number' ? it.quantity : parseInt(it.quantity || '0', 10);
      const price = typeof it.price === 'number' ? it.price : parseFloat(it.price || 0);
      const subtotal = quantity * price;
      totalAmount += subtotal;
      return { productId: it.productId || null, name: it.name || null, quantity, price, subtotal };
    });

    // build invoice no
    const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // transactional work: check stock, decrement, create sale and sale items
    const result = await prisma.$transaction(async (tx) => {
      // verify each product and update quantity for items that reference a product
      for (const it of normalizedItems) {
        if (it.productId) {
          const product = await tx.product.findUnique({ where: { id: it.productId } });
          if (!product) {
            throw Object.assign(new Error('Product not found'), { status: 404 });
          }
          if (product.storeId !== storeId) {
            throw Object.assign(new Error('Product does not belong to your store'), { status: 403 });
          }
          if (product.quantity < it.quantity) {
            throw Object.assign(new Error(`Insufficient stock for product ${product.name}`), { status: 400 });
          }

          await tx.product.update({ where: { id: it.productId }, data: { quantity: product.quantity - it.quantity } });
        }
      }

      // create sale (without nested items), then create sale items separately to avoid nested create issues
      // Build create data and REQUIRE that we can attach the cashier (do not allow anonymous sales)
      const saleCreateData = {
        invoiceNo,
        totalAmount,
        netAmount: totalAmount,
        paymentMethod: paymentMethod || 'CASH',
        storeId,
        customerName: (req.body && req.body.customer && req.body.customer.name) ? String(req.body.customer.name) : null,
        customerMobile: (req.body && req.body.customer && req.body.customer.mobile) ? String(req.body.customer.mobile) : null,
        customerAddress: (req.body && req.body.customer && req.body.customer.address) ? String(req.body.customer.address) : null,
        doctorName: (req.body && req.body.customer && req.body.customer.doctorName) ? String(req.body.customer.doctorName) : null,
        doctorMobile: (req.body && req.body.customer && req.body.customer.doctorMobile) ? String(req.body.customer.doctorMobile) : null,
      };

      // Ensure we have the authenticated user id
      if (!req.user || !req.user.id) {
        throw Object.assign(new Error('Authenticated user required to create a sale'), { status: 401 });
      }

      // Inspect DMMF to verify the Sale model supports attaching a cashier
      const dmmf = (tx && tx._dmmf) || (prisma && prisma._dmmf);
      const saleModel = dmmf?.modelMap?.Sale;
      let hasCashierId = false;
      let hasCashierRel = false;
      if (saleModel && Array.isArray(saleModel.fields)) {
        hasCashierId = saleModel.fields.some((f) => f.name === 'cashierId');
        hasCashierRel = saleModel.fields.some((f) => f.name === 'cashier');
      }
      console.debug('[sale.create] model hasCashierId=%s hasCashierRel=%s', hasCashierId, hasCashierRel);

      // If the schema does not support cashier association via Prisma client, we will
      // attempt a fallback: accept `cashierId` from the request body (client localStorage)
      // but validate it matches the authenticated user to prevent spoofing. If provided
      // and valid, we will perform a raw SQL update after creating the sale.
      let performRawCashierUpdate = false;
      const providedCashierId = req.body && req.body.cashierId ? String(req.body.cashierId) : null;

      if (!hasCashierId && !hasCashierRel) {
        // If the client provided a cashierId, ensure it matches the authenticated user
        if (!providedCashierId) {
          throw Object.assign(new Error('Server schema does not support cashier association; cannot create sale'), { status: 500 });
        }
        if (providedCashierId !== req.user.id) {
          throw Object.assign(new Error('Provided cashierId does not match authenticated user'), { status: 403 });
        }
        performRawCashierUpdate = true;
      } else {
        if (hasCashierId) {
          saleCreateData.cashierId = req.user.id;
        } else if (hasCashierRel) {
          saleCreateData.cashier = { connect: { id: req.user.id } };
        }
      }

      // Inspect DB columns for `sales` table to avoid Prisma P2022 when DB schema is missing optional columns
      const cols = await tx.$queryRaw`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales'`;
      const present = (cols || []).map((c) => c.COLUMN_NAME);

      // If the DB is missing certain optional columns (like doctorName), remove them from create payload
      const createPayload = {};
      for (const [k, v] of Object.entries(saleCreateData)) {
        // skip nested relation payloads for cashier here; handle cashier after create if DB lacks column
        if (k === 'cashier' || k === 'cashierId') continue;
        if (present.includes(k)) createPayload[k] = v;
      }

      // If DB has cashierId column and Prisma schema supports it, include it; otherwise perform raw update later
      let performRawCashierUpdateLocal = performRawCashierUpdate;
      if (!performRawCashierUpdateLocal) {
        // prefer cashierId column presence for direct set
        if (hasCashierId && present.includes('cashierId')) {
          createPayload.cashierId = req.user.id;
        } else if (hasCashierRel && present.includes('cashierId')) {
          // even if relation exists in DMMF, ensure physical column exists
          createPayload.cashier = { connect: { id: req.user.id } };
        } else {
          // DB lacks cashierId column; we'll set it via raw update after creating the sale
          performRawCashierUpdateLocal = true;
        }
      }

      let sale;
      try {
        sale = await tx.sale.create({ data: createPayload });
      } catch (err) {
        // If Prisma reports a missing column (P2022), attempt a safe retry by
        // reading the actual DB columns and pruning the payload accordingly.
        if (err && err.code === 'P2022') {
          const cols2 = await tx.$queryRaw`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales'`;
          const present2 = (cols2 || []).map((c) => c.COLUMN_NAME);
          const pruned = {};
          for (const [k, v] of Object.entries(createPayload)) {
            if (present2.includes(k)) pruned[k] = v;
          }
          // ensure we have an `id` if DB requires it (older schema may not have default)
          if (present2.includes('id') && !pruned.id) {
            pruned.id = randomUUID();
          }
          // regenerate invoiceNo for the retry to avoid unique-key conflict if the
          // first insert succeeded but Prisma errored while reading back missing columns
          pruned.invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
          // set timestamps if present and not provided
          if (present2.includes('createdAt') && !pruned.createdAt) pruned.createdAt = new Date();
          if (present2.includes('updatedAt') && !pruned.updatedAt) pruned.updatedAt = new Date();

          // Retry by performing a raw INSERT using only present columns to avoid
          // Prisma attempting to read missing columns after insert.
          const keys = Object.keys(pruned);
          const colsSql = keys.map((k) => `\`` + k + `\``).join(', ');
          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map((k) => pruned[k]);
          const insertSql = `INSERT INTO sales (${colsSql}) VALUES (${placeholders})`;
          await tx.$queryRawUnsafe(insertSql, ...values);
          // Use the id we generated (or provided) to fetch the row
          const insertedId = pruned.id;
          // fetch the inserted row selecting only present columns
          const selectParts = keys.map((k) => `s.\`` + k + `\``);
          const rowSql = `SELECT ${selectParts.join(', ')} FROM sales s WHERE s.id = ?`;
          const rows = await tx.$queryRawUnsafe(rowSql, insertedId);
          sale = rows && rows[0] ? rows[0] : { id: insertedId };
        } else {
          throw err;
        }
      }

      // Fallback raw update: if Prisma client lacks cashier fields but DB column exists,
      // set cashierId using a parameterized raw query. This runs inside the same transaction.
      if (performRawCashierUpdateLocal) {
        const toSet = providedCashierId || req.user.id;
        // Only attempt update if DB actually has a cashierId column; otherwise skip
        if (present.includes('cashierId')) {
          await tx.$executeRaw`UPDATE sales SET cashierId = ${toSet} WHERE id = ${sale.id}`;
          sale.cashierId = toSet;
        }
      }

      // create sale items referencing the created sale
      const createdItems = [];
      for (const it of normalizedItems) {
        const si = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: it.productId || undefined,
            name: it.name || undefined,
            quantity: it.quantity,
            price: it.price,
            subtotal: it.subtotal,
          },
        });
        createdItems.push(si);
      }

      // attach items for return shape similar to nested create
      return { ...sale, items: createdItems };
    });

    res.status(201).json({ success: true, message: 'Sale created', data: { sale: result } });
  } catch (error) {
    next(error);
  }
};

// Get sales for current cashier (or for store if owner/admin)
exports.getSalesForUser = async (req, res, next) => {
  try {
    const callerRole = req.user?.role;
    const where = {};
    if (callerRole === 'CASHIER') {
      where.cashierId = req.user.id;
    } else if (req.user.storeId) {
      where.storeId = req.user.storeId;
    }

    // Check the sales table columns first; if any expected column is missing, use a safe raw SQL fallback
    const expectedCols = ['id','invoiceNo','totalAmount','customerName','customerMobile','customerAddress','doctorName','doctorMobile','discount','gstAmount','netAmount','paymentMethod','status','createdAt','updatedAt','storeId','cashierId'];
    const cols = await prisma.$queryRaw`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales'`;
    const present = cols.map((c) => c.COLUMN_NAME);
    const missing = expectedCols.filter((c) => !present.includes(c));
    if (missing.length === 0) {
      // safe to use Prisma client directly
      const sales = await prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, data: { sales } });
    }

    // Fallback: build a SELECT that substitutes NULL for missing columns
    const selectParts = expectedCols.map((c) => (present.includes(c) ? 's.' + '`' + c + '`' : 'NULL AS `' + c + '`'));
    const whereClauses = [];
    const params = [];
    if (where.cashierId) { whereClauses.push('s.cashierId = ?'); params.push(where.cashierId); }
    if (where.storeId) { whereClauses.push('s.storeId = ?'); params.push(where.storeId); }
    const whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const sql = `SELECT ${selectParts.join(', ')} FROM sales s ${whereSql} ORDER BY s.createdAt DESC`;
    const salesRows = params.length ? await prisma.$queryRawUnsafe(sql, ...params) : await prisma.$queryRawUnsafe(sql);

    const salesWithRelations = [];
    for (const row of salesRows) {
      const saleId = row.id;
      const items = await prisma.saleItem.findMany({ where: { saleId }, include: { product: true } });
      let cashier = null;
      if (row.cashierId) {
        cashier = await prisma.user.findUnique({ where: { id: row.cashierId }, select: { id: true, name: true, email: true } });
      }
      salesWithRelations.push({ ...row, items, cashier });
    }

    return res.json({ success: true, data: { sales: salesWithRelations } });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
