
const mongoose = require('mongoose');

const roleRequestSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    requestedRole: {
      type: String,
      required: true,
      enum: ['pharmacy_owner', 'delivery_person'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  } } }
);

const RoleRequest = mongoose.model('RoleRequest', roleRequestSchema);

module.exports = RoleRequest;
