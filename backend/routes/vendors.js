const express = require('express');
const { body, validationResult } = require('express-validator');
const Vendor = require('../models/Vendor');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all vendors
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '',
      status = 'active'
    } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { vendorNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }

    const vendors = await Vendor.find(query)
      .populate('products', 'name sku category')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Vendor.countDocuments(query);

    const stats = await Vendor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalVendors: { $sum: 1 },
          totalPurchased: { $sum: '$totalPurchased' },
          totalPaid: { $sum: '$totalPaid' },
          totalOutstanding: { $sum: '$currentBalance' },
          activeVendors: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      vendors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: stats[0] || { 
        totalVendors: 0, 
        totalPurchased: 0, 
        totalPaid: 0, 
        totalOutstanding: 0,
        activeVendors: 0 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vendor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('products', 'name sku category price');
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      success: true,
      vendor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new vendor
router.post('/', [
  auth,
  authorize('admin', 'manager'),
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('category').isIn([
    'electronics', 'clothing', 'food', 'books', 'home', 'sports', 'automotive', 'medical', 'other'
  ]).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if vendor with email already exists
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor with this email already exists' });
    }

    const vendor = new Vendor(req.body);
    await vendor.save();

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      vendor
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Vendor with this email already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update vendor
router.put('/:id', [
  auth,
  authorize('admin', 'manager'),
  body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== vendor.email) {
      const existingVendor = await Vendor.findOne({ email: req.body.email });
      if (existingVendor) {
        return res.status(400).json({ message: 'Email already in use by another vendor' });
      }
    }

    Object.assign(vendor, req.body);
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      vendor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete vendor (soft delete)
router.delete('/:id', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.isActive = false;
    vendor.status = 'inactive';
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add payment to vendor
router.post('/:id/payment', [
  auth,
  authorize('admin', 'manager'),
  body('amount').isNumeric({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod').isIn(['cash', 'check', 'wire', 'card', 'bank']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, reference, notes } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (amount > vendor.currentBalance) {
      return res.status(400).json({ message: 'Payment amount exceeds current balance' });
    }

    // Update vendor balances
    vendor.totalPaid += amount;
    vendor.currentBalance -= amount;

    await vendor.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      vendor
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vendor performance stats
router.get('/:id/performance', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // This would typically involve aggregating purchase orders, delivery times, etc.
    const performance = {
      totalOrders: 0, // Would come from PurchaseOrder model
      onTimeDeliveries: 0,
      avgDeliveryTime: 0,
      qualityRating: vendor.rating,
      totalSpent: vendor.totalPurchased,
      currentBalance: vendor.currentBalance,
      paymentHistory: vendor.totalPaid
    };

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;