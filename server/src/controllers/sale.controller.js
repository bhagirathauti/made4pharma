const { validationResult } = require('express-validator');
const prisma = require('../config/database');

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

      const sale = await tx.sale.create({ data: saleCreateData });

      // Fallback raw update: if Prisma client lacks cashier fields but DB column exists,
      // set cashierId using a parameterized raw query. This runs inside the same transaction.
      if (performRawCashierUpdate) {
        await tx.$executeRaw`UPDATE sales SET cashierId = ${providedCashierId} WHERE id = ${sale.id}`;
        // reflect change in returned object
        sale.cashierId = providedCashierId;
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

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: true } },
        cashier: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { sales } });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
