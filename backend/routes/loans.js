const express = require('express');
const { body, validationResult } = require('express-validator');
const Loan = require('../models/Loan');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all loans
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '',
      customer = '',
      overdue = false
    } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { loanNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (customer) {
      query.customer = customer;
    }
    
    if (overdue === 'true') {
      query.nextPaymentDate = { $lt: new Date() };
      query.status = 'active';
    }

    const loans = await Loan.find(query)
      .populate('customer', 'name phone email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Loan.countDocuments(query);

    const stats = await Loan.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: '$totalPayable' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$remainingBalance' }
        }
      }
    ]);

    res.json({
      success: true,
      loans,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: stats[0] || { totalLoans: 0, totalAmount: 0, totalPaid: 0, totalOutstanding: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get loan by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name sku category')
      .populate('createdBy', 'name email');
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({
      success: true,
      loan
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new loan
router.post('/', [
  auth,
  authorize('admin', 'manager'),
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('interestRate').isNumeric({ min: 0, max: 100 }).withMessage('Interest rate must be between 0-100'),
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
      interestRate,
      termMonths,
      collateral,
      guarantor,
      notes
    } = req.body;

    // Validate customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    let totalAmount = 0;
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
        totalPrice: itemTotal
      });

      totalAmount += itemTotal;

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate loan details
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = totalAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / 
                          (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
    const totalPayable = monthlyPayment * termMonths;
    const totalInterest = totalPayable - totalAmount;

    const startDate = new Date();
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + termMonths);
    
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const loan = new Loan({
      customer,
      items: processedItems,
      totalAmount,
      interestRate,
      termMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      remainingBalance: Math.round(totalPayable * 100) / 100,
      startDate,
      dueDate,
      nextPaymentDate,
      collateral,
      guarantor,
      notes,
      createdBy: req.user._id
    });

    await loan.save();
    
    await loan.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.product', select: 'name sku' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      loan
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add payment to loan
router.post('/:id/payment', [
  auth,
  body('amount').isNumeric({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod').isIn(['cash', 'card', 'bank', 'mobile', 'check']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, reference, notes } = req.body;
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({ message: 'Cannot add payment to inactive loan' });
    }

    if (amount > loan.remainingBalance) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining balance' });
    }

    // Add payment
    loan.payments.push({
      amount,
      paymentMethod,
      reference,
      notes
    });

    loan.amountPaid += amount;
    loan.remainingBalance -= amount;

    // Update next payment date
    if (loan.remainingBalance > 0) {
      const nextDate = new Date(loan.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      loan.nextPaymentDate = nextDate;
    } else {
      loan.status = 'completed';
    }

    await loan.save();

    res.json({
      success: true,
      message: 'Payment added successfully',
      loan
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get overdue loans
router.get('/reports/overdue', auth, async (req, res) => {
  try {
    const overdueLoans = await Loan.find({
      status: 'active',
      nextPaymentDate: { $lt: new Date() },
      isActive: true
    })
    .populate('customer', 'name phone email')
    .populate('items.product', 'name')
    .sort({ nextPaymentDate: 1 });

    res.json({
      success: true,
      overdueLoans,
      count: overdueLoans.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;