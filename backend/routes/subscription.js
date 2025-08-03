const express = require('express');
const { body, validationResult } = require('express-validator');
const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { tenantContext, requireTenantRole } = require('../middleware/tenant');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Get all available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .sort('order')
      .select('-stripeProductId -stripePriceIds');

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching plans',
      error: error.message 
    });
  }
});

// Get current subscription for tenant
router.get('/current', [auth, tenantContext], async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      tenant: req.tenantId 
    }).populate('plan');

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'No subscription found' 
      });
    }

    res.json({
      success: true,
      subscription: {
        ...subscription.toObject(),
        isActive: subscription.isActive(),
        isInTrial: subscription.isInTrial(),
        trialDaysRemaining: subscription.trialDaysRemaining()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching subscription',
      error: error.message 
    });
  }
});

// Create a new subscription (start trial)
router.post('/create', [
  auth,
  body('planId').notEmpty().withMessage('Plan ID is required'),
  body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, billingCycle } = req.body;

    // Check if user already has a tenant
    if (req.user.tenant) {
      return res.status(400).json({ 
        success: false,
        message: 'User already belongs to a tenant' 
      });
    }

    // Get the plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid plan selected' 
      });
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.name,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    // Create new tenant
    const tenant = new Tenant({
      name: req.body.shopName || `${req.user.name}'s Shop`,
      owner: req.user._id,
      settings: {
        businessType: req.body.businessType || 'retail',
        currency: req.body.currency || 'USD',
        timezone: req.body.timezone || 'America/New_York',
        taxRate: req.body.taxRate || 0,
        features: plan.features,
        limits: plan.limits
      },
      status: 'trial'
    });

    await tenant.save();

    // Create subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + plan.trialDays);

    const subscription = new Subscription({
      tenant: tenant._id,
      plan: plan._id,
      status: 'trialing',
      billingCycle,
      trialEnd,
      stripeCustomerId: stripeCustomer.id,
      metadata: {
        source: req.body.source || 'web'
      }
    });

    await subscription.save();

    // Update tenant with subscription
    tenant.subscription = subscription._id;
    await tenant.save();

    // Update user with tenant
    req.user.tenant = tenant._id;
    req.user.currentTenant = tenant._id;
    req.user.role = 'owner';
    req.user.tenants.push({
      tenant: tenant._id,
      role: 'owner',
      joinedAt: new Date()
    });
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      tenant,
      subscription: {
        ...subscription.toObject(),
        isActive: subscription.isActive(),
        isInTrial: subscription.isInTrial(),
        trialDaysRemaining: subscription.trialDaysRemaining()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating subscription',
      error: error.message 
    });
  }
});

// Upgrade/Downgrade subscription
router.put('/change-plan', [
  auth,
  tenantContext,
  requireTenantRole('owner'),
  body('planId').notEmpty().withMessage('Plan ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.body;

    const subscription = await Subscription.findOne({ 
      tenant: req.tenantId 
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'No subscription found' 
      });
    }

    const newPlan = await Plan.findById(planId);
    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid plan selected' 
      });
    }

    // Update Stripe subscription if not in trial
    if (subscription.status !== 'trialing' && subscription.stripeSubscriptionId) {
      const stripePriceId = subscription.billingCycle === 'yearly' 
        ? newPlan.stripePriceIds.yearly 
        : newPlan.stripePriceIds.monthly;

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: subscription.stripeSubscriptionItemId,
          price: stripePriceId
        }],
        proration_behavior: 'create_prorations'
      });
    }

    // Update subscription
    subscription.plan = newPlan._id;
    await subscription.save();

    // Update tenant limits and features
    req.tenant.settings.features = newPlan.features;
    req.tenant.settings.limits = newPlan.limits;
    await req.tenant.save();

    res.json({
      success: true,
      message: 'Plan changed successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error changing plan',
      error: error.message 
    });
  }
});

