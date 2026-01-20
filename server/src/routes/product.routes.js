const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Create product - owner or cashier
router.post(
  '/',
  authenticate,
  authorize('MEDICAL_OWNER', 'CASHIER', 'ADMIN'),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('batchNumber').notEmpty().withMessage('Batch number required'),
    body('expiryDate').notEmpty().withMessage('Expiry date required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  ],
  productController.createProduct
);

// Get products for authenticated user's store
router.get('/', authenticate, productController.getProducts);

module.exports = router;
