const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');
const { tenantContext, checkSubscription, checkUsageLimits } = require('../middleware/tenant');

const router = express.Router();

router.get('/', [auth, tenantContext], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      startDate = '', 
      endDate = '',
      cashier = '',
      paymentMethod = '',
      paymentStatus = ''
    } = req.query;
    
    const query = { tenant: req.tenantId, isVoid: false };
    
    if (search) {
      query.receiptNumber = { $regex: search, $options: 'i' };
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (cashier) {
      query.cashier = cashier;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const sales = await Sale.find(query)
      .populate('cashier', 'name')
      .populate('customer', 'name phone')
      .populate('items.product', 'name sku')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Sale.countDocuments(query);

    const totalSales = await Sale.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      totalAmount: totalSales[0]?.totalAmount || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/today', auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isVoid: false
    })
    .populate('cashier', 'name')
    .populate('customer', 'name')
    .sort({ createdAt: -1 });

    const stats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isVoid: false
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);

    res.json({
      success: true,
      sales,
      stats: stats[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'name email')
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name sku category');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({
      success: true,
      sale
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', [
  auth,
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isNumeric({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('paymentMethod').isIn(['cash', 'card', 'mobile', 'check', 'other']).withMessage('Invalid payment method'),
  body('amountPaid').isNumeric({ min: 0 }).withMessage('Amount paid must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      items,
      customer,
      tax = 0,
      discount = 0,
      paymentMethod,
      amountPaid,
      loyaltyPointsUsed = 0,
      notes
    } = req.body;

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }

      if (!product.isActive) {
        return res.status(400).json({ message: `Product is not active: ${product.name}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      
      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal - itemDiscount,
        discount: itemDiscount
      });

      subtotal += itemTotal - itemDiscount;

      product.stock -= item.quantity;
      await product.save();
    }

    const total = subtotal + tax - discount - loyaltyPointsUsed;
    const change = Math.max(0, amountPaid - total);

    let customerDoc = null;
    if (customer) {
      customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        customerDoc.totalSpent += total;
        customerDoc.lastVisit = new Date();
        
        const loyaltyPointsEarned = Math.floor(total / 10);
        customerDoc.loyaltyPoints += loyaltyPointsEarned - loyaltyPointsUsed;
        
        await customerDoc.save();
      }
    }

    const sale = new Sale({
      items: processedItems,
      customer: customer || undefined,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      amountPaid,
      change,
      cashier: req.user._id,
      notes,
      loyaltyPointsEarned: customerDoc ? Math.floor(total / 10) : 0,
      loyaltyPointsUsed
    });

    await sale.save();
    
    await sale.populate([
      { path: 'cashier', select: 'name' },
      { path: 'customer', select: 'name phone' },
      { path: 'items.product', select: 'name sku' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      sale
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/void', [
  auth,
  authorize('admin', 'manager'),
  body('reason').notEmpty().withMessage('Void reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    const sale = await Sale.findById(req.params.id).populate('items.product');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.isVoid) {
      return res.status(400).json({ message: 'Sale is already voided' });
    }

    for (const item of sale.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.totalSpent = Math.max(0, customer.totalSpent - sale.total);
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - sale.loyaltyPointsEarned + sale.loyaltyPointsUsed);
        await customer.save();
      }
    }

    sale.isVoid = true;
    sale.voidReason = reason;
    sale.voidedBy = req.user._id;
    sale.voidedAt = new Date();

    await sale.save();

    res.json({
      success: true,
      message: 'Sale voided successfully',
      sale
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/receipt/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'name')
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name sku');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const receipt = {
      receiptNumber: sale.receiptNumber,
      date: sale.createdAt,
      cashier: sale.cashier.name,
      customer: sale.customer ? {
        name: sale.customer.name,
        phone: sale.customer.phone
      } : null,
      items: sale.items.map(item => ({
        name: item.productName,
        sku: item.product?.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice
      })),
      subtotal: sale.subtotal,
      tax: sale.tax,
      discount: sale.discount,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      amountPaid: sale.amountPaid,
      change: sale.change,
      loyaltyPointsEarned: sale.loyaltyPointsEarned,
      loyaltyPointsUsed: sale.loyaltyPointsUsed
    };

    res.json({
      success: true,
      receipt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;