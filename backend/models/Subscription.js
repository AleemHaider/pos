const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'cancelled', 'expired', 'paused'],
    default: 'trialing'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  trialEnd: Date,
  cancelledAt: Date,
  cancelReason: String,
  pausedAt: Date,
  pauseReason: String,
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  stripePaymentMethodId: String,
  lastPayment: {
    amount: Number,
    currency: String,
    date: Date,
    status: String,
    invoiceId: String
  },
  nextPayment: {
    amount: Number,
    currency: String,
    date: Date
  },
  paymentHistory: [{
    amount: Number,
    currency: String,
    date: Date,
    status: String,
    invoiceId: String,
    description: String
  }],
  usage: {
    users: { type: Number, default: 0 },
    products: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    transactions: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  notifications: {
    paymentFailed: { type: Boolean, default: false },
    usageLimitWarning: { type: Boolean, default: false },
    trialEndingWarning: { type: Boolean, default: false }
  },
  metadata: {
    source: String,
    campaign: String,
    referrer: String,
    notes: String
  }
}, {
  timestamps: true
});

// Calculate next period end based on billing cycle
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('currentPeriodStart') || this.isModified('billingCycle')) {
    const start = new Date(this.currentPeriodStart);
    if (this.billingCycle === 'yearly') {
      this.currentPeriodEnd = new Date(start.setFullYear(start.getFullYear() + 1));
    } else {
      this.currentPeriodEnd = new Date(start.setMonth(start.getMonth() + 1));
    }
  }
  next();
});

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return ['active', 'trialing'].includes(this.status) && 
         (!this.currentPeriodEnd || this.currentPeriodEnd > new Date());
};

// Check if in trial
subscriptionSchema.methods.isInTrial = function() {
  return this.status === 'trialing' && 
         this.trialEnd && 
         this.trialEnd > new Date();
};

// Get days remaining in trial
subscriptionSchema.methods.trialDaysRemaining = function() {
  if (!this.isInTrial()) return 0;
  const days = Math.ceil((this.trialEnd - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

// Indexes
subscriptionSchema.index({ tenant: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);