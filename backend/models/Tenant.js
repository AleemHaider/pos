const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  settings: {
    businessType: {
      type: String,
      enum: ['retail', 'restaurant', 'grocery', 'pharmacy', 'other'],
      default: 'retail'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    taxRate: {
      type: Number,
      default: 0
    },
    logo: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    contact: {
      email: String,
      phone: String,
      website: String
    },
    features: {
      inventory: { type: Boolean, default: true },
      customers: { type: Boolean, default: true },
      loyalty: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      multiLocation: { type: Boolean, default: false },
      advancedReporting: { type: Boolean, default: false }
    },
    limits: {
      maxUsers: { type: Number, default: 3 },
      maxProducts: { type: Number, default: 1000 },
      maxCustomers: { type: Number, default: 500 },
      maxLocations: { type: Number, default: 1 },
      maxTransactionsPerMonth: { type: Number, default: 1000 }
    }
  },
  stats: {
    totalUsers: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    monthlyTransactions: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'trial'],
    default: 'trial'
  },
  trialEndsAt: {
    type: Date,
    default: () => new Date(+new Date() + 14*24*60*60*1000) // 14 days trial
  },
  suspendedAt: Date,
  suspendReason: String,
  metadata: {
    onboardingCompleted: { type: Boolean, default: false },
    lastActivity: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Generate slug from name
tenantSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    const baseSlug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let count = 1;
    
    while (await mongoose.model('Tenant').findOne({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    
    this.slug = slug;
  }
  next();
});

// Indexes
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ owner: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Tenant', tenantSchema);