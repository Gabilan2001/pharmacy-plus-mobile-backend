
const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Request a role change
// @route   POST /api/role-requests
// @access  Private
const requestRoleChange = asyncHandler(async (req, res) => {
  const { requestedRole } = req.body;

  const existingRequest = await RoleRequest.findOne({
    userId: req.user.id,
    status: 'pending',
  });

  if (existingRequest) {
    res.status(400);
    throw new Error('You already have a pending role request');
  }

  const roleRequest = await RoleRequest.create({
    userId: req.user.id,
    requestedRole,
  });

  res.status(201).json(roleRequest);
});

// @desc    Get all pending role requests
// @route   GET /api/role-requests/pending
// @access  Private/Admin
const getPendingRoleRequests = asyncHandler(async (req, res) => {
  const roleRequests = await RoleRequest.find({ status: 'pending' }).populate('userId', 'name email');
  res.json(roleRequests);
});

// @desc    Approve a role request
// @route   PUT /api/role-requests/:id/approve
// @access  Private/Admin
const approveRoleRequest = asyncHandler(async (req, res) => {
  const roleRequest = await RoleRequest.findById(req.params.id);

  if (!roleRequest) {
    res.status(404);
    throw new Error('Role request not found');
  }

  roleRequest.status = 'approved';
  await roleRequest.save();

  const user = await User.findById(roleRequest.userId);

  if (user) {
    user.role = roleRequest.requestedRole;
    await user.save();
  }

  res.json({ message: 'Role request approved and user role updated' });
});

// @desc    Reject a role request
// @route   PUT /api/role-requests/:id/reject
// @access  Private/Admin
const rejectRoleRequest = asyncHandler(async (req, res) => {
  const roleRequest = await RoleRequest.findById(req.params.id);

  if (!roleRequest) {
    res.status(404);
    throw new Error('Role request not found');
  }

  roleRequest.status = 'rejected';
  await roleRequest.save();

  res.json({ message: 'Role request rejected' });
});

module.exports = {
  requestRoleChange,
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
};
