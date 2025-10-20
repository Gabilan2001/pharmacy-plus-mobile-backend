const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// POST /api/coupons - create coupon (admin)
exports.createCoupon = asyncHandler(async (req, res) => {
  const { minAmount, discountAmount, usageLimit } = req.body;
  // Generate 6-letter random code if not provided
  const code = (req.body.code || '').toString().trim().toUpperCase() ||
    Array.from({ length: 6 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');

  const exists = await Coupon.findOne({ code });
  if (exists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }
  const coupon = await Coupon.create({ code, minAmount, discountAmount, usageLimit });
  res.status(201).json(coupon);
});

// GET /api/coupons - list (admin)
exports.getCoupons = asyncHandler(async (_req, res) => {
  const list = await Coupon.find({}).sort({ createdAt: -1 });
  res.json(list);
});

// PUT /api/coupons/:id - update (admin)
exports.updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { minAmount, discountAmount, usageLimit, isActive } = req.body;
  const c = await Coupon.findById(id);
  if (!c) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  if (minAmount !== undefined) c.minAmount = minAmount;
  if (discountAmount !== undefined) c.discountAmount = discountAmount;
  if (usageLimit !== undefined) c.usageLimit = usageLimit;
  if (isActive !== undefined) c.isActive = isActive;
  const saved = await c.save();
  res.json(saved);
});

// DELETE /api/coupons/:id - delete (admin)
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const c = await Coupon.findById(id);
  if (!c) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  await c.deleteOne();
  res.status(204).send();
});

// POST /api/coupons/validate - validate (any authenticated)
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;
  const coupon = await Coupon.findOne({ code: (code || '').toUpperCase() });
  if (!coupon || !coupon.isActive) {
    res.status(400);
    throw new Error('Invalid coupon');
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached');
  }
  if (Number(orderTotal) < coupon.minAmount) {
    res.status(400);
    throw new Error(`Minimum order amount of $${coupon.minAmount} required`);
  }
  res.json({
    valid: true,
    code: coupon.code,
    discountAmount: coupon.discountAmount,
    usageLeft: Math.max(0, coupon.usageLimit - coupon.usedCount),
  });
});
