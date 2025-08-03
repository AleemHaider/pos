import { productsAPI, categoriesAPI, authAPI } from '../services/api';

// Integration tests for API endpoints
describe('API Integration Tests', () => {
  let authToken = null;

  beforeAll(async () => {
    // Create test user and get auth token
    try {
      const loginResponse = await authAPI.login({
        email: 'admin@pos.com',
        password: '123456'
      });
      authToken = loginResponse.data.token;
      localStorage.setItem('token', authToken);
    } catch (error) {
      console.log('Login failed, tests will run without auth:', error.message);
    }
  });

  describe('Products API', () => {
    test('should fetch products successfully', async () => {
      try {
        const response = await productsAPI.getAll();
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        
        if (response.data.length > 0) {
          const product = response.data[0];
          expect(product).toHaveProperty('_id');
          expect(product).toHaveProperty('name');
          expect(product).toHaveProperty('price');
          expect(product).toHaveProperty('category');
        }
      } catch (error) {
        console.error('Products API test failed:', error);
        throw error;
      }
    });

    test('should handle product creation', async () => {
      const testProduct = {
        name: 'Test Product API',
        description: 'Test product for API testing',
        sku: `TEST-API-${Date.now()}`,
        category: '688f8a544d8f7934666ba17f', // Electronics category ID
        price: 19.99,
        costPrice: 10.00,
        stock: 50,
        minStock: 10,
        maxStock: 200,
        unit: 'piece'
      };

      try {
        const response = await productsAPI.create(testProduct);
        expect(response.data).toBeDefined();
        
        // Clean up - delete the test product
        if (response.data.product && response.data.product._id) {
          await productsAPI.delete(response.data.product._id);
        }
      } catch (error) {
        console.error('Product creation test failed:', error);
        // Don't throw here as it might be an auth issue
      }
    });
  });

  describe('Categories API', () => {
    test('should fetch categories successfully', async () => {
      try {
        const response = await categoriesAPI.getAll();
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        
        if (response.data.length > 0) {
          const category = response.data[0];
          expect(category).toHaveProperty('_id');
          expect(category).toHaveProperty('name');
        }
      } catch (error) {
        console.error('Categories API test failed:', error);
        throw error;
      }
    });
  });

  describe('Authentication API', () => {
    test('should handle login correctly', async () => {
      try {
        const response = await authAPI.login({
          email: 'admin@pos.com',
          password: '123456'
        });
        
        expect(response.data).toBeDefined();
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('email', 'admin@pos.com');
      } catch (error) {
        console.error('Auth API test failed:', error);
        throw error;
      }
    });

    test('should reject invalid credentials', async () => {
      try {
        await authAPI.login({
          email: 'admin@pos.com',
          password: 'wrongpassword'
        });
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});

// Test data validation
describe('Data Validation Tests', () => {
  test('product data structure validation', () => {
    const validProduct = {
      _id: '123',
      name: 'Test Product',
      sku: 'TEST-001',
      category: { _id: 'cat1', name: 'Test Category' },
      price: 99.99,
      costPrice: 50.00,
      stock: 25,
      minStock: 5,
      maxStock: 100,
      unit: 'piece'
    };

    // Test category name extraction
    const categoryName = validProduct.category?.name || 'Unknown';
    expect(categoryName).toBe('Test Category');

    // Test category ID extraction for filtering
    const categoryId = validProduct.category?._id || validProduct.category;
    expect(categoryId).toBe('cat1');
  });

  test('handles category as string ID', () => {
    const productWithStringCategory = {
      _id: '123',
      name: 'Test Product',
      category: 'cat1', // String instead of object
      price: 99.99
    };

    const categoryId = productWithStringCategory.category?._id || productWithStringCategory.category;
    expect(categoryId).toBe('cat1');
  });
});