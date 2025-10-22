
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// @desc    Add new medicine
// @route   POST /api/medicines
// @access  Private/PharmacyOwner
const addMedicine = asyncHandler(async (req, res) => {
  const { name, description, price, stock, pharmacyId, category,expiryDate, storageInstructions, manufacturer } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image for the medicine');
  }

  if (!pharmacyId) {
    res.status(400);
    throw new Error('pharmacyId is required');
  }

  const pharmacy = await Pharmacy.findById(pharmacyId);

  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy not found');
  }

  if (pharmacy.ownerId.toString() !== req.user.id.toString()) {
    res.status(401);
    throw new Error('Not authorized to add medicine to this pharmacy');
  }

  const medicine = await Medicine.create({
    name,
    description,
    price,
    stock,
    image: req.file.path,
    imagePublicId: req.file.filename,
    pharmacyId,
    category,
    expiryDate,
    storageInstructions,
    manufacturer,
  });

  if (medicine) {
    res.status(201).json(medicine);
  } else {
    res.status(400);
    throw new Error('Invalid medicine data');
  }
});

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private/PharmacyOwner
const updateMedicine = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category,expiryDate, storageInstructions, manufacturer } = req.body;

  const medicine = await Medicine.findById(req.params.id);

  if (medicine) {
    const pharmacy = await Pharmacy.findById(medicine.pharmacyId);
    if (pharmacy.ownerId.toString() !== req.user.id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this medicine');
    }

    medicine.name = name || medicine.name;
    medicine.description = description || medicine.description;
    medicine.price = price || medicine.price;
    medicine.stock = stock || medicine.stock;
    medicine.category = category || medicine.category;
    medicine.expiryDate = expiryDate || medicine.expiryDate;
    medicine.storageInstructions = storageInstructions || medicine.storageInstructions;
    medicine.manufacturer = manufacturer || medicine.manufacturer;

    if (req.file) {
      if (medicine.imagePublicId) {
        await cloudinary.uploader.destroy(medicine.imagePublicId);
      }
      medicine.image = req.file.path;
      medicine.imagePublicId = req.file.filename;
    }

    const updatedMedicine = await medicine.save();

    res.json(updatedMedicine);
  } else {
    res.status(404);
    throw new Error('Medicine not found');
  }
});

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private/PharmacyOwner/Admin
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (medicine) {
    const pharmacy = await Pharmacy.findById(medicine.pharmacyId);
    if (
      (pharmacy.ownerId.toString() !== req.user.id.toString() && req.user.role !== 'admin')
    ) {
      res.status(401);
      throw new Error('Not authorized to delete this medicine');
    }
    if (medicine.imagePublicId) {
      await cloudinary.uploader.destroy(medicine.imagePublicId);
    }
    await medicine.deleteOne();
    res.json({ message: 'Medicine removed' });
  } else {
    res.status(404);
    throw new Error('Medicine not found');
  }
});

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Public
const getMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find({});
  res.json(medicines);
});

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Public
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (medicine) {
    res.json(medicine);
  } else {
    res.status(404);
    throw new Error('Medicine not found');
  }
});

// @desc    Get medicines by pharmacy ID
// @route   GET /api/medicines/pharmacy/:pharmacyId
// @access  Public
const getMedicinesByPharmacyId = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find({ pharmacyId: req.params.pharmacyId });
  res.json(medicines);
});

// @desc    Get medicines near expiry
// @route   GET /api/medicines/expiry/near
// @access  Public
const getMedicinesNearExpiry = asyncHandler(async (req, res) => {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  const medicines = await Medicine.find({
    expiryDate: { $lte: threeMonthsFromNow, $gte: new Date() },
    stock: { $gt: 0 },
  }).populate('pharmacyId', 'name address');

  res.json(medicines);
});

// @desc    Apply discount to medicine near expiry
// @route   PUT /api/medicines/:id/discount
// @access  Private/PharmacyOwner
const applyDiscount = asyncHandler(async (req, res) => {
  const { discountPercentage } = req.body;

  if (!discountPercentage || discountPercentage < 0 || discountPercentage > 100) {
    res.status(400);
    throw new Error('Please provide a valid discount percentage (0-100)');
  }

  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  const pharmacy = await Pharmacy.findById(medicine.pharmacyId);
  if (pharmacy.ownerId.toString() !== req.user.id.toString()) {
    res.status(401);
    throw new Error('Not authorized to apply discount to this medicine');
  }

  medicine.isDiscounted = true;
  medicine.discountPercentage = discountPercentage;
  medicine.discountedPrice = medicine.price - (medicine.price * discountPercentage / 100);

  const updatedMedicine = await medicine.save();

  // TODO: Send push notifications to nearby customers
  // You can implement notification logic here

  res.json(updatedMedicine);
});

// @desc    Remove discount from medicine
// @route   PUT /api/medicines/:id/discount/remove
// @access  Private/PharmacyOwner
const removeDiscount = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  const pharmacy = await Pharmacy.findById(medicine.pharmacyId);
  if (pharmacy.ownerId.toString() !== req.user.id.toString()) {
    res.status(401);
    throw new Error('Not authorized to modify this medicine');
  }

  medicine.isDiscounted = false;
  medicine.discountPercentage = undefined;
  medicine.discountedPrice = undefined;

  const updatedMedicine = await medicine.save();

  res.json(updatedMedicine);
});

// @desc    Get discounted medicines
// @route   GET /api/medicines/discounted/all
// @access  Public
const getDiscountedMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find({
    isDiscounted: true,
    stock: { $gt: 0 },
    expiryDate: { $gte: new Date() },
  }).populate('pharmacyId', 'name address');

  res.json(medicines);
});


module.exports = {
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
};
