const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    monthly: {
      type: Number,
      required: true,
      min: 0
    },
    yearly: {
      type: Number,
      required: true,
      min: 0
    }
  },
  currency: {
    type: String,
    default: 'USD'
  },
  features: {
    inventory: { type: Boolean, default: true },
    customers: { type: Boolean, default: true },
    loyalty: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    multiLocation: { type: Boolean, default: false },
    advancedReporting: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false }
  },
  limits: {
    maxUsers: {
      type: Number,
      required: true
    },
    maxProducts: {
      type: Number,
      required: true
    },
    maxCustomers: {
      type: Number,
      required: true
    },
    maxLocations: {
      type: Number,
      default: 1
    },
    maxTransactionsPerMonth: {
      type: Number,
      required: true
    },
    dataRetentionDays: {
      type: Number,
      default: 365
    }
  },
  stripeProductId: {
    type: String,
    sparse: true
  },
  stripePriceIds: {
    monthly: String,
    yearly: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  trialDays: {
    type: Number,
    default: 14
  },
  metadata: {
    color: String,
    icon: String,
    badge: String
  }
}, {
  timestamps: true
});

// Generate slug from name
planSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
planSchema.index({ slug: 1 });
planSchema.index({ isActive: 1 });
planSchema.index({ order: 1 });

module.exports = mongoose.model('Plan', planSchema);