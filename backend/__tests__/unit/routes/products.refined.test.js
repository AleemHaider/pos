const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

// Import the route
const productsRouter = require('../../../routes/products');

// Import models
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

// Import middleware
const authMiddleware = require('../../../middleware/auth');
const { tenantContext } = require('../../../middleware/tenant');

// Import test utilities
const {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createCompleteTestSetup,
  createMultiTenantSetup,
  expectSuccessResponse,
  expectPaginatedResponse,
  expectUnauthorizedError,
  expectNotFoundError
} = require('../../utils/testUtils');

// Create Express app for testing
const app = express();
app.use(express.json());

// Add middleware in correct order
app.use('/api/products', authMiddleware, tenantContext, productsRouter);

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  logger.error('Test app error', error, {
    url: req.originalUrl,
    method: req.method,
    body: req.body
  });
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

describe('Products Routes - Refined', () => {
  let testData;

  beforeAll(async () => {
    logger.testStart('Products Routes Setup', 'Suite');
    try {
      await setupTestDatabase();
      logger.test('Database setup completed for Products Routes');
    } catch (error) {
      logger.testError('Products Routes Setup', error, 'Suite');
      throw error;
    }
  });

  afterAll(async () => {
    try {
      await teardownTestDatabase();
      logger.test('Database teardown completed for Products Routes');
    } catch (error) {
      logger.testError('Products Routes Teardown', error, 'Suite');
    }
  });

  beforeEach(async () => {
    try {
      await clearDatabase();
      testData = await createCompleteTestSetup();
      logger.test('Test data created successfully', {
        tenantId: testData.tenant._id,
        userId: testData.user._id,
        productId: testData.product._id
      });
    } catch (error) {
      logger.testError('Test data setup', error);
      throw error;
    }
  });

  describe('GET /api/products', () => {
    test('should get all products for authenticated user', async () => {
      logger.testStart('should get all products for authenticated user');
      
      try {
        const response = await request(app)
          .get('/api/products')
          .set(testData.headers);

        expect(response.status).toBe(200);
        expect(response.body).toBeValidApiResponse();
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('name', 'Test Product');
        expect(response.body.data[0]).toHaveTenantId(testData.tenant._id);
        expect(response.body).toHaveProperty('pagination');
        
        logger.test('Successfully retrieved products', {
          count: response.body.data.length,
          productName: response.body.data[0].name
        });
      } catch (error) {
        logger.testError('should get all products for authenticated user', error);
        throw error;
      }
    });

    test('should return empty array when no products exist', async () => {
      logger.testStart('should return empty array when no products exist');
      
      try {
        // Clear all products
        await Product.deleteMany({ tenant: testData.tenant._id });
        
        const response = await request(app)
          .get('/api/products')
          .set(testData.headers);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(0);
        expect(response.body.pagination.total).toBe(0);
        
        logger.test('Successfully handled empty products list');
      } catch (error) {
        logger.testError('should return empty array when no products exist', error);
        throw error;
      }
    });

    test('should filter products by category', async () => {
      logger.testStart('should filter products by category');
      
      try {
        // Create another category and product
        const newCategory = new Category({
          name: 'Books',
          description: 'Books and literature',
          tenant: testData.tenant._id,
          createdBy: testData.user._id
        });
        await newCategory.save();
        
        const newProduct = new Product({
          name: 'Test Book',
          sku: `BOOK-${Date.now()}`,
          category: newCategory._id,
          price: 19.99,
          costPrice: 10.00,
          stock: 50,
          minStock: 5,
          tenant: testData.tenant._id,
          createdBy: testData.user._id
        });
        await newProduct.save();

        const response = await request(app)
          .get(`/api/products?category=${testData.category._id}`)
          .set(testData.headers);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].category._id).toBe(testData.category._id.toString());
        
        logger.test('Successfully filtered products by category', {
          categoryId: testData.category._id,
          resultCount: response.body.data.length
        });
      } catch (error) {
        logger.testError('should filter products by category', error);
        throw error;
      }
    });

    test('should search products by name', async () => {
      logger.testStart('should search products by name');
      
      try {
        const searchTerm = 'Test';
        const response = await request(app)
          .get(`/api/products?search=${searchTerm}`)
          .set(testData.headers);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].name).toContain(searchTerm);
        
        logger.test('Successfully searched products by name', {
          searchTerm,
          resultCount: response.body.data.length
        });
      } catch (error) {
        logger.testError('should search products by name', error);
        throw error;
      }
    });

    test('should require authentication', async () => {
      logger.testStart('should require authentication');
      
      try {
        const response = await request(app)
          .get('/api/products');

        expectUnauthorizedError(response);
        
        logger.test('Successfully rejected unauthenticated request');
      } catch (error) {
        logger.testError('should require authentication', error);
        throw error;
      }
    });

    test('should only return products from user\'s tenant', async () => {
      logger.testStart('should only return products from user\'s tenant');
      
      try {
        const multiTenantData = await createMultiTenantSetup();
        
        const response = await request(app)
          .get('/api/products')
          .set(multiTenantData.tenant1.headers);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveTenantId(multiTenantData.tenant1.tenant._id);
        
        logger.test('Successfully isolated tenant data', {
          tenantId: multiTenantData.tenant1.tenant._id,
          productCount: response.body.data.length
        });
      } catch (error) {
        logger.testError('should only return products from user\'s tenant', error);
        throw error;
      }
    });
  });

  describe('GET /api/products/:id', () => {
    test('should get a specific product by ID', async () => {
      logger.testStart('should get a specific product by ID');
      
      try {
        const response = await request(app)
          .get(`/api/products/${testData.product._id}`)
          .set(testData.headers);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Test Product');
        expect(response.body.data).toHaveProperty('sku');
        expect(response.body.data.category).toHaveProperty('name', 'Electronics');
        
        logger.test('Successfully retrieved product by ID', {
          productId: testData.product._id,
          productName: response.body.data.name
        });
      } catch (error) {
        logger.testError('should get a specific product by ID', error);
        throw error;
      }
    });

    test('should return 404 for non-existent product', async () => {
      logger.testStart('should return 404 for non-existent product');
      
      try {
        const nonExistentId = new mongoose.Types.ObjectId();
        
        const response = await request(app)
          .get(`/api/products/${nonExistentId}`)
          .set(testData.headers);

        expectNotFoundError(response);
        
        logger.test('Successfully handled non-existent product', {
          requestedId: nonExistentId
        });
      } catch (error) {
        logger.testError('should return 404 for non-existent product', error);
        throw error;
      }
    });

    test('should return 400 for invalid product ID', async () => {
      logger.testStart('should return 400 for invalid product ID');
      
      try {
        const response = await request(app)
          .get('/api/products/invalid-id')
          .set(testData.headers);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/invalid/i);
        
        logger.test('Successfully handled invalid product ID');
      } catch (error) {
        logger.testError('should return 400 for invalid product ID', error);
        throw error;
      }
    });
  });

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'New Product',
      description: 'A new test product',
      sku: 'NEW-001',
      price: 49.99,
      costPrice: 25.00,
      stock: 100,
      minStock: 10,
      maxStock: 500,
      unit: 'piece'
    };

    test('should create a new product', async () => {
      logger.testStart('should create a new product');
      
      try {
        const productData = {
          ...validProductData,
          sku: `NEW-${Date.now()}`, // Ensure unique SKU
          category: testData.category._id
        };

        const response = await request(app)
          .post('/api/products')
          .set(testData.headers)
          .send(productData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', productData.name);
        expect(response.body.data).toHaveProperty('sku', productData.sku);
        expect(response.body.data).toHaveTenantId(testData.tenant._id);
        
        logger.test('Successfully created new product', {
          productName: response.body.data.name,
          productId: response.body.data._id
        });
      } catch (error) {
        logger.testError('should create a new product', error);
        throw error;
      }
    });

    test('should validate required fields', async () => {
      logger.testStart('should validate required fields');
      
      try {
        const response = await request(app)
          .post('/api/products')
          .set(testData.headers)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/validation/i);
        
        logger.test('Successfully validated required fields');
      } catch (error) {
        logger.testError('should validate required fields', error);
        throw error;
      }
    });

    test('should validate SKU uniqueness within tenant', async () => {
      logger.testStart('should validate SKU uniqueness within tenant');
      
      try {
        const productData = {
          ...validProductData,
          sku: testData.product.sku, // Use existing SKU
          category: testData.category._id
        };

        const response = await request(app)
          .post('/api/products')
          .set(testData.headers)
          .send(productData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/sku.*exists/i);
        
        logger.test('Successfully validated SKU uniqueness');
      } catch (error) {
        logger.testError('should validate SKU uniqueness within tenant', error);
        throw error;
      }
    });

    test('should validate price is positive', async () => {
      logger.testStart('should validate price is positive');
      
      try {
        const productData = {
          ...validProductData,
          sku: `NEG-${Date.now()}`,
          price: -10.00,
          category: testData.category._id
        };

        const response = await request(app)
          .post('/api/products')
          .set(testData.headers)
          .send(productData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/price.*positive/i);
        
        logger.test('Successfully validated positive price');
      } catch (error) {
        logger.testError('should validate price is positive', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      logger.testStart('should handle malformed JSON');
      
      try {
        const response = await request(app)
          .post('/api/products')
          .set({
            ...testData.headers,
            'Content-Type': 'application/json'
          })
          .send('{ invalid json }');

        expect(response.status).toBe(400);
        
        logger.test('Successfully handled malformed JSON');
      } catch (error) {
        logger.testError('should handle malformed JSON', error);
        throw error;
      }
    });
  });
});