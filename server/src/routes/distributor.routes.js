const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const distributorController = require('../controllers/distributor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/', authenticate, authorize('MEDICAL_OWNER','ADMIN'), [body('name').notEmpty().withMessage('Name required')], distributorController.createDistributor);
router.get('/', authenticate, authorize('MEDICAL_OWNER','ADMIN'), distributorController.listDistributors);

module.exports = router;
