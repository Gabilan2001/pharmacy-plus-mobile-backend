
const express = require('express');
const {
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicines,
  getMedicineById,
  getMedicinesByPharmacyId,
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, authorize('pharmacy_owner'), upload.single('image'), addMedicine).get(getMedicines);
router.get('/pharmacy/:pharmacyId', getMedicinesByPharmacyId);
router
  .route('/:id')
  .get(getMedicineById)
  .put(protect, authorize('pharmacy_owner', 'admin'), upload.single('image'), updateMedicine)
  .delete(protect, authorize('pharmacy_owner', 'admin'), deleteMedicine);

module.exports = router;
