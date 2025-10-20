
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
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  } } }
);

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
