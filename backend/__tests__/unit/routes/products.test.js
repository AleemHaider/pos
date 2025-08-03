const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import the route
const productsRouter = require('../../../routes/products');

// Import models
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

// Import test utilities
const {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createCompleteTestSetup,
  createMultiTenantSetup,
  expectSuccessResponse,
  expectPaginatedResponse,
  expectValidationError,
  expectUnauthorizedError,
  expectNotFoundError
} = require('../../utils/testUtils');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

// Add error handling middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

describe('Products Routes', () => {
  let testData;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    testData = await createCompleteTestSetup();
  });

  describe('GET /api/products', () => {
    test('should get all products for authenticated user', async () => {
      const response = await request(app)
        .get('/api/products')
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('name', 'Test Product');
      expect(response.body.data[0]).toHaveProperty('tenant', testData.tenant._id.toString());
    });

    test('should return empty array when no products exist', async () => {
      await Product.deleteMany({});
      
      const response = await request(app)
        .get('/api/products')
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(0);
    });

    test('should filter products by category', async () => {
      // Create another category and product
      const newCategory = await Category.create({
        name: 'Books',
        tenant: testData.tenant._id
      });
      
      await Product.create({
        name: 'Test Book',
        sku: 'BOOK-001',
        category: newCategory._id,
        price: 19.99,
        stock: 50,
        tenant: testData.tenant._id
      });

      const response = await request(app)
        .get(`/api/products?category=${testData.category._id}`)
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category._id).toBe(testData.category._id.toString());
    });

    test('should search products by name', async () => {
      await Product.create({
        name: 'Another Product',
        sku: 'OTHER-001',
        category: testData.category._id,
        price: 39.99,
        stock: 25,
        tenant: testData.tenant._id
      });

      const response = await request(app)
        .get('/api/products?search=Another')
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Another Product');
    });

    test('should paginate results', async () => {
      // Create additional products
      for (let i = 1; i <= 15; i++) {
        await Product.create({
          name: `Product ${i}`,
          sku: `PROD-${i}`,
          category: testData.category._id,
          price: 10.99 + i,
          stock: 10 + i,
          tenant: testData.tenant._id
        });
      }

      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .set(testData.headers);

      expectPaginatedResponse(response, ['name', 'sku', 'price']);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(16); // 15 + original product
      expect(response.body.pagination.pages).toBe(2);
    });

    test('should filter by stock status', async () => {
      // Create low stock product
      await Product.create({
        name: 'Low Stock Product',
        sku: 'LOW-001',
        category: testData.category._id,
        price: 29.99,
        stock: 5,
        minStock: 10,
        tenant: testData.tenant._id
      });

      const response = await request(app)
        .get('/api/products?stockStatus=low')
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Low Stock Product');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/products');

      expectUnauthorizedError(response);
    });

    test('should only return products from user\'s tenant', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const response = await request(app)
        .get('/api/products')
        .set(multiTenantData.tenant1.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tenant).toBe(multiTenantData.tenant1.tenant._id.toString());
    });
  });

  describe('GET /api/products/:id', () => {
    test('should get a specific product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testData.product._id}`)
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('name', 'Test Product');
      expect(response.body.data).toHaveProperty('sku');
      expect(response.body.data.category).toHaveProperty('name', 'Electronics');
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)
        .set(testData.headers);

      expectNotFoundError(response);
    });

    test('should not allow access to products from other tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const response = await request(app)
        .get(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant1.headers);

      expectNotFoundError(response);
    });

    test('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .set(testData.headers);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/invalid/i);
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
      const productData = {
        ...validProductData,
        category: testData.category._id
      };

      const response = await request(app)
        .post('/api/products')
        .set(testData.headers)
        .send(productData);

      expectSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('name', productData.name);
      expect(response.body.data).toHaveProperty('sku', productData.sku);
      expect(response.body.data).toHaveProperty('tenant', testData.tenant._id.toString());
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .set(testData.headers)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/validation/i);
    });

    test('should validate SKU uniqueness within tenant', async () => {
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
      expect(response.body.message).toMatch(/sku.*exists/i);
    });

    test('should allow same SKU in different tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const productData = {
        ...validProductData,
        sku: multiTenantData.tenant1.product.sku, // Use SKU from tenant1
        category: multiTenantData.tenant2.category._id
      };

      const response = await request(app)
        .post('/api/products')
        .set(multiTenantData.tenant2.headers)
        .send(productData);

      expectSuccessResponse(response, 201);
    });

    test('should validate price is positive', async () => {
      const productData = {
        ...validProductData,
        price: -10.00,
        category: testData.category._id
      };

      const response = await request(app)
        .post('/api/products')
        .set(testData.headers)
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/price.*positive/i);
    });

    test('should validate stock levels', async () => {
      const productData = {
        ...validProductData,
        stock: 5,
        minStock: 10, // Stock below minimum
        category: testData.category._id
      };

      const response = await request(app)
        .post('/api/products')
        .set(testData.headers)
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/stock.*minimum/i);
    });

    test('should require valid category', async () => {
      const productData = {
        ...validProductData,
        category: new mongoose.Types.ObjectId() // Non-existent category
      };

      const response = await request(app)
        .post('/api/products')
        .set(testData.headers)
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/category.*not found/i);
    });

    test('should not allow creating products without category from same tenant', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const productData = {
        ...validProductData,
        category: multiTenantData.tenant2.category._id // Category from different tenant
      };

      const response = await request(app)
        .post('/api/products')
        .set(multiTenantData.tenant1.headers)
        .send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/category.*not found/i);
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update an existing product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 39.99,
        stock: 150
      };

      const response = await request(app)
        .put(`/api/products/${testData.product._id}`)
        .set(testData.headers)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('price', updateData.price);
      expect(response.body.data).toHaveProperty('stock', updateData.stock);
    });

    test('should not allow updating products from other tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const response = await request(app)
        .put(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant1.headers)
        .send({ name: 'Hacked Product' });

      expectNotFoundError(response);
    });

    test('should validate SKU uniqueness on update', async () => {
      // Create another product
      const anotherProduct = await Product.create({
        name: 'Another Product',
        sku: 'ANOTHER-001',
        category: testData.category._id,
        price: 19.99,
        stock: 50,
        tenant: testData.tenant._id
      });

      const response = await request(app)
        .put(`/api/products/${anotherProduct._id}`)
        .set(testData.headers)
        .send({ sku: testData.product.sku }); // Try to use existing SKU

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/sku.*exists/i);
    });

    test('should allow keeping the same SKU when updating other fields', async () => {
      const response = await request(app)
        .put(`/api/products/${testData.product._id}`)
        .set(testData.headers)
        .send({ 
          sku: testData.product.sku, // Same SKU
          name: 'Updated Name'
        });

      expectSuccessResponse(response);
      expect(response.body.data.name).toBe('Updated Name');
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .set(testData.headers)
        .send({ name: 'Updated Name' });

      expectNotFoundError(response);
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete an existing product', async () => {
      const response = await request(app)
        .delete(`/api/products/${testData.product._id}`)
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.message).toMatch(/deleted successfully/i);

      // Verify product is deleted
      const deletedProduct = await Product.findById(testData.product._id);
      expect(deletedProduct).toBeNull();
    });

    test('should not allow deleting products from other tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const response = await request(app)
        .delete(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant1.headers);

      expectNotFoundError(response);
      
      // Verify product still exists in tenant2
      const product = await Product.findById(multiTenantData.tenant2.product._id);
      expect(product).toBeTruthy();
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .set(testData.headers);

      expectNotFoundError(response);
    });

    test('should prevent deletion if product is referenced in sales', async () => {
      // The test data already has a sale with this product
      const response = await request(app)
        .delete(`/api/products/${testData.product._id}`)
        .set(testData.headers);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cannot.*delete.*referenced/i);
    });
  });

  describe('POST /api/products/bulk-delete', () => {
    test('should delete multiple products', async () => {
      // Create additional products without sales
      const product2 = await Product.create({
        name: 'Product 2',
        sku: 'PROD-002',
        category: testData.category._id,
        price: 19.99,
        stock: 50,
        tenant: testData.tenant._id
      });

      const product3 = await Product.create({
        name: 'Product 3',
        sku: 'PROD-003',
        category: testData.category._id,
        price: 39.99,
        stock: 25,
        tenant: testData.tenant._id
      });

      const response = await request(app)
        .post('/api/products/bulk-delete')
        .set(testData.headers)
        .send({ productIds: [product2._id, product3._id] });

      expectSuccessResponse(response);
      expect(response.body.message).toMatch(/2.*deleted successfully/i);

      // Verify products are deleted
      const deletedProducts = await Product.find({
        _id: { $in: [product2._id, product3._id] }
      });
      expect(deletedProducts).toHaveLength(0);
    });

    test('should validate product IDs array', async () => {
      const response = await request(app)
        .post('/api/products/bulk-delete')
        .set(testData.headers)
        .send({ productIds: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/array.*required/i);
    });

    test('should not delete products from other tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      const response = await request(app)
        .post('/api/products/bulk-delete')
        .set(multiTenantData.tenant1.headers)
        .send({ 
          productIds: [
            multiTenantData.tenant1.product._id,
            multiTenantData.tenant2.product._id // Different tenant
          ] 
        });

      // Should only delete from tenant1
      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(0); // Both have sales, can't delete
      
      // Verify tenant2 product still exists
      const tenant2Product = await Product.findById(multiTenantData.tenant2.product._id);
      expect(tenant2Product).toBeTruthy();
    });
  });

  describe('GET /api/products/low-stock', () => {
    test('should return products with low stock', async () => {
      // Create low stock product
      await Product.create({
        name: 'Low Stock Product',
        sku: 'LOW-001',
        category: testData.category._id,
        price: 29.99,
        stock: 5,
        minStock: 10,
        tenant: testData.tenant._id
      });

      const response = await request(app)
        .get('/api/products/low-stock')
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Low Stock Product');
      expect(response.body.data[0].stock).toBeLessThan(response.body.data[0].minStock);
    });

    test('should return empty array when no low stock products', async () => {
      const response = await request(app)
        .get('/api/products/low-stock')
        .set(testData.headers);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Temporarily close the database connection
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/products')
        .set(testData.headers);

      expect(response.status).toBe(500);

      // Reconnect for cleanup
      await setupTestDatabase();
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/products')
        .set({
          ...testData.headers,
          'Content-Type': 'application/json'
        })
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });
});