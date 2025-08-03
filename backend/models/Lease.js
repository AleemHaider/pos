const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  leaseNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
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
    serialNumbers: [String]
  }],
  leaseType: {
    type: String,
    enum: ['rent-to-own', 'rental', 'equipment-lease'],
    required: true
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyPayment: {
    type: Number,
    required: true,
    min: 0
  },
  securityDeposit: {
    type: Number,
    default: 0,
    min: 0
  },
  termMonths: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  nextPaymentDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'overdue', 'returned'],
    default: 'active'
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  ownershipTransferred: {
    type: Boolean,
    default: false
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  maintenanceResponsibility: {
    type: String,
    enum: ['lessee', 'lessor', 'shared'],
    default: 'lessee'
  },
  renewalOption: {
    type: Boolean,
    default: false
  },
  purchaseOption: {
    enabled: {
      type: Boolean,
      default: false
    },
    price: Number,
    exercisableAfter: Number // months
  },
  insuranceRequired: {
    type: Boolean,
    default: true
  },
  collateral: {
    description: String,
    value: Number,
    documents: [String]
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payments: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank', 'mobile', 'check']
    },
    reference: String,
    type: {
      type: String,
      enum: ['monthly', 'deposit', 'late-fee', 'damage', 'other'],
      default: 'monthly'
    },
    notes: String
  }],
  inspections: [{
    date: {
      type: Date,
      default: Date.now
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
    },
    notes: String,
    images: [String],
    inspector: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate lease number
leaseSchema.pre('save', async function(next) {
  if (!this.leaseNumber) {
    const count = await mongoose.model('Lease').countDocuments();
    this.leaseNumber = `LS${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Lease', leaseSchema);