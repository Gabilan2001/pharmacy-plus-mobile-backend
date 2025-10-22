
const express = require('express');
const {
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicines,
  getMedicineById,
  getMedicinesByPharmacyId,
  getMedicinesNearExpiry,
  applyDiscount,
  removeDiscount,
  getDiscountedMedicines,
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, authorize('pharmacy_owner'), upload.single('image'), addMedicine).get(getMedicines);
router.get('/expiry/near', getMedicinesNearExpiry);
router.get('/discounted/all', getDiscountedMedicines);
router.get('/pharmacy/:pharmacyId', getMedicinesByPharmacyId);
router.put('/:id/discount', protect, authorize('pharmacy_owner'), applyDiscount);
router.put('/:id/discount/remove', protect, authorize('pharmacy_owner'), removeDiscount);
router
  .route('/:id')
  .get(getMedicineById)
  .put(protect, authorize('pharmacy_owner', 'admin'), upload.single('image'), updateMedicine)
  .delete(protect, authorize('pharmacy_owner', 'admin'), deleteMedicine);

module.exports = router;
