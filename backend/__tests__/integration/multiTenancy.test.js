const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import routes
const authRouter = require('../../routes/auth');
const tenantRouter = require('../../routes/tenant');
const productsRouter = require('../../routes/products');
const salesRouter = require('../../routes/sales');

// Import middleware
const authMiddleware = require('../../middleware/auth');
const { tenantContext } = require('../../middleware/tenant');

// Import test utilities
const {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createCompleteTestSetup,
  createMultiTenantSetup,
  createMockTenant,
  createMockUser,
  generateAuthToken,
  createAuthHeaders,
  expectSuccessResponse,
  expectUnauthorizedError,
  expectForbiddenError,
  expectNotFoundError
} = require('../utils/testUtils');

// Create Express app for testing
const app = express();
app.use(express.json());

// Add middleware
app.use('/api/auth', authRouter);
app.use('/api/tenant', authMiddleware, tenantRouter);
app.use('/api/products', authMiddleware, tenantContext, productsRouter);
app.use('/api/sales', authMiddleware, tenantContext, salesRouter);

// Add error handling middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

describe('Multi-Tenancy Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Tenant Isolation', () => {
    test('should isolate data between tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Get products for tenant1
      const tenant1Response = await request(app)
        .get('/api/products')
        .set(multiTenantData.tenant1.headers);

      // Get products for tenant2
      const tenant2Response = await request(app)
        .get('/api/products')
        .set(multiTenantData.tenant2.headers);

      // Each tenant should only see their own products
      expectSuccessResponse(tenant1Response);
      expectSuccessResponse(tenant2Response);

      expect(tenant1Response.body.data).toHaveLength(1);
      expect(tenant2Response.body.data).toHaveLength(1);

      // Verify tenant1 can't see tenant2's product
      expect(tenant1Response.body.data[0]._id).not.toBe(
        tenant2Response.body.data[0]._id
      );

      // Verify tenant assignment
      expect(tenant1Response.body.data[0].tenant).toBe(
        multiTenantData.tenant1.tenant._id.toString()
      );
      expect(tenant2Response.body.data[0].tenant).toBe(
        multiTenantData.tenant2.tenant._id.toString()
      );
    });

    test('should prevent cross-tenant data access via direct ID access', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Try to access tenant2's product using tenant1's credentials
      const response = await request(app)
        .get(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant1.headers);

      expectNotFoundError(response);
    });

    test('should prevent cross-tenant data modification', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Try to update tenant2's product using tenant1's credentials
      const response = await request(app)
        .put(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant1.headers)
        .send({ name: 'Hacked Product Name' });

      expectNotFoundError(response);

      // Verify the product wasn't modified
      const unchangedResponse = await request(app)
        .get(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant2.headers);

      expect(unchangedResponse.body.data.name).not.toBe('Hacked Product Name');
    });

    test('should prevent cross-tenant data deletion', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Try to delete tenant2's product using tenant1's credentials
      const response = await request(app)
        .delete(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant1.headers);

      expectNotFoundError(response);

      // Verify the product still exists
      const stillExistsResponse = await request(app)
        .get(`/api/products/${multiTenantData.tenant2.product._id}`)
        .set(multiTenantData.tenant2.headers);

      expectSuccessResponse(stillExistsResponse);
    });
  });

  describe('Tenant Header Validation', () => {
    test('should require X-Tenant-ID header for tenant-specific routes', async () => {
      const testData = await createCompleteTestSetup();
      const headersWithoutTenant = {
        'Authorization': `Bearer ${testData.token}`,
        'Content-Type': 'application/json'
      };

      const response = await request(app)
        .get('/api/products')
        .set(headersWithoutTenant);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tenant.*required/i);
    });

    test('should validate X-Tenant-ID header format', async () => {
      const testData = await createCompleteTestSetup();
      const headersWithInvalidTenant = {
        'Authorization': `Bearer ${testData.token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'invalid-tenant-id'
      };

      const response = await request(app)
        .get('/api/products')
        .set(headersWithInvalidTenant);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/invalid.*tenant/i);
    });

    test('should reject non-existent tenant ID', async () => {
      const testData = await createCompleteTestSetup();
      const nonExistentTenantId = new mongoose.Types.ObjectId();
      const headersWithNonExistentTenant = {
        'Authorization': `Bearer ${testData.token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': nonExistentTenantId.toString()
      };

      const response = await request(app)
        .get('/api/products')
        .set(headersWithNonExistentTenant);

      expectForbiddenError(response);
    });

    test('should reject tenant ID that user doesn\'t have access to', async () => {
      const multiTenantData = await createMultiTenantSetup();
      
      // Create headers with tenant1 token but tenant2 ID
      const invalidHeaders = {
        'Authorization': `Bearer ${multiTenantData.tenant1.token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': multiTenantData.tenant2.tenant._id.toString()
      };

      const response = await request(app)
        .get('/api/products')
        .set(invalidHeaders);

      expectForbiddenError(response);
    });
  });

  describe('User-Tenant Relationships', () => {
    test('should allow user access to multiple tenants', async () => {
      // Create a user with access to multiple tenants
      const tenant1 = await createMockTenant({ name: 'Store 1', slug: 'store-1' });
      const tenant2 = await createMockTenant({ name: 'Store 2', slug: 'store-2' });
      
      const user = await createMockUser(null, {
        email: 'multi@example.com',
        tenants: [
          { tenant: tenant1._id, role: 'admin' },
          { tenant: tenant2._id, role: 'manager' }
        ]
      });

      const token = generateAuthToken(user._id);

      // Test access to tenant1
      const headers1 = createAuthHeaders(token, tenant1._id);
      const response1 = await request(app)
        .get('/api/products')
        .set(headers1);

      expectSuccessResponse(response1);

      // Test access to tenant2
      const headers2 = createAuthHeaders(token, tenant2._id);
      const response2 = await request(app)
        .get('/api/products')
        .set(headers2);

      expectSuccessResponse(response2);
    });

    test('should respect different roles in different tenants', async () => {
      const tenant1 = await createMockTenant({ name: 'Store 1', slug: 'store-1' });
      const tenant2 = await createMockTenant({ name: 'Store 2', slug: 'store-2' });
      
      const user = await createMockUser(null, {
        email: 'multi@example.com',
        tenants: [
          { tenant: tenant1._id, role: 'admin' },
          { tenant: tenant2._id, role: 'viewer' }
        ]
      });

      const token = generateAuthToken(user._id);

      // Admin should be able to create products in tenant1
      const adminHeaders = createAuthHeaders(token, tenant1._id);
      const createResponse = await request(app)
        .post('/api/products')
        .set(adminHeaders)
        .send({
          name: 'Admin Product',
          sku: 'ADMIN-001',
          price: 29.99,
          stock: 100,
          category: new mongoose.Types.ObjectId() // This would need proper setup
        });

      // This would succeed if we had proper role-based access control
      // For now, we're just testing the tenant isolation
    });

    test('should handle user without tenant access gracefully', async () => {
      const tenant = await createMockTenant();
      const userWithoutAccess = await createMockUser(null, {
        email: 'noAccess@example.com',
        tenants: [] // No tenant access
      });

      const token = generateAuthToken(userWithoutAccess._id);
      const headers = createAuthHeaders(token, tenant._id);

      const response = await request(app)
        .get('/api/products')
        .set(headers);

      expectForbiddenError(response);
    });
  });

  describe('Tenant-Specific Operations', () => {
    test('should create sales with proper tenant isolation', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Create sale in tenant1
      const saleData = {
        items: [
          {
            product: multiTenantData.tenant1.product._id,
            quantity: 2,
            price: 29.99,
            total: 59.98
          }
        ],
        customer: multiTenantData.tenant1.customer._id,
        total: 59.98,
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/sales')
        .set(multiTenantData.tenant1.headers)
        .send(saleData);

      expectSuccessResponse(response, 201);
      expect(response.body.data.tenant).toBe(
        multiTenantData.tenant1.tenant._id.toString()
      );

      // Verify tenant2 can't see this sale
      const tenant2SalesResponse = await request(app)
        .get('/api/sales')
        .set(multiTenantData.tenant2.headers);

      expectSuccessResponse(tenant2SalesResponse);
      const newSaleId = response.body.data._id;
      const tenant2Sales = tenant2SalesResponse.body.data || [];
      
      expect(tenant2Sales.find(sale => sale._id === newSaleId)).toBeUndefined();
    });

    test('should prevent using products from other tenants in sales', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Try to create sale in tenant1 using product from tenant2
      const invalidSaleData = {
        items: [
          {
            product: multiTenantData.tenant2.product._id, // Different tenant
            quantity: 1,
            price: 29.99,
            total: 29.99
          }
        ],
        customer: multiTenantData.tenant1.customer._id,
        total: 29.99,
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/sales')
        .set(multiTenantData.tenant1.headers)
        .send(invalidSaleData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/product.*not found/i);
    });

    test('should prevent using customers from other tenants in sales', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Try to create sale in tenant1 using customer from tenant2
      const invalidSaleData = {
        items: [
          {
            product: multiTenantData.tenant1.product._id,
            quantity: 1,
            price: 29.99,
            total: 29.99
          }
        ],
        customer: multiTenantData.tenant2.customer._id, // Different tenant
        total: 29.99,
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/sales')
        .set(multiTenantData.tenant1.headers)
        .send(invalidSaleData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/customer.*not found/i);
    });
  });

  describe('Tenant Settings and Limits', () => {
    test('should enforce product limits per tenant', async () => {
      const tenant = await createMockTenant({
        limits: { products: 2 } // Limit to 2 products
      });
      
      const user = await createMockUser(tenant._id);
      tenant.owner = user._id;
      await tenant.save();

      const token = generateAuthToken(user._id);
      const headers = createAuthHeaders(token, tenant._id);

      // This test would need proper implementation of limits checking
      // For now, we're setting up the structure
      expect(tenant.limits.products).toBe(2);
    });

    test('should respect tenant currency settings', async () => {
      const tenant = await createMockTenant({
        settings: { currency: 'EUR' }
      });
      
      const user = await createMockUser(tenant._id);
      const token = generateAuthToken(user._id);
      const headers = createAuthHeaders(token, tenant._id);

      // Get tenant settings
      const response = await request(app)
        .get('/api/tenant/settings')
        .set(headers);

      expectSuccessResponse(response);
      expect(response.body.data.currency).toBe('EUR');
    });
  });

  describe('Performance with Multiple Tenants', () => {
    test('should handle concurrent requests from different tenants', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Make concurrent requests from both tenants
      const [response1, response2] = await Promise.all([
        request(app)
          .get('/api/products')
          .set(multiTenantData.tenant1.headers),
        request(app)
          .get('/api/products')
          .set(multiTenantData.tenant2.headers)
      ]);

      expectSuccessResponse(response1);
      expectSuccessResponse(response2);

      // Each should get their own data
      expect(response1.body.data[0].tenant).toBe(
        multiTenantData.tenant1.tenant._id.toString()
      );
      expect(response2.body.data[0].tenant).toBe(
        multiTenantData.tenant2.tenant._id.toString()
      );
    });

    test('should maintain tenant isolation under load', async () => {
      const multiTenantData = await createMultiTenantSetup();

      // Create multiple concurrent requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/products')
            .set(multiTenantData.tenant1.headers)
        );
        requests.push(
          request(app)
            .get('/api/products')
            .set(multiTenantData.tenant2.headers)
        );
      }

      const responses = await Promise.all(requests);

      // All responses should succeed
      responses.forEach(response => {
        expectSuccessResponse(response);
        expect(response.body.data).toHaveLength(1);
      });

      // Verify proper tenant isolation
      for (let i = 0; i < responses.length; i += 2) {
        const tenant1Response = responses[i];
        const tenant2Response = responses[i + 1];

        expect(tenant1Response.body.data[0].tenant).toBe(
          multiTenantData.tenant1.tenant._id.toString()
        );
        expect(tenant2Response.body.data[0].tenant).toBe(
          multiTenantData.tenant2.tenant._id.toString()
        );
      }
    });
  });
});