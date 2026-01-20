const { validationResult } = require('express-validator');
const prisma = require('../config/database');

// Create or update store profile for the authenticated user (medical owner)
exports.upsertStoreProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { name, address, phone, email, licenseNo, gstNo } = req.body;

    // If user already has a store, update it
    if (req.user.storeId) {
      const store = await prisma.store.update({
        where: { id: req.user.storeId },
        data: { name, address, phone, email, licenseNo, gstNo },
      });

      return res.json({ success: true, message: 'Store profile updated', data: { store } });
    }

    // Else create a new store and link to user
    const store = await prisma.store.create({
      data: { name, address, phone, email, licenseNo, gstNo },
    });

    // link store to user
    await prisma.user.update({ where: { id: req.user.id }, data: { storeId: store.id } });

    res.status(201).json({ success: true, message: 'Store profile created', data: { store } });
  } catch (error) {
    // handle unique constraint on licenseNo
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Store with this license number already exists' });
    }
    next(error);
  }
};

// Get current user's store profile
exports.getMyStore = async (req, res, next) => {
  try {
    if (!req.user.storeId) {
      return res.json({ success: true, data: { store: null } });
    }

    const store = await prisma.store.findUnique({ where: { id: req.user.storeId } });
    res.json({ success: true, data: { store } });
  } catch (error) {
    next(error);
  }
};
