const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role').isIn(['ADMIN', 'MEDICAL_OWNER', 'CASHIER']).withMessage('Invalid role'),
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MEDICAL_OWNER', 'CASHIER'])
    .withMessage('Invalid role'),
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', authorize('ADMIN'), userController.getAllUsers);
// Allow medical owners to fetch cashiers for their store
router.get('/cashiers', authorize('ADMIN', 'MEDICAL_OWNER'), userController.getCashiersForOwner);
router.post(
  '/',
  authorize('ADMIN', 'MEDICAL_OWNER'),
  createUserValidation,
  userController.createUser
);
router.get('/:id', userController.getUser);
router.put('/:id', authorize('ADMIN'), updateUserValidation, userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

module.exports = router;
