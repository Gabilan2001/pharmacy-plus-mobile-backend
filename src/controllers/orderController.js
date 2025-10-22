
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');
const { sendSms } = require('../services/smsService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
const createOrder = asyncHandler(async (req, res) => {
  const { pharmacyId, items, deliveryAddress, couponCode } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy not found');
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const medicine = await Medicine.findById(item.medicineId);

    if (!medicine) {
      res.status(404);
      throw new Error(`Medicine not found: ${item.medicineId}`);
    }

    if (medicine.stock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${medicine.name}`);
    }

    orderItems.push({
      medicineId: medicine._id,
      name: medicine.name,
      quantity: item.quantity,
      price: medicine.price,
    });
    totalAmount += medicine.price * item.quantity;

    // Reduce stock
    medicine.stock -= item.quantity;
    await medicine.save({validateBeforeSave: false});
  }

  // Coupon logic (flat amount discount)
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
    if (!coupon || !coupon.isActive) {
      res.status(400);
      throw new Error('Invalid coupon');
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400);
      throw new Error('Coupon usage limit reached');
    }
    if (totalAmount < coupon.minAmount) {
      res.status(400);
      throw new Error(`Minimum order amount of $${coupon.minAmount} required`);
    }
    discount = Math.min(coupon.discountAmount, totalAmount);
  }

  const order = await Order.create({
    customerId: req.user.id,
    pharmacyId,
    items: orderItems,
    totalAmount: totalAmount - discount,
    deliveryAddress,
    couponCode,
    discount,
  });

  // increment usage if coupon applied
  if (couponCode && discount > 0) {
    await Coupon.updateOne(
      { code: String(couponCode).toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }
  // Send SMS confirmation to customer (non-blocking on errors)
  try {
    const customer = await User.findById(req.user.id);
    if (customer?.phone) {
      const itemSummary = order.items.map((i) => `${i.name} x${i.quantity}`).join(', ');
      const text = `Hi ${customer.name || 'Customer'}, your order ${order.id} at ${pharmacy.name} was placed. Items: ${itemSummary}. Total: $${Number(order.totalAmount).toFixed(2)}.`;
      await sendSms(customer.phone, text);
    } else {
      console.warn('SMS not sent: customer phone number missing');
    }
  } catch (err) {
    console.error('Failed to send order SMS:', err?.message || err);
  }

  res.status(201).json(order);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private/Customer
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user.id })
    .populate('pharmacyId', 'name image')
    .populate('items.medicineId', 'name image');
  res.json(orders);
});

// @desc    Get orders for a pharmacy owner
// @route   GET /api/orders/pharmacy/:pharmacyId
// @access  Private/PharmacyOwner
const getPharmacyOrders = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.pharmacyId);

  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy not found');
  }

  if (pharmacy.ownerId.toString() !== req.user.id.toString()) {
    res.status(401);
    throw new Error('Not authorized to view orders for this pharmacy');
  }

  const orders = await Order.find({ pharmacyId: req.params.pharmacyId })
    .populate('customerId', 'name email phone')
    .populate('items.medicineId', 'name image');
  res.json(orders);
});

// @desc    Update order status (for pharmacy owner/delivery person)
// @route   PUT /api/orders/:id/status
// @access  Private/PharmacyOwner/DeliveryPerson/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, deliveryPersonId } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const pharmacy = await Pharmacy.findById(order.pharmacyId);

  // Authorization logic
  const isPharmacyOwner = pharmacy.ownerId.toString() === req.user.id.toString();
  const isDeliveryPerson = order.deliveryPersonId && order.deliveryPersonId.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPharmacyOwner && !isDeliveryPerson && !isAdmin) {
    res.status(401);
    throw new Error('Not authorized to update this order status');
  }

  order.status = status || order.status;
  order.deliveryPersonId = deliveryPersonId || order.deliveryPersonId;

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// @desc    Assign delivery person to an order
// @route   PUT /api/orders/:id/assign-delivery
// @access  Private/PharmacyOwner/Admin
const assignDeliveryPerson = asyncHandler(async (req, res) => {
  const { deliveryPersonId } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const pharmacy = await Pharmacy.findById(order.pharmacyId);

  if (
    pharmacy.ownerId.toString() !== req.user.id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(401);
    throw new Error('Not authorized to assign delivery person for this order');
  }

  const deliveryPerson = await User.findById(deliveryPersonId);

  if (!deliveryPerson || deliveryPerson.role !== 'delivery_person') {
    res.status(400);
    throw new Error('Invalid delivery person ID or user is not a delivery person');
  }

  order.deliveryPersonId = deliveryPersonId;
  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

// @desc    Add or update instructions for an order
// @route   PUT /api/orders/:id/instructions
// @access  Private/PharmacyOwner
const updateOrderInstructions = asyncHandler(async (req, res) => {
  const { instructions } = req.body;

  if (!instructions || !Array.isArray(instructions)) {
    res.status(400);
    throw new Error('Instructions must be provided as an array');
  }
  
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const pharmacy = await Pharmacy.findById(order.pharmacyId);

  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy not found');
  }

  // Check if user is pharmacy owner or admin
  if (pharmacy.ownerId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to update instructions for this order');
  }

  // Only allow updating instructions if order is still in packing status
  if (order.status !== 'packing') {
    res.status(400);
    throw new Error('Instructions can only be updated while order is in packing status');
  }

  // Validate and format instructions
  const formattedInstructions = instructions.map(instruction => ({
    text: instruction.text,
    icon: instruction.icon || 'info',
    priority: instruction.priority || 'medium',
    createdAt: new Date()
  }));

  order.instructions = formattedInstructions;
  const updatedOrder = await order.save();

  res.json(updatedOrder);
});


module.exports = {
  createOrder,
  getMyOrders,
  getPharmacyOrders,
  updateOrderStatus,
  assignDeliveryPerson,
  updateOrderInstructions,
};

// Additional controllers for admin and delivery person
// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('customerId', 'name email phone')
    .populate('pharmacyId', 'name image')
    .populate('items.medicineId', 'name image');
  res.json(orders);
});

// @desc    Get deliveries assigned to current delivery person
// @route   GET /api/orders/mydeliveries
// @access  Private/DeliveryPerson
const getMyDeliveries = asyncHandler(async (req, res) => {
  const orders = await Order.find({ deliveryPersonId: req.user.id })
    .populate('customerId', 'name email phone')
    .populate('pharmacyId', 'name image')
    .populate('items.medicineId', 'name image');
  res.json(orders);
});

module.exports.getAllOrders = getAllOrders;
module.exports.getMyDeliveries = getMyDeliveries;
