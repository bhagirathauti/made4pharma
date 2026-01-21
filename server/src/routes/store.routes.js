const express = require('express');
const { body } = require('express-validator');
const storeController = require('../controllers/store.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All store routes require authentication
router.use(authenticate);

const profileValidation = [
  body('name').trim().notEmpty().withMessage('Store name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('licenseNo').trim().notEmpty().withMessage('License number is required'),
];

// Only medical owners can create/update their store profile
router.post('/profile', authorize('MEDICAL_OWNER'), profileValidation, storeController.upsertStoreProfile);
router.get('/profile', authorize('MEDICAL_OWNER'), storeController.getMyStore);
// Admin: list all stores with sales totals
router.get('/', authorize('ADMIN'), storeController.getAllStoresWithSales);

module.exports = router;