// Cancel subscription
router.post('/cancel', [
  auth,
  tenantContext,
  requireTenantRole('owner'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      tenant: req.tenantId 
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'No subscription found' 
      });
    }

    // Cancel Stripe subscription
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update subscription
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = req.body.reason || 'User requested cancellation';
    await subscription.save();

    // Update tenant status
    req.tenant.status = 'cancelled';
    await req.tenant.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error cancelling subscription',
      error: error.message 
    });
  }
});

// Create checkout session for payment
router.post('/create-checkout-session', [
  auth,
  tenantContext,
  requireTenantRole('owner')
], async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      tenant: req.tenantId 
    }).populate('plan');

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'No subscription found' 
      });
    }

    const plan = subscription.plan;
    const priceId = subscription.billingCycle === 'yearly' 
      ? plan.stripePriceIds.yearly 
      : plan.stripePriceIds.monthly;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      customer: subscription.stripeCustomerId,
      metadata: {
        tenantId: req.tenantId.toString(),
        subscriptionId: subscription._id.toString()
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating checkout session',
      error: error.message 
    });
  }
});

// Handle Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update subscription status
        const subscription = await Subscription.findById(
          session.metadata.subscriptionId
        );
        
        if (subscription) {
          subscription.status = 'active';
          subscription.stripeSubscriptionId = session.subscription;
          await subscription.save();

          // Update tenant status
          const tenant = await Tenant.findById(subscription.tenant);
          if (tenant) {
            tenant.status = 'active';
            await tenant.save();
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        
        // Record payment
        const subForPayment = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription
        });
        
        if (subForPayment) {
          subForPayment.lastPayment = {
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            date: new Date(),
            status: 'succeeded',
            invoiceId: invoice.id
          };
          
          subForPayment.paymentHistory.push({
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            date: new Date(),
            status: 'succeeded',
            invoiceId: invoice.id,
            description: invoice.description
          });
          
          await subForPayment.save();
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        
        // Update subscription status
        const subForFailure = await Subscription.findOne({
          stripeSubscriptionId: failedInvoice.subscription
        });
        
        if (subForFailure) {
          subForFailure.status = 'past_due';
          subForFailure.notifications.paymentFailed = true;
          await subForFailure.save();

          // Update tenant status
          const tenant = await Tenant.findById(subForFailure.tenant);
          if (tenant) {
            tenant.status = 'suspended';
            tenant.suspendedAt = new Date();
            tenant.suspendReason = 'Payment failed';
            await tenant.save();
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        
        // Cancel subscription
        const subToCancel = await Subscription.findOne({
          stripeSubscriptionId: deletedSub.id
        });
        
        if (subToCancel) {
          subToCancel.status = 'expired';
          await subToCancel.save();

          // Update tenant status
          const tenant = await Tenant.findById(subToCancel.tenant);
          if (tenant) {
            tenant.status = 'cancelled';
            await tenant.save();
          }
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

// Get usage statistics
router.get('/usage', [auth, tenantContext], async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      tenant: req.tenantId 
    }).populate('plan');

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'No subscription found' 
      });
    }

    const usage = {
      users: {
        used: req.tenant.stats.totalUsers,
        limit: subscription.plan.limits.maxUsers,
        percentage: (req.tenant.stats.totalUsers / subscription.plan.limits.maxUsers) * 100
      },
      products: {
        used: req.tenant.stats.totalProducts,
        limit: subscription.plan.limits.maxProducts,
        percentage: (req.tenant.stats.totalProducts / subscription.plan.limits.maxProducts) * 100
      },
      customers: {
        used: req.tenant.stats.totalCustomers,
        limit: subscription.plan.limits.maxCustomers,
        percentage: (req.tenant.stats.totalCustomers / subscription.plan.limits.maxCustomers) * 100
      },
      transactions: {
        used: req.tenant.stats.monthlyTransactions,
        limit: subscription.plan.limits.maxTransactionsPerMonth,
        percentage: (req.tenant.stats.monthlyTransactions / subscription.plan.limits.maxTransactionsPerMonth) * 100
      }
    };

    res.json({
      success: true,
      usage
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching usage',
      error: error.message 
    });
  }
});

module.exports = router;