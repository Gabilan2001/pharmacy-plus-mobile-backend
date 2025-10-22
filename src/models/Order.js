
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Pharmacy',
    },
    items: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Medicine',
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['packing', 'on_the_way', 'delivered'],
      default: 'packing',
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    couponCode: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0,
    },
    
    // Pharmacy instructions field
    instructions: [
      {
        text: { type: String, required: true },
        icon: { type: String, default: 'info' }, // 'info', 'warning', 'food', 'water', 'time', etc.
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  } } }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
