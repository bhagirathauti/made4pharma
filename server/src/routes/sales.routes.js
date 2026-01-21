const express = require('express');
const { body } = require('express-validator');
const saleController = require('../controllers/sale.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Require authentication for sales
router.use(authenticate);

// Create sale (cashier, owner, admin)
router.post(
  '/',
  authorize('CASHIER', 'MEDICAL_OWNER', 'ADMIN'),
  [body('items').isArray({ min: 1 }).withMessage('Items are required')],
  saleController.createSale,
);

// Get sales for user / store
router.get('/', authenticate, saleController.getSalesForUser);

module.exports = router;
