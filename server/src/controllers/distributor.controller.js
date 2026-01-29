const { validationResult } = require('express-validator');
const prisma = require('../config/database');

exports.createDistributor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { name } = req.body;
    const storeId = req.user?.storeId;
    if (!storeId) return res.status(400).json({ success: false, message: 'User not assigned to a store' });

    // upsert distributor by (storeId, name)
    const dist = await prisma.distributor.upsert({
      where: { storeId_name: { storeId, name } },
      update: {},
      create: { name, storeId, totalPurchase: 0 },
    });

    res.status(201).json({ success: true, data: { distributor: dist } });
  } catch (error) {
    next(error);
  }
};

exports.listDistributors = async (req, res, next) => {
  try {
    const storeId = req.user?.storeId;
    if (!storeId) return res.status(400).json({ success: false, message: 'User not assigned to a store' });

    const list = await prisma.distributor.findMany({ where: { storeId }, orderBy: { totalPurchase: 'desc' } });
    res.json({ success: true, data: { distributors: list } });
  } catch (error) {
    next(error);
  }
};
