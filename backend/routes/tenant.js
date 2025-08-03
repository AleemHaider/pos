const express = require('express');
const { body, validationResult } = require('express-validator');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { tenantContext, requireTenantRole } = require('../middleware/tenant');

const router = express.Router();

// Get current tenant details
router.get('/current', [auth, tenantContext], async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId)
      .populate('owner', 'name email')
      .populate('subscription');

    if (!tenant) {
      return res.status(404).json({ 
        success: false,
        message: 'Tenant not found' 
      });
    }

    res.json({
      success: true,
      tenant,
      userRole: req.userTenantRole
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tenant',
      error: error.message 
    });
  }
});

// Update tenant settings
router.put('/settings', [
  auth,
  tenantContext,
  requireTenantRole('owner', 'admin'),
  body('name').optional().notEmpty(),
  body('settings.businessType').optional().isIn(['retail', 'restaurant', 'grocery', 'pharmacy', 'other']),
  body('settings.currency').optional().isString(),
  body('settings.timezone').optional().isString(),
  body('settings.taxRate').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    
    if (req.body.name) updates.name = req.body.name;
    if (req.body.settings) {
      Object.keys(req.body.settings).forEach(key => {
        updates[`settings.${key}`] = req.body.settings[key];
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Tenant settings updated',
      tenant
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating tenant',
      error: error.message 
    });
  }
});

// Get tenant users
router.get('/users', [
  auth,
  tenantContext,
  requireTenantRole('owner', 'admin')
], async (req, res) => {
  try {
    const users = await User.find({
      'tenants.tenant': req.tenantId
    }).select('-password');

    // Map users with their tenant-specific roles
    const tenantUsers = users.map(user => {
      const tenantAccess = user.tenants.find(
        t => t.tenant.toString() === req.tenantId.toString()
      );
      
      return {
        ...user.toObject(),
        tenantRole: tenantAccess ? tenantAccess.role : null,
        joinedAt: tenantAccess ? tenantAccess.joinedAt : null
      };
    });

    res.json({
      success: true,
      users: tenantUsers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

// Invite user to tenant
router.post('/invite', [
  auth,
  tenantContext,
  requireTenantRole('owner', 'admin'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'manager', 'cashier']).withMessage('Invalid role'),
  body('name').optional().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role, name } = req.body;

    // Check tenant user limit
    if (req.tenant.stats.totalUsers >= req.plan.limits.maxUsers) {
      return res.status(403).json({ 
        success: false,
        message: 'User limit reached for your plan',
        limit: req.plan.limits.maxUsers 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Check if user already has access to this tenant
      if (user.hasTenantAccess(req.tenantId)) {
        return res.status(400).json({ 
          success: false,
          message: 'User already has access to this shop' 
        });
      }

      // Add user to tenant
      user.addToTenant(req.tenantId, role);
      await user.save();
    } else {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: tempPassword,
        tenant: req.tenantId,
        currentTenant: req.tenantId,
        role: role,
        tenants: [{
          tenant: req.tenantId,
          role: role,
          joinedAt: new Date()
        }]
      });

      await user.save();

      // TODO: Send invitation email with temporary password
    }

    // Update tenant user count
    req.tenant.stats.totalUsers += 1;
    await req.tenant.save();

    res.status(201).json({
      success: true,
      message: 'User invited successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        tenantRole: role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error inviting user',
      error: error.message 
    });
  }
});

// Remove user from tenant
router.delete('/users/:userId', [
  auth,
  tenantContext,
  requireTenantRole('owner', 'admin')
], async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent owner from removing themselves
    if (userId === req.tenant.owner.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot remove shop owner' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Remove tenant access
    user.tenants = user.tenants.filter(
      t => t.tenant.toString() !== req.tenantId.toString()
    );

    // If this was their current tenant, clear it
    if (user.currentTenant?.toString() === req.tenantId.toString()) {
      user.currentTenant = user.tenants.length > 0 ? user.tenants[0].tenant : null;
    }

    // If this was their only tenant, clear tenant field
    if (user.tenant?.toString() === req.tenantId.toString() && user.tenants.length === 0) {
      user.tenant = null;
    }

    await user.save();

    // Update tenant user count
    req.tenant.stats.totalUsers = Math.max(0, req.tenant.stats.totalUsers - 1);
    await req.tenant.save();

    res.json({
      success: true,
      message: 'User removed successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error removing user',
      error: error.message 
    });
  }
});

// Update user role in tenant
router.put('/users/:userId/role', [
  auth,
  tenantContext,
  requireTenantRole('owner'),
  body('role').isIn(['admin', 'manager', 'cashier']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Find and update tenant access
    const tenantAccess = user.tenants.find(
      t => t.tenant.toString() === req.tenantId.toString()
    );

    if (!tenantAccess) {
      return res.status(404).json({ 
        success: false,
        message: 'User does not have access to this tenant' 
      });
    }

    tenantAccess.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating user role',
      error: error.message 
    });
  }
});

// Switch current tenant for user
router.post('/switch', [
  auth,
  body('tenantId').notEmpty().withMessage('Tenant ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tenantId } = req.body;

    // Verify user has access to the tenant
    if (!req.user.hasTenantAccess(tenantId)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this tenant' 
      });
    }

    // Update current tenant
    req.user.currentTenant = tenantId;
    await req.user.save();

    // Get tenant details
    const tenant = await Tenant.findById(tenantId);

    res.json({
      success: true,
      message: 'Tenant switched successfully',
      tenant,
      role: req.user.getTenantRole(tenantId)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error switching tenant',
      error: error.message 
    });
  }
});

// Get tenant statistics
router.get('/stats', [auth, tenantContext], async (req, res) => {
  try {
    // Calculate additional statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const Sale = require('../models/Sale');
    const todaysSales = await Sale.countDocuments({
      tenant: req.tenantId,
      createdAt: { $gte: today, $lt: tomorrow },
      isVoid: false
    });

    const todaysRevenue = await Sale.aggregate([
      {
        $match: {
          tenant: req.tenant._id,
          createdAt: { $gte: today, $lt: tomorrow },
          isVoid: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        ...req.tenant.stats,
        todaysSales,
        todaysRevenue: todaysRevenue[0]?.total || 0,
        subscriptionStatus: req.tenant.status,
        trialEndsAt: req.tenant.trialEndsAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics',
      error: error.message 
    });
  }
});

module.exports = router;