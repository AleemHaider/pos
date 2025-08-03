const express = require('express');
const { body, validationResult } = require('express-validator');
const Lease = require('../models/Lease');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all leases
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '',
      leaseType = '',
      customer = ''
    } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { leaseNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (leaseType) {
      query.leaseType = leaseType;
    }
    
    if (customer) {
      query.customer = customer;
    }

    const leases = await Lease.find(query)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Lease.countDocuments(query);

    const stats = await Lease.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalLeases: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          totalPaid: { $sum: '$totalPaid' },
          activeLeases: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      leases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: stats[0] || { totalLeases: 0, totalValue: 0, totalPaid: 0, activeLeases: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get lease by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name sku category')
      .populate('createdBy', 'name email');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    res.json({
      success: true,
      lease
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new lease
router.post('/', [
  auth,
  authorize('admin', 'manager'),
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('leaseType').isIn(['rent-to-own', 'rental', 'equipment-lease']).withMessage('Invalid lease type'),
  body('monthlyPayment').isNumeric({ min: 0 }).withMessage('Monthly payment must be positive'),
  body('termMonths').isInt({ min: 1 }).withMessage('Term must be at least 1 month')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer,
      items,
      leaseType,
      monthlyPayment,
      securityDeposit = 0,
      termMonths,
      maintenanceResponsibility = 'lessee',
      renewalOption = false,
      purchaseOption = { enabled: false },
      insuranceRequired = true,
      collateral,
      notes
    } = req.body;

    // Validate customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    let totalValue = 0;
    const processedItems = [];

    // Process items and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      
      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        serialNumbers: item.serialNumbers || []
      });

      totalValue += itemTotal;

      // Update product stock for lease
      product.stock -= item.quantity;
      await product.save();
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);
    
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const lease = new Lease({
      customer,
      items: processedItems,
      leaseType,
      totalValue,
      monthlyPayment,
      securityDeposit,
      termMonths,
      startDate,
      endDate,
      nextPaymentDate,
      maintenanceResponsibility,
      renewalOption,
      purchaseOption,
      insuranceRequired,
      collateral,
      notes,
      createdBy: req.user._id
    });

    await lease.save();
    
    await lease.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.product', select: 'name sku' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Lease created successfully',
      lease
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add payment to lease
router.post('/:id/payment', [
  auth,
  body('amount').isNumeric({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod').isIn(['cash', 'card', 'bank', 'mobile', 'check']).withMessage('Invalid payment method'),
  body('type').isIn(['monthly', 'deposit', 'late-fee', 'damage', 'other']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, type, reference, notes } = req.body;
    const lease = await Lease.findById(req.params.id);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    if (lease.status !== 'active') {
      return res.status(400).json({ message: 'Cannot add payment to inactive lease' });
    }

    // Add payment
    lease.payments.push({
      amount,
      paymentMethod,
      type,
      reference,
      notes
    });

    lease.totalPaid += amount;

    // Update next payment date for monthly payments
    if (type === 'monthly') {
      const nextDate = new Date(lease.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      lease.nextPaymentDate = nextDate;
    }

    // Check if lease should be completed
    if (lease.leaseType === 'rent-to-own') {
      const totalRequired = lease.monthlyPayment * lease.termMonths + lease.securityDeposit;
      if (lease.totalPaid >= totalRequired) {
        lease.status = 'completed';
        lease.ownershipTransferred = true;
      }
    }

    await lease.save();

    res.json({
      success: true,
      message: 'Payment added successfully',
      lease
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add inspection to lease
router.post('/:id/inspection', [
  auth,
  body('condition').isIn(['excellent', 'good', 'fair', 'poor', 'damaged']).withMessage('Invalid condition'),
  body('notes').notEmpty().withMessage('Inspection notes are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { condition, notes, images = [], inspector } = req.body;
    const lease = await Lease.findById(req.params.id);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    lease.inspections.push({
      condition,
      notes,
      images,
      inspector: inspector || req.user.name
    });

    await lease.save();

    res.json({
      success: true,
      message: 'Inspection added successfully',
      lease
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Return leased items
router.post('/:id/return', [
  auth,
  authorize('admin', 'manager'),
  body('returnCondition').isIn(['excellent', 'good', 'fair', 'poor', 'damaged']).withMessage('Invalid return condition')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { returnCondition, notes } = req.body;
    const lease = await Lease.findById(req.params.id).populate('items.product');
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    if (lease.status !== 'active') {
      return res.status(400).json({ message: 'Lease is not active' });
    }

    // Return items to inventory
    for (const item of lease.items) {
      if (item.product) {
        item.product.stock += item.quantity;
        await item.product.save();
      }
    }

    lease.status = 'returned';
    lease.returnCondition = returnCondition;
    if (notes) lease.notes = (lease.notes || '') + '\nReturn Notes: ' + notes;

    await lease.save();

    res.json({
      success: true,
      message: 'Items returned successfully',
      lease
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;