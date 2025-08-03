const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    default: () => `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  },
  items: [saleItemSchema],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'check', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'refunded', 'partial'],
    default: 'paid'
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  change: {
    type: Number,
    default: 0,
    min: 0
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  isVoid: {
    type: Boolean,
    default: false
  },
  voidReason: {
    type: String,
    trim: true
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: {
    type: Date
  }
}, {
  timestamps: true
});

saleSchema.index({ tenant: 1, receiptNumber: 1 }, { unique: true });
saleSchema.index({ tenant: 1, createdAt: -1 });
saleSchema.index({ tenant: 1, cashier: 1 });
saleSchema.index({ tenant: 1, customer: 1 });
saleSchema.index({ tenant: 1, paymentStatus: 1 });

module.exports = mongoose.model('Sale', saleSchema);