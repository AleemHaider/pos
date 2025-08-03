const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      active = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (active !== '') {
      query.isActive = active === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(query)
      .populate('createdBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/search/:query', auth, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    
    const customers = await Customer.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { phone: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name phone email loyaltyPoints totalSpent')
    .limit(10);

    res.json({
      success: true,
      customers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/top-customers', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const customers = await Customer.find({ isActive: true })
      .sort({ totalSpent: -1 })
      .limit(parseInt(limit))
      .select('name phone email totalSpent loyaltyPoints lastVisit');

    res.json({
      success: true,
      customers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'name');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const salesCount = await Sale.countDocuments({ 
      customer: customer._id,
      isVoid: false
    });

    const recentSales = await Sale.find({ 
      customer: customer._id,
      isVoid: false
    })
    .populate('cashier', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('receiptNumber total createdAt cashier paymentMethod');

    res.json({
      success: true,
      customer,
      salesCount,
      recentSales
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Customer name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, email, phone, address, dateOfBirth, gender, notes
    } = req.body;

    if (email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
    }

    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      notes,
      createdBy: req.user._id
    });

    await customer.save();
    await customer.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Customer name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const {
      name, email, phone, address, dateOfBirth, gender, notes, isActive
    } = req.body;

    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
    }

    if (phone && phone !== customer.phone) {
      const existingPhone = await Customer.findOne({ 
        phone, 
        _id: { $ne: req.params.id } 
      });
      if (existingPhone) {
        return res.status(400).json({ message: 'Customer with this phone number already exists' });
      }
    }

    Object.assign(customer, {
      name: name || customer.name,
      email: email || customer.email,
      phone: phone || customer.phone,
      address: address || customer.address,
      dateOfBirth: dateOfBirth || customer.dateOfBirth,
      gender: gender || customer.gender,
      notes: notes || customer.notes,
      isActive: typeof isActive === 'boolean' ? isActive : customer.isActive
    });

    await customer.save();
    await customer.populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/loyalty', [
  auth,
  authorize('admin', 'manager'),
  body('points').isNumeric().withMessage('Points must be a number'),
  body('type').isIn(['add', 'subtract', 'set']).withMessage('Type must be add, subtract, or set')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points, type, reason } = req.body;
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let newPoints;
    switch (type) {
      case 'add':
        newPoints = customer.loyaltyPoints + points;
        break;
      case 'subtract':
        newPoints = Math.max(0, customer.loyaltyPoints - points);
        break;
      case 'set':
        newPoints = Math.max(0, points);
        break;
    }

    customer.loyaltyPoints = newPoints;
    await customer.save();

    res.json({
      success: true,
      message: 'Loyalty points updated successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        previousPoints: type === 'set' ? null : (type === 'add' ? customer.loyaltyPoints - points : customer.loyaltyPoints + points),
        currentPoints: newPoints,
        change: points,
        type,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/sales', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const sales = await Sale.find({ 
      customer: customer._id,
      isVoid: false
    })
    .populate('cashier', 'name')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .select('receiptNumber total createdAt cashier paymentMethod items');

    const total = await Sale.countDocuments({ 
      customer: customer._id,
      isVoid: false
    });

    const stats = await Sale.aggregate([
      {
        $match: { 
          customer: customer._id,
          isVoid: false
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: stats[0] || { totalSpent: 0, totalTransactions: 0, averageTransaction: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const salesCount = await Sale.countDocuments({ 
      customer: customer._id,
      isVoid: false
    });

    if (salesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete customer. ${salesCount} sales are associated with this customer.` 
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;