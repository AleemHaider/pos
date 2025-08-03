const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('./models/Plan');

dotenv.config();

const plans = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small shops and new businesses',
    price: {
      monthly: 29,
      yearly: 290
    },
    features: {
      inventory: true,
      customers: true,
      loyalty: false,
      analytics: false,
      multiLocation: false,
      advancedReporting: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false
    },
    limits: {
      maxUsers: 3,
      maxProducts: 500,
      maxCustomers: 250,
      maxLocations: 1,
      maxTransactionsPerMonth: 1000,
      dataRetentionDays: 90
    },
    isActive: true,
    isPopular: false,
    order: 1,
    trialDays: 14,
    metadata: {
      color: '#10B981',
      icon: 'store',
      badge: null
    }
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'For growing businesses with advanced needs',
    price: {
      monthly: 79,
      yearly: 790
    },
    features: {
      inventory: true,
      customers: true,
      loyalty: true,
      analytics: true,
      multiLocation: false,
      advancedReporting: true,
      apiAccess: false,
      customBranding: true,
      prioritySupport: false
    },
    limits: {
      maxUsers: 10,
      maxProducts: 2000,
      maxCustomers: 1000,
      maxLocations: 1,
      maxTransactionsPerMonth: 5000,
      dataRetentionDays: 365
    },
    isActive: true,
    isPopular: true,
    order: 2,
    trialDays: 14,
    metadata: {
      color: '#3B82F6',
      icon: 'trending_up',
      badge: 'Most Popular'
    }
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Complete solution for large businesses',
    price: {
      monthly: 199,
      yearly: 1990
    },
    features: {
      inventory: true,
      customers: true,
      loyalty: true,
      analytics: true,
      multiLocation: true,
      advancedReporting: true,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true
    },
    limits: {
      maxUsers: 50,
      maxProducts: 10000,
      maxCustomers: 5000,
      maxLocations: 10,
      maxTransactionsPerMonth: 50000,
      dataRetentionDays: 730
    },
    isActive: true,
    isPopular: false,
    order: 3,
    trialDays: 30,
    metadata: {
      color: '#7C3AED',
      icon: 'business',
      badge: null
    }
  }
];

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    // Insert new plans
    for (const planData of plans) {
      const plan = new Plan(planData);
      await plan.save();
      console.log(`Created plan: ${plan.name}`);
    }

    console.log('All plans seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();