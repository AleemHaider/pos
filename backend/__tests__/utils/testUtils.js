const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

// Models
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Customer = require('../../models/Customer');
const Sale = require('../../models/Sale');
const Plan = require('../../models/Plan');
const Subscription = require('../../models/Subscription');

let mongoServer;

// Database setup and teardown
const setupTestDatabase = async () => {
  try {
    if (!mongoServer) {
      logger.test('Setting up test database...');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      await mongoose.connect(mongoUri);
      logger.test('Test database connected successfully', { mongoUri });
    }
  } catch (error) {
    logger.testError('Database setup', error);
    throw new Error(`Failed to setup test database: ${error.message}`);
  }
};

const teardownTestDatabase = async () => {
  try {
    if (mongoServer) {
      logger.test('Tearing down test database...');
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      await mongoServer.stop();
      mongoServer = null;
      logger.test('Test database torn down successfully');
    }
  } catch (error) {
    logger.testError('Database teardown', error);
    // Don't throw error in teardown to avoid masking test failures
  }
};

const clearDatabase = async () => {
  try {
    logger.test('Clearing test database...');
    const collections = mongoose.connection.collections;
    const clearPromises = [];
    
    for (const key in collections) {
      const collection = collections[key];
      clearPromises.push(collection.deleteMany({}));
    }
    
    await Promise.all(clearPromises);
    logger.test('Test database cleared successfully');
  } catch (error) {
    logger.testError('Database clear', error);
    throw new Error(`Failed to clear test database: ${error.message}`);
  }
};

// Mock data generators with error handling
const createMockTenant = async (overrides = {}) => {
  try {
    logger.test('Creating mock tenant...', { overrides: Object.keys(overrides) });
    
    // Create a temporary user first if no owner is provided
    let ownerId = overrides.owner;
    if (!ownerId) {
      const tempUser = await createMockUser(null, { email: `temp${Date.now()}@example.com` });
      ownerId = tempUser._id;
      logger.test('Created temporary user for tenant owner', { userId: ownerId });
    }

    const tenantData = {
      name: 'Test Store',
      slug: `test-store-${Date.now()}`, // Make slug unique
      owner: ownerId,
      settings: {
        businessType: 'retail',
        currency: 'USD',
        timezone: 'UTC',
        taxRate: 0,
        ...overrides.settings
      },
      limits: {
        maxUsers: 10,
        maxProducts: 1000,
        maxCustomers: 500,
        maxLocations: 1,
        maxTransactionsPerMonth: 1000,
        ...overrides.limits
      },
      status: 'active',
      ...overrides
    };

    const tenant = new Tenant(tenantData);
    const savedTenant = await tenant.save();
    
    logger.test('Mock tenant created successfully', { 
      tenantId: savedTenant._id,
      tenantName: savedTenant.name 
    });
    
    return savedTenant;
  } catch (error) {
    logger.testError('Mock tenant creation', error, { overrides });
    throw new Error(`Failed to create mock tenant: ${error.message}`);
  }
};

const createMockUser = async (tenantId, overrides = {}) => {
  try {
    logger.test('Creating mock user...', { tenantId, overrides: Object.keys(overrides) });
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const userData = {
      name: 'Test User',
      email: overrides.email || `test${Date.now()}@example.com`, // Ensure unique email
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      isActive: true,
      ...overrides
    };

    // Set tenant fields if tenantId is provided
    if (tenantId) {
      userData.tenant = tenantId;
      userData.currentTenant = tenantId;
      userData.tenants = [{ tenant: tenantId, role: overrides.role || 'admin' }];
    }

    const user = new User(userData);
    const savedUser = await user.save();
    
    logger.test('Mock user created successfully', { 
      userId: savedUser._id,
      email: savedUser.email,
      tenantId: tenantId 
    });
    
    return savedUser;
  } catch (error) {
    logger.testError('Mock user creation', error, { tenantId, overrides });
    throw new Error(`Failed to create mock user: ${error.message}`);
  }
};

