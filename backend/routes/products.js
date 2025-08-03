const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, authorize } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const logger = require('../utils/logger');

const router = express.Router();

// Get all products
router.get('/', [auth, tenantContext], async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      stockStatus = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    logger.dbOperation('find', 'products', { 
      tenant: req.tenantId, 
      search, 
      category, 
      stockStatus,
      page,
      limit 
    });
    
    const query = { tenant: req.tenantId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    if (stockStatus === 'low') {
      query.$expr = { $lte: ['$stock', '$minStock'] };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('createdBy', 'name')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(sortOptions),
      Product.countDocuments(query)
    ]);

    const responseTime = Date.now() - startTime;
    logger.apiRequest(req.method, req.originalUrl, 200, responseTime);
    
    logger.dbOperation('find', 'products', query, `Found ${products.length} products`);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.apiRequest(req.method, req.originalUrl, 500, responseTime, error);
    logger.error('Failed to get products', error, {
      tenantId: req.tenantId,
      userId: req.user._id,
      query: req.query
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get low stock products
router.get('/low-stock', [auth, tenantContext], async (req, res) => {
  try {
    const products = await Product.find({
      tenant: req.tenantId,
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true
    })
    .populate('category', 'name')
    .sort({ stock: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
router.get('/:id', [auth, tenantContext], async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId 
    })
      .populate('category', 'name')
      .populate('createdBy', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product
router.post('/', [
  auth,
  tenantContext,
  authorize('admin', 'manager'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('costPrice').isNumeric().withMessage('Cost price must be a number'),
  body('stock').isNumeric().withMessage('Stock must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const {
      name, description, sku, category, price, costPrice, stock,
      minStock, maxStock, unit
    } = req.body;

    // Check SKU uniqueness within tenant
    const existingSKU = await Product.findOne({ 
      tenant: req.tenantId, 
      sku 
    });
    if (existingSKU) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    // Validate category exists and belongs to tenant
    const categoryExists = await Category.findOne({
      _id: category,
      tenant: req.tenantId
    });
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Validate price is positive
    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be positive' });
    }

    // Validate stock levels
    if (stock < minStock) {
      return res.status(400).json({ message: 'Stock cannot be below minimum stock level' });
    }

    const product = new Product({
      tenant: req.tenantId,
      name,
      description,
      sku,
      category,
      price,
      costPrice,
      stock,
      minStock,
      maxStock,
      unit,
      createdBy: req.user._id
    });

    await product.save();
    await product.populate([
      { path: 'category', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/:id', [
  auth,
  tenantContext,
  authorize('admin', 'manager'),
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('costPrice').optional().isNumeric().withMessage('Cost price must be a number'),
  body('stock').optional().isNumeric().withMessage('Stock must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, sku, category, price, costPrice, stock,
            minStock, maxStock, unit, isActive } = req.body;

    // Check SKU uniqueness if changed
    if (sku && sku !== product.sku) {
      const existingSKU = await Product.findOne({ 
        tenant: req.tenantId,
        sku, 
        _id: { $ne: req.params.id } 
      });
      if (existingSKU) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    // Validate category if changed
    if (category && category !== product.category.toString()) {
      const categoryExists = await Category.findOne({
        _id: category,
        tenant: req.tenantId
      });
      if (!categoryExists) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    // Update fields
    Object.assign(product, {
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      sku: sku || product.sku,
      category: category || product.category,
      price: price !== undefined ? price : product.price,
      costPrice: costPrice !== undefined ? costPrice : product.costPrice,
      stock: stock !== undefined ? stock : product.stock,
      minStock: minStock !== undefined ? minStock : product.minStock,
      maxStock: maxStock !== undefined ? maxStock : product.maxStock,
      unit: unit || product.unit,
      isActive: typeof isActive === 'boolean' ? isActive : product.isActive
    });

    await product.save();
    await product.populate([
      { path: 'category', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
router.delete('/:id', [auth, tenantContext, authorize('admin', 'manager')], async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is referenced in sales
    const Sale = require('../models/Sale');
    const saleExists = await Sale.findOne({
      'items.product': product._id,
      isVoid: false
    });

    if (saleExists) {
      return res.status(400).json({ 
        message: 'Cannot delete product as it is referenced in sales' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk delete products
router.post('/bulk-delete', [auth, tenantContext, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    // Only delete products from current tenant
    const result = await Product.deleteMany({
      _id: { $in: productIds },
      tenant: req.tenantId
    });

    res.json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;