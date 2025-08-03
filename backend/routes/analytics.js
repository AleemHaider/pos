const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get sales analytics
router.get('/sales', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { period = '30', startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      dateFilter = { createdAt: { $gte: daysAgo } };
    }

    // Sales overview
    const salesOverview = await Sale.aggregate([
      { $match: { isVoid: false, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalItemsSold: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);

    // Daily sales trend
    const dailySales = await Sale.aggregate([
      { $match: { isVoid: false, ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      { $match: { isVoid: false, ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ]);

    // Payment method breakdown
    const paymentMethods = await Sale.aggregate([
      { $match: { isVoid: false, ...dateFilter } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    // Hourly sales pattern
    const hourlySales = await Sale.aggregate([
      { $match: { isVoid: false, ...dateFilter } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: salesOverview[0] || {
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItemsSold: 0
        },
        dailySales,
        topProducts,
        paymentMethods,
        hourlySales
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get inventory analytics
router.get('/inventory', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    // Low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true
    }).populate('category');

    // Inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
          totalRetailValue: { $sum: { $multiply: ['$stock', '$price'] } }
        }
      }
    ]);

    // Category-wise inventory
    const categoryInventory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          productCount: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        lowStockProducts,
        overview: inventoryValue[0] || {
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          totalRetailValue: 0
        },
        categoryBreakdown: categoryInventory
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer analytics
router.get('/customers', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    // Customer overview
    const customerOverview = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalLoyaltyPoints: { $sum: '$loyaltyPoints' },
          totalSpent: { $sum: '$totalSpent' }
        }
      }
    ]);

    // Top customers by spending
    const topCustomers = await Customer.find({ isActive: true })
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name email phone totalSpent loyaltyPoints');

    // New customers trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newCustomers = await Customer.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: customerOverview[0] || {
          totalCustomers: 0,
          activeCustomers: 0,
          totalLoyaltyPoints: 0,
          totalSpent: 0
        },
        topCustomers,
        newCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;