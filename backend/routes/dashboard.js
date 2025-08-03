const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      todayStats,
      weekStats,
      monthStats,
      yearStats,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      activeUsers
    ] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay },
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
      ]),
      
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek },
            isVoid: false
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            isVoid: false
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear },
            isVoid: false
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      
      Product.countDocuments({ isActive: true }),
      
      Product.countDocuments({
        $expr: { $lte: ['$stock', '$minStock'] },
        isActive: true
      }),
      
      Customer.countDocuments({ isActive: true }),
      
      User.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      stats: {
        today: todayStats[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 },
        week: weekStats[0] || { totalSales: 0, totalRevenue: 0 },
        month: monthStats[0] || { totalSales: 0, totalRevenue: 0 },
        year: yearStats[0] || { totalSales: 0, totalRevenue: 0 },
        inventory: {
          totalProducts,
          lowStockProducts
        },
        customers: {
          totalCustomers
        },
        users: {
          activeUsers
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/sales-chart', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let matchStage = { isVoid: false };
    let groupStage = {};
    let dateFormat = '';
    
    const now = new Date();
    
    switch (period) {
      case 'today':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        groupStage = {
          _id: { $hour: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        };
        break;
        
      case 'week':
        matchStage.createdAt = {
          $gte: new Date(now.setDate(now.getDate() - 7))
        };
        groupStage = {
          _id: { $dayOfWeek: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        };
        break;
        
      case 'month':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        groupStage = {
          _id: { $dayOfMonth: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        };
        break;
        
      case 'year':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), 0, 1)
        };
        groupStage = {
          _id: { $month: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        };
        break;
    }

    const chartData = await Sale.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      chartData,
      period
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/top-products', auth, async (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;
    
    let matchStage = { isVoid: false };
    const now = new Date();
    
    switch (period) {
      case 'today':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        matchStage.createdAt = {
          $gte: new Date(now.setDate(now.getDate() - 7))
        };
        break;
      case 'month':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
      case 'year':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), 0, 1)
        };
        break;
    }

    const topProducts = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          productName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          salesCount: 1,
          currentStock: { $arrayElemAt: ['$product.stock', 0] },
          price: { $arrayElemAt: ['$product.price', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      topProducts,
      period
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/recent-sales', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentSales = await Sale.find({ isVoid: false })
      .populate('cashier', 'name')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('receiptNumber total createdAt cashier customer paymentMethod items');

    res.json({
      success: true,
      recentSales
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/payment-methods', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let matchStage = { isVoid: false };
    const now = new Date();
    
    switch (period) {
      case 'today':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        matchStage.createdAt = {
          $gte: new Date(now.setDate(now.getDate() - 7))
        };
        break;
      case 'month':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
      case 'year':
        matchStage.createdAt = {
          $gte: new Date(now.getFullYear(), 0, 1)
        };
        break;
    }

    const paymentMethods = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      paymentMethods,
      period
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/reports/inventory', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      categoryStats
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({
        $expr: { $lte: ['$stock', '$minStock'] },
        isActive: true
      }),
      Product.countDocuments({ stock: 0, isActive: true }),
      Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $group: {
            _id: '$category',
            categoryName: { $first: { $arrayElemAt: ['$categoryInfo.name', 0] } },
            productCount: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
            totalStock: { $sum: '$stock' }
          }
        },
        { $sort: { productCount: -1 } }
      ])
    ]);

    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalCostValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
          totalRetailValue: { $sum: { $multiply: ['$stock', '$price'] } }
        }
      }
    ]);

    res.json({
      success: true,
      report: {
        summary: {
          totalProducts,
          activeProducts,
          inactiveProducts,
          lowStockProducts,
          outOfStockProducts,
          inventoryValue: inventoryValue[0] || { totalCostValue: 0, totalRetailValue: 0 }
        },
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/reports/sales', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = { isVoid: false };
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [salesSummary, hourlyDistribution, cashierPerformance] = await Promise.all([
      Sale.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            totalItems: { $sum: { $sum: '$items.quantity' } },
            averageTransaction: { $avg: '$total' },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' }
          }
        }
      ]),
      
      Sale.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            salesCount: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      Sale.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$cashier',
            salesCount: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageTransaction: { $avg: '$total' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'cashierInfo'
          }
        },
        {
          $project: {
            cashierName: { $arrayElemAt: ['$cashierInfo.name', 0] },
            salesCount: 1,
            totalRevenue: 1,
            averageTransaction: 1
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])
    ]);

    res.json({
      success: true,
      report: {
        summary: salesSummary[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalItems: 0,
          averageTransaction: 0,
          totalTax: 0,
          totalDiscount: 0
        },
        hourlyDistribution,
        cashierPerformance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;