const createMockPlan = async (overrides = {}) => {
  try {
    logger.test('Creating mock plan...', { overrides: Object.keys(overrides) });
    
    const planData = {
      name: `Premium Plan ${Date.now()}`,
      slug: `premium-${Date.now()}`,
      description: 'Premium features for growing businesses',
      price: {
        monthly: 29.99,
        yearly: 299.99
      },
      features: {
        inventory: true,
        customers: true,
        analytics: true,
        multiLocation: false,
        advancedReporting: true,
        apiAccess: false,
        customBranding: false,
        prioritySupport: true
      },
      limits: {
        maxUsers: 10,
        maxProducts: 1000,
        maxCustomers: 500,
        maxLocations: 1,
        maxTransactionsPerMonth: 1000,
        dataRetentionDays: 365
      },
      isActive: true,
      trialDays: 14,
      ...overrides
    };

    const plan = new Plan(planData);
    const savedPlan = await plan.save();
    
    logger.test('Mock plan created successfully', { 
      planId: savedPlan._id,
      planName: savedPlan.name 
    });
    
    return savedPlan;
  } catch (error) {
    logger.testError('Mock plan creation', error, { overrides });
    throw new Error(`Failed to create mock plan: ${error.message}`);
  }
};

const createMockSubscription = async (tenantId, planId, overrides = {}) => {
  try {
    logger.test('Creating mock subscription...', { tenantId, planId });
    
    const subscriptionData = {
      tenant: tenantId,
      plan: planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paymentMethod: 'card',
      ...overrides
    };

    const subscription = new Subscription(subscriptionData);
    const savedSubscription = await subscription.save();
    
    logger.test('Mock subscription created successfully', { 
      subscriptionId: savedSubscription._id,
      tenantId,
      planId 
    });
    
    return savedSubscription;
  } catch (error) {
    logger.testError('Mock subscription creation', error, { tenantId, planId, overrides });
    throw new Error(`Failed to create mock subscription: ${error.message}`);
  }
};

const createMockCategory = async (tenantId, createdBy = null, overrides = {}) => {
  // Create a user if not provided
  if (!createdBy) {
    const user = await createMockUser(tenantId, { email: `cat-user-${Date.now()}@example.com` });
    createdBy = user._id;
  }

  const category = new Category({
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    tenant: tenantId,
    createdBy,
    ...overrides
  });

  return await category.save();
};

const createMockProduct = async (tenantId, categoryId, createdBy, overrides = {}) => {
  const product = new Product({
    name: 'Test Product',
    description: 'A test product',
    sku: `TEST-${Date.now()}`,
    category: categoryId,
    price: 29.99,
    costPrice: 15.00,
    stock: 100,
    minStock: 10,
    maxStock: 500,
    unit: 'piece',
    tenant: tenantId,
    createdBy,
    ...overrides
  });

  return await product.save();
};

const createMockCustomer = async (tenantId, overrides = {}) => {
  const customer = new Customer({
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+1234567890',
    address: '123 Test St, Test City',
    tenant: tenantId,
    ...overrides
  });

  return await customer.save();
};

const createMockSale = async (tenantId, customerId, productId, overrides = {}) => {
  const sale = new Sale({
    items: [
      {
        product: productId,
        quantity: 2,
        price: 29.99,
        total: 59.98
      }
    ],
    customer: customerId,
    total: 59.98,
    paymentMethod: 'cash',
    status: 'completed',
    tenant: tenantId,
    cashier: null, // Will be set if needed
    ...overrides
  });

  return await sale.save();
};

// Authentication helpers
const generateAuthToken = (userId, tenantId = null) => {
  const payload = { userId };
  if (tenantId) {
    payload.tenantId = tenantId;
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

const createAuthHeaders = (token, tenantId = null) => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  
  return headers;
};

// Test data helpers
const createCompleteTestSetup = async () => {
  // Create tenant
  const tenant = await createMockTenant();
  
  // Create user and associate with tenant
  const user = await createMockUser(tenant._id);
  tenant.owner = user._id;
  await tenant.save();
  
  // Create plan and subscription
  const plan = await createMockPlan();
  const subscription = await createMockSubscription(tenant._id, plan._id);
  
  // Create category and product
  const category = await createMockCategory(tenant._id, user._id);
  const product = await createMockProduct(tenant._id, category._id, user._id);
  
  // Create customer and sale
  const customer = await createMockCustomer(tenant._id);
  const sale = await createMockSale(tenant._id, customer._id, product._id);
  
  // Generate auth token
  const token = generateAuthToken(user._id, tenant._id);
  const headers = createAuthHeaders(token, tenant._id);
  
  return {
    tenant,
    user,
    plan,
    subscription,
    category,
    product,
    customer,
    sale,
    token,
    headers
  };
};

// Error testing helpers
const expectValidationError = (error, field) => {
  expect(error).toBeDefined();
  expect(error.name).toBe('ValidationError');
  expect(error.errors[field]).toBeDefined();
};

const expectUnauthorizedError = (response) => {
  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/unauthorized|token/i);
};

const expectForbiddenError = (response) => {
  expect(response.status).toBe(403);
  expect(response.body.message).toMatch(/forbidden|access/i);
};

const expectNotFoundError = (response) => {
  expect(response.status).toBe(404);
  expect(response.body.message).toMatch(/not found/i);
};

// Multi-tenancy testing helpers
const createMultiTenantSetup = async () => {
  // Create two separate tenants with their own data
  const tenant1Data = await createCompleteTestSetup();
  const tenant2Data = await createCompleteTestSetup();
  
  // Modify the second tenant to have different data
  tenant2Data.tenant.name = 'Second Store';
  tenant2Data.tenant.slug = 'second-store';
  await tenant2Data.tenant.save();
  
  tenant2Data.user.email = 'test2@example.com';
  await tenant2Data.user.save();
  
  return {
    tenant1: tenant1Data,
    tenant2: tenant2Data
  };
};

// Performance testing helpers
const createLargeDataset = async (tenantId, counts = {}) => {
  const {
    categories = 10,
    products = 100,
    customers = 50,
    sales = 200
  } = counts;
  
  const createdData = {
    categories: [],
    products: [],
    customers: [],
    sales: []
  };
  
  // Create categories
  for (let i = 0; i < categories; i++) {
    const category = await createMockCategory(tenantId, {
      name: `Category ${i + 1}`
    });
    createdData.categories.push(category);
  }
  
  // Create products
  for (let i = 0; i < products; i++) {
    const categoryIndex = i % createdData.categories.length;
    const product = await createMockProduct(
      tenantId,
      createdData.categories[categoryIndex]._id,
      {
        name: `Product ${i + 1}`,
        sku: `PROD-${i + 1}`
      }
    );
    createdData.products.push(product);
  }
  
  // Create customers
  for (let i = 0; i < customers; i++) {
    const customer = await createMockCustomer(tenantId, {
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`
    });
    createdData.customers.push(customer);
  }
  
  // Create sales
  for (let i = 0; i < sales; i++) {
    const customerIndex = i % createdData.customers.length;
    const productIndex = i % createdData.products.length;
    
    const sale = await createMockSale(
      tenantId,
      createdData.customers[customerIndex]._id,
      createdData.products[productIndex]._id
    );
    createdData.sales.push(sale);
  }
  
  return createdData;
};

// API Response helpers
const expectSuccessResponse = (response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
};

const expectPaginatedResponse = (response, expectedFields = []) => {
  expectSuccessResponse(response);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('pages');
  expect(response.body.pagination).toHaveProperty('total');
  
  if (expectedFields.length > 0 && response.body.data.length > 0) {
    expectedFields.forEach(field => {
      expect(response.body.data[0]).toHaveProperty(field);
    });
  }
};

module.exports = {
  // Database helpers
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  
  // Mock data creators
  createMockTenant,
  createMockUser,
  createMockPlan,
  createMockSubscription,
  createMockCategory,
  createMockProduct,
  createMockCustomer,
  createMockSale,
  
  // Authentication helpers
  generateAuthToken,
  createAuthHeaders,
  
  // Complex setup helpers
  createCompleteTestSetup,
  createMultiTenantSetup,
  createLargeDataset,
  
  // Error testing helpers
  expectValidationError,
  expectUnauthorizedError,
  expectForbiddenError,
  expectNotFoundError,
  
  // Response testing helpers
  expectSuccessResponse,
  expectPaginatedResponse
};