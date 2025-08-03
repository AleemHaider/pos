const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

// Middleware to ensure tenant context is set
const tenantContext = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Skip tenant check for superadmin
    if (req.user && req.user.role === 'superadmin') {
      logger.debug('Tenant context skipped for superadmin', { 
        userId: req.user._id,
        email: req.user.email 
      });
      return next();
    }

    // Get tenant ID from various sources
    let tenantId = req.headers['x-tenant-id'] || 
                   req.query.tenantId || 
                   req.body.tenantId ||
                   (req.user && req.user.currentTenant);

    if (!tenantId && req.user && req.user.tenant) {
      tenantId = req.user.tenant;
    }

    if (!tenantId) {
      logger.warn('Tenant context missing', {
        userId: req.user?._id,
        url: req.originalUrl,
        method: req.method,
        headers: Object.keys(req.headers)
      });
      return res.status(400).json({ 
        success: false,
        message: 'Tenant context is required' 
      });
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      logger.warn('Tenant not found', { 
        tenantId,
        userId: req.user?._id,
        requestedBy: req.user?.email 
      });
      return res.status(404).json({ 
        success: false,
        message: 'Tenant not found' 
      });
    }

    if (tenant.status !== 'active' && tenant.status !== 'trial') {
      logger.tenantOperation('access_denied', tenantId, req.user?._id, false, 
        new Error(`Tenant status: ${tenant.status}`));
      return res.status(403).json({ 
        success: false,
        message: 'Tenant is not active',
        status: tenant.status 
      });
    }

    // Check if user has access to this tenant
    if (req.user && !req.user.hasTenantAccess(tenantId)) {
      logger.tenantOperation('access_denied', tenantId, req.user._id, false, 
        new Error('User does not have access to tenant'));
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this tenant' 
      });
    }

    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenant._id;

    // Set user's role for this tenant
    if (req.user) {
      req.userTenantRole = req.user.getTenantRole(tenantId);
    }

    logger.debug('Tenant context established', {
      tenantId: tenant._id,
      tenantName: tenant.name,
      userId: req.user?._id,
      userRole: req.userTenantRole,
      duration: Date.now() - startTime
    });

    next();
  } catch (error) {
    logger.error('Tenant context error', error, {
      userId: req.user?._id,
      url: req.originalUrl,
      method: req.method
    });
    res.status(500).json({ 
      success: false,
      message: 'Error setting tenant context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check subscription status
const checkSubscription = (requiredFeatures = []) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ 
          success: false,
          message: 'Tenant context required' 
        });
      }

      // Load subscription
      const subscription = await Subscription.findOne({ 
        tenant: req.tenant._id 
      }).populate('plan');

      if (!subscription) {
        return res.status(403).json({ 
          success: false,
          message: 'No active subscription found' 
        });
      }

      // Check if subscription is active
      if (!subscription.isActive()) {
        return res.status(403).json({ 
          success: false,
          message: 'Subscription is not active',
          status: subscription.status 
        });
      }

      // Check if trial has expired
      if (subscription.status === 'trialing' && !subscription.isInTrial()) {
        return res.status(403).json({ 
          success: false,
          message: 'Trial period has expired',
          trialEndDate: subscription.trialEnd 
        });
      }

      // Check required features
      if (requiredFeatures.length > 0) {
        const plan = subscription.plan;
        const missingFeatures = requiredFeatures.filter(
          feature => !plan.features[feature]
        );

        if (missingFeatures.length > 0) {
          return res.status(403).json({ 
            success: false,
            message: 'Your plan does not include required features',
            missingFeatures,
            currentPlan: plan.name 
          });
        }
      }

      // Attach subscription to request
      req.subscription = subscription;
      req.plan = subscription.plan;

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error checking subscription',
        error: error.message 
      });
    }
  };
};

// Middleware to check usage limits
const checkUsageLimits = (resource) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant || !req.plan) {
        return next();
      }

      const tenant = req.tenant;
      const limits = req.plan.limits;

      switch (resource) {
        case 'users':
          if (tenant.stats.totalUsers >= limits.maxUsers) {
            return res.status(403).json({ 
              success: false,
              message: 'User limit reached',
              limit: limits.maxUsers,
              current: tenant.stats.totalUsers 
            });
          }
          break;

        case 'products':
          if (tenant.stats.totalProducts >= limits.maxProducts) {
            return res.status(403).json({ 
              success: false,
              message: 'Product limit reached',
              limit: limits.maxProducts,
              current: tenant.stats.totalProducts 
            });
          }
          break;

        case 'customers':
          if (tenant.stats.totalCustomers >= limits.maxCustomers) {
            return res.status(403).json({ 
              success: false,
              message: 'Customer limit reached',
              limit: limits.maxCustomers,
              current: tenant.stats.totalCustomers 
            });
          }
          break;

        case 'transactions':
          if (tenant.stats.monthlyTransactions >= limits.maxTransactionsPerMonth) {
            return res.status(403).json({ 
              success: false,
              message: 'Monthly transaction limit reached',
              limit: limits.maxTransactionsPerMonth,
              current: tenant.stats.monthlyTransactions 
            });
          }
          break;
      }

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error checking usage limits',
        error: error.message 
      });
    }
  };
};

// Middleware to ensure user has specific role in tenant
const requireTenantRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userTenantRole) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Superadmin always has access
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(req.userTenantRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.userTenantRole 
      });
    }

    next();
  };
};

module.exports = {
  tenantContext,
  checkSubscription,
  checkUsageLimits,
  requireTenantRole
};