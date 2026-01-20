const { validationResult } = require('express-validator');
const prisma = require('../config/database');

// Create product (medical owner / cashier)
exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { name, batchNumber, expiryDate, quantity, costPrice, mrp, discount, supplier } = req.body;
    console.log('createProduct - received data:', { name, batchNumber, expiryDate, quantity, costPrice, mrp, discount, supplier });
    // Debug: log incoming body and quantity parsing
    try {
      console.log('createProduct - incoming body:', JSON.stringify(req.body));
    } catch (e) {
      console.log('createProduct - incoming body (non-serializable)');
    }

    // Require store context from authenticated user
    const storeId = req.user?.storeId;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'User not assigned to a store' });
    }

    const quantityInt = typeof quantity === 'number' ? quantity : parseInt(quantity || '0', 10);
    console.log('createProduct - parsed quantity:', quantityInt);

    const product = await prisma.product.create({
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
      },
    });

    res.status(201).json({ success: true, message: 'Product created', data: { product } });
  } catch (error) {
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
