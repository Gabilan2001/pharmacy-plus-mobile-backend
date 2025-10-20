
const express = require('express');
const {
  addPharmacy,
  updatePharmacy,
  deletePharmacy,
  getPharmacies,
  getPharmacyById,
} = require('../controllers/pharmacyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, authorize('pharmacy_owner', 'admin'), upload.single('image'), addPharmacy).get(getPharmacies);
router
  .route('/:id')
  .get(getPharmacyById)
  .put(protect, authorize('pharmacy_owner', 'admin'), upload.single('image'), updatePharmacy)
  .delete(protect, authorize('pharmacy_owner', 'admin'), deletePharmacy);

module.exports = router;
