
const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
      default: '/uploads/default_medicine.png',
    },
    imagePublicId: {
      type: String,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Pharmacy',
    },
    category: {
      type: String,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storageInstructions: {
      type: String,
      default: 'Store in a cool, dry place',
    },
    manufacturer: {
      type: String,
      required: true,
    },
    isDiscounted: {
      type: Boolean,
      default: false,
    },
    discountedPrice: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
    },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  } } }
);

// Virtual to check if medicine is near expiry (within 3 months)
medicineSchema.virtual('isNearExpiry').get(function() {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return this.expiryDate <= threeMonthsFromNow;
});

// Virtual to check if medicine is expired
medicineSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
