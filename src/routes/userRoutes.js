const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// GET /api/users - admin only
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
}));

// GET /api/users/me - current user's profile
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
}));

module.exports = router;
