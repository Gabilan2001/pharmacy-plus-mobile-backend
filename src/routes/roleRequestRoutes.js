
const express = require('express');
const {
  requestRoleChange,
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} = require('../controllers/roleRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, requestRoleChange);
router.get('/pending', protect, authorize('admin'), getPendingRoleRequests);
router.put('/:id/approve', protect, authorize('admin'), approveRoleRequest);
router.put('/:id/reject', protect, authorize('admin'), rejectRoleRequest);

module.exports = router;
