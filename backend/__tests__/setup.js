const logger = require('../utils/logger');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DEBUG = 'false';

// Configure logger for tests
beforeAll(() => {
  logger.test('Test environment initialized');
  logger.info('Starting test suite execution');
});

afterAll(() => {
  logger.test('Test environment cleanup completed');
  logger.info('Test suite execution completed');
});

// Global error handling for tests
beforeEach(() => {
  // Clear any previous error handlers
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  
  // Add test-specific error handlers
  process.on('uncaughtException', (error) => {
    logger.testError('Uncaught Exception', error);
    throw error; // Re-throw to fail the test
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.testError('Unhandled Rejection', reason, {
      promise: promise.toString()
    });
    throw reason; // Re-throw to fail the test
  });
});

// Enhanced Jest matchers
expect.extend({
  toBeValidObjectId(received) {
    const pass = /^[0-9a-fA-F]{24}$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },

  toHaveTenantId(received, tenantId) {
    const pass = received.tenant && received.tenant.toString() === tenantId.toString();
    if (pass) {
      return {
        message: () => `expected object not to have tenantId ${tenantId}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have tenantId ${tenantId}, but got ${received.tenant}`,
        pass: false,
      };
    }
  },

  toBeValidApiResponse(received) {
    const hasSuccess = typeof received.success === 'boolean';
    const hasData = received.data !== undefined || received.message !== undefined;
    const pass = hasSuccess && hasData;
    
    if (pass) {
      return {
        message: () => `expected response not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be a valid API response with 'success' boolean and 'data' or 'message'`,
        pass: false,
      };
    }
  }
});

// Console override for cleaner test output
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log actual errors, not Mongoose warnings
  if (!args[0]?.includes?.('Warning') && !args[0]?.includes?.('DeprecationWarning')) {
    originalConsoleError(...args);
  }
};

// Memory leak detection
let initialMemory;
beforeAll(() => {
  initialMemory = process.memoryUsage();
});

afterAll(() => {
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  if (memoryIncrease > 50 * 1024 * 1024) { // 50MB threshold
    logger.warn('Potential memory leak detected', {
      initialHeap: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      finalHeap: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
    });
  }
});

// Test performance monitoring
const testTimes = new Map();

beforeEach(() => {
  const testName = expect.getState().currentTestName;
  testTimes.set(testName, Date.now());
});

afterEach(() => {
  const testName = expect.getState().currentTestName;
  const startTime = testTimes.get(testName);
  if (startTime) {
    const duration = Date.now() - startTime;
    if (duration > 5000) { // 5 second threshold
      logger.warn(`Slow test detected: ${testName}`, {
        duration: `${duration}ms`
      });
    }
    testTimes.delete(testName);
  }
});

module.exports = {
  logger
};