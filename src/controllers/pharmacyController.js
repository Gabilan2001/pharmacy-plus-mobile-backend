
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// @desc    Add new pharmacy
// @route   POST /api/pharmacies
// @access  Private/PharmacyOwner
const addPharmacy = asyncHandler(async (req, res) => {
  const { name, address, phone } = req.body;

  // Temporary debug logs to diagnose content-type and multer handling
  try {
    console.log('CT:', req.headers['content-type']);
    console.log('has file?', !!req.file, 'file keys:', req.file && Object.keys(req.file));
  } catch (e) {}

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image for the pharmacy');
  }

  const pharmacyExists = await Pharmacy.findOne({ name });
  if (pharmacyExists) {
    res.status(400);
    throw new Error('Pharmacy with this name already exists');
  }

  const pharmacy = await Pharmacy.create({
    name,
    ownerId: req.user.id,
    address,
    phone,
    image: req.file.path,
    imagePublicId: req.file.filename,
  });

  if (pharmacy) {
    res.status(201).json({
      _id: pharmacy._id,
      name: pharmacy.name,
      ownerId: pharmacy.ownerId,
      address: pharmacy.address,
      phone: pharmacy.phone,
      image: pharmacy.image,
      imagePublicId: pharmacy.imagePublicId,
      rating: pharmacy.rating,
    });
  } else {
    res.status(400);
    throw new Error('Invalid pharmacy data');
  }
});

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private/PharmacyOwner
const updatePharmacy = asyncHandler(async (req, res) => {
  const { name, address, phone } = req.body;

  const pharmacy = await Pharmacy.findById(req.params.id);

  if (pharmacy) {
    if (pharmacy.ownerId.toString() !== req.user.id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this pharmacy');
    }

    pharmacy.name = name || pharmacy.name;
    pharmacy.address = address || pharmacy.address;
    pharmacy.phone = phone || pharmacy.phone;

    if (req.file) {
      if (pharmacy.imagePublicId) {
        await cloudinary.uploader.destroy(pharmacy.imagePublicId);
      }
      pharmacy.image = req.file.path;
      pharmacy.imagePublicId = req.file.filename;
    }

    const updatedPharmacy = await pharmacy.save();

    res.json({
      _id: updatedPharmacy._id,
      name: updatedPharmacy.name,
      ownerId: updatedPharmacy.ownerId,
      address: updatedPharmacy.address,
      phone: updatedPharmacy.phone,
      image: updatedPharmacy.image,
      imagePublicId: updatedPharmacy.imagePublicId,
      rating: updatedPharmacy.rating,
    });
  } else {
    res.status(404);
    throw new Error('Pharmacy not found');
  }
});

// @desc    Delete pharmacy
// @route   DELETE /api/pharmacies/:id
// @access  Private/PharmacyOwner/Admin
const deletePharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id);

  if (pharmacy) {
    if (pharmacy.ownerId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this pharmacy');
    }
    if (pharmacy.imagePublicId) {
      await cloudinary.uploader.destroy(pharmacy.imagePublicId);
    }
    await pharmacy.deleteOne();
    res.json({ message: 'Pharmacy removed' });
  } else {
    res.status(404);
    throw new Error('Pharmacy not found');
  }
});

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Public
const getPharmacies = asyncHandler(async (req, res) => {
  const { ownerId } = req.query;
  const filter = ownerId ? { ownerId } : {};
  const pharmacies = await Pharmacy.find(filter);
  res.json(pharmacies);
});

// @desc    Get single pharmacy by ID
// @route   GET /api/pharmacies/:id
// @access  Public
const getPharmacyById = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id);

  if (pharmacy) {
    res.json(pharmacy);
  } else {
    res.status(404);
    throw new Error('Pharmacy not found');
  }
});

module.exports = {
  addPharmacy,
  updatePharmacy,
  deletePharmacy,
  getPharmacies,
  getPharmacyById,
};
