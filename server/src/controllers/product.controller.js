const { validationResult } = require('express-validator');
const prisma = require('../config/database');

// Create product (medical owner / cashier)
exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { name, batchNumber, expiryDate, quantity, costPrice, mrp, discount, supplier, reorderLevel } = req.body;
    console.log('createProduct - received data:', { name, batchNumber, expiryDate, quantity, costPrice, mrp, discount, supplier });
    // Debug: log incoming body and quantity parsing
    try {
      console.log('createProduct - incoming body:', JSON.stringify(req.body));
    } catch (e) {
      console.log('createProduct - incoming body (non-serializable)');
    }

    // Require store context from authenticated user
    const storeId = req.user?.storeId;
    console.log('createProduct - req.user:', req.user);
    console.log('createProduct - resolved storeId:', storeId);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'User not assigned to a store' });
    }

    const quantityInt = typeof quantity === 'number' ? quantity : parseInt(quantity || '0', 10);
    console.log('createProduct - parsed quantity:', quantityInt);

    // If a product with same store and batch number exists, treat as a refill: update quantity
    let product = null;
    if (batchNumber) {
      product = await prisma.product.findFirst({ where: { storeId, batchNo: batchNumber } });
    }

    const refillFlag = req.body && (req.body.refill === true || req.body.refill === 'true');
    console.log('createProduct - refill flag:', refillFlag);

    if (product && refillFlag) {
      // update existing product quantity and optionally update other fields
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          quantity: (typeof product.quantity === 'number' ? product.quantity : Number(product.quantity || 0)) + quantityInt,
          price: typeof costPrice === 'number' ? costPrice : (costPrice ? parseFloat(costPrice) : product.price),
          mrp: typeof mrp === 'number' ? mrp : (mrp ? parseFloat(mrp) : product.mrp),
          discount: typeof discount === 'number' ? discount : (discount ? parseFloat(discount) : product.discount),
          manufacturer: supplier || product.manufacturer,
          expiryDate: expiryDate ? new Date(expiryDate) : product.expiryDate,
          reorderLevel: typeof reorderLevel === 'number' ? reorderLevel : (reorderLevel ? parseInt(String(reorderLevel), 10) : product.reorderLevel),
        },
      });

      console.log('createProduct - updated existing product:', updated);
      // Update distributor totalPurchase if supplier provided
      try {
        const supplierName = supplier || updated.manufacturer;
        if (supplierName) {
          const amount = quantityInt * (typeof costPrice === 'number' ? costPrice : parseFloat(costPrice || '0'));
          await prisma.distributor.upsert({
            where: { storeId_name: { storeId, name: supplierName } },
            update: { totalPurchase: { increment: amount } },
            create: { name: supplierName, storeId, totalPurchase: amount },
          });
        }
      } catch (e) {
        console.error('createProduct - distributor upsert error (refill):', e && e.message);
      }
      return res.status(200).json({ success: true, message: 'Product updated (refill)', data: { product: updated } });
    }
    if (product && !refillFlag) {
      console.log('createProduct - batch exists but refill flag not set; creating a new product record for this batch/store');
    }
    // Else create new product record (new batch)
    const created = await prisma.product.create({
      data: {
        name,
        batchNo: batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        price: typeof costPrice === 'number' ? costPrice : parseFloat(costPrice || 0),
        mrp: typeof mrp === 'number' ? mrp : parseFloat(mrp || 0),
        discount: typeof discount === 'number' ? discount : parseFloat(discount || 0),
        manufacturer: supplier || null,
        storeId,
        quantity: quantityInt,
        reorderLevel: typeof reorderLevel === 'number' ? reorderLevel : (reorderLevel ? parseInt(String(reorderLevel), 10) : undefined),
      },
    });
    console.log('createProduct - created product:', created);
    // Update/create distributor record with totalPurchase
    try {
      const supplierName = supplier || created.manufacturer;
      if (supplierName) {
        const amount = quantityInt * (typeof costPrice === 'number' ? costPrice : parseFloat(costPrice || '0'));
        await prisma.distributor.upsert({
          where: { storeId_name: { storeId, name: supplierName } },
          update: { totalPurchase: { increment: amount } },
          create: { name: supplierName, storeId, totalPurchase: amount },
        });
      }
    } catch (e) {
      console.error('createProduct - distributor upsert error (create):', e && e.message);
    }
    res.status(201).json({ success: true, message: 'Product created', data: { product: created } });
  } catch (error) {
    console.error('createProduct - error:', error && error.message, error && error.stack);
    next(error);
  }
};

// List products for the user's store
exports.getProducts = async (req, res, next) => {
  try {
    const storeId = req.user?.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'User not assigned to a store' });
    }

    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { products } });
  } catch (error) {
    next(error);
  }
};

// Get distributors/manufacturers for the authenticated user's store with aggregated totals
exports.getDistributors = async (req, res, next) => {
  try {
    const storeId = req.user?.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'User not assigned to a store' });
    }
    // Read from distributors table for this store
    const distributors = await prisma.distributor.findMany({ where: { storeId }, orderBy: { totalPurchase: 'desc' } });
    // normalize response shape to match previous API (manufacturer + totals)
    const result = distributors.map((d) => ({ manufacturer: d.name, totalAmount: d.totalPurchase }));
    res.json({ success: true, data: { distributors: result } });
  } catch (error) {
    next(error);
  }
};
