const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanNumber: {
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
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  termMonths: {
    type: Number,
    required: true,
    min: 1
  },
  monthlyPayment: {
    type: Number,
    required: true,
    min: 0
  },
  totalInterest: {
    type: Number,
    required: true,
    min: 0
  },
  totalPayable: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  nextPaymentDate: {
    type: Date,
    required: true
  },
  collateral: {
    description: String,
    value: Number,
    documents: [String]
  },
  guarantor: {
    name: String,
    phone: String,
    address: String,
    relationship: String
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
    notes: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate loan number
loanSchema.pre('save', async function(next) {
  if (!this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `LN${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate remaining balance
loanSchema.pre('save', function(next) {
  this.remainingBalance = this.totalPayable - this.amountPaid;
  next();
});

module.exports = mongoose.model('Loan', loanSchema);