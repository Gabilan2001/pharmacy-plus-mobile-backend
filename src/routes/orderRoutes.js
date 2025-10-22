
const express = require('express');
const {
  createOrder,
  getMyOrders,
  getPharmacyOrders,
  updateOrderStatus,
  assignDeliveryPerson,
  getAllOrders,
  getMyDeliveries,
  updateOrderInstructions,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, authorize('customer'), createOrder);
router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/myorders', protect, authorize('customer'), getMyOrders);
router.get('/mydeliveries', protect, authorize('delivery_person'), getMyDeliveries);
router.get('/pharmacy/:pharmacyId', protect, authorize('pharmacy_owner', 'admin'), getPharmacyOrders);
router.post('/instructions/:id', protect, authorize('pharmacy_owner', 'admin'), updateOrderInstructions);
router.put('/:id/status', protect, authorize('pharmacy_owner', 'delivery_person', 'admin'), updateOrderStatus);
router.put('/:id/assign-delivery', protect, authorize('pharmacy_owner', 'admin'), assignDeliveryPerson);

module.exports = router;
