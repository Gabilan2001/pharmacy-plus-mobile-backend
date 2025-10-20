const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');

const router = express.Router();

// admin CRUD
router.post('/', protect, authorize('admin'), createCoupon);
router.get('/', protect, authorize('admin'), getCoupons);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

// validate (authenticated users)
router.post('/validate', protect, validateCoupon);

module.exports = router;
