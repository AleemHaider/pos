const logger = require('../utils/logger');
const { setupTestDatabase, teardownTestDatabase } = require('./utils/testUtils');

class TestRunner {
  constructor() {
    this.testSuites = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  // Register a test suite
  registerSuite(name, testFn) {
    this.testSuites.push({ name, testFn });
  }

  // Run all test suites
  async runAll() {
    logger.info('Starting test runner...');
    logger.clearLogs(); // Clear previous test logs
    
    const startTime = Date.now();
    
    try {
      // Setup database once for all tests
      await setupTestDatabase();
      logger.test('Test database setup completed');

      for (const suite of this.testSuites) {
        await this.runSuite(suite);
      }

      // Teardown database
      await teardownTestDatabase();
      logger.test('Test database teardown completed');

      const totalTime = Date.now() - startTime;
      this.logResults(totalTime);
      
      return this.results;
    } catch (error) {
      logger.testError('Test runner', error);
      throw error;
    }
  }

  // Run a single test suite
  async runSuite(suite) {
    const suiteStartTime = Date.now();
    logger.testStart(suite.name, 'Suite');
    
    try {
      await suite.testFn();
      const duration = Date.now() - suiteStartTime;
      logger.testEnd(suite.name, 'Suite', true, duration);
      this.results.passed++;
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      logger.testEnd(suite.name, 'Suite', false, duration);
      logger.testError(suite.name, error, 'Suite');
      this.results.failed++;
      this.results.errors.push({
        suite: suite.name,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Log final results
  logResults(totalTime) {
    const summary = {
      total: this.results.passed + this.results.failed + this.results.skipped,
      passed: this.results.passed,
      failed: this.results.failed,
      skipped: this.results.skipped,
      duration: `${totalTime}ms`,
      success: this.results.failed === 0
    };

    logger.info('Test runner completed', summary);
    
    if (this.results.errors.length > 0) {
      logger.error('Test failures detected', null, {
        errorCount: this.results.errors.length,
        errors: this.results.errors
      });
    }

    // Console output for immediate feedback
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️  Skipped: ${summary.skipped}`);
    console.log(`⏱️  Duration: ${summary.duration}`);
    console.log(`📊 Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (this.results.errors.length > 0) {
      console.log('\nFAILED TESTS:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.suite}: ${error.error}`);
      });
    }
  }

  // Helper method to run individual test functions with error handling
  async runTest(testName, testFn, suite = '') {
    const testStartTime = Date.now();
    logger.testStart(testName, suite);
    
    try {
      await testFn();
      const duration = Date.now() - testStartTime;
      logger.testEnd(testName, suite, true, duration);
      return { passed: true, duration };
    } catch (error) {
      const duration = Date.now() - testStartTime;
      logger.testEnd(testName, suite, false, duration);
      logger.testError(testName, error, suite);
      return { passed: false, duration, error };
    }
  }

  // Validate test environment
  validateEnvironment() {
    const required = [
      'NODE_ENV',
      'JWT_SECRET'
    ];

    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Set test-specific environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';
    
    logger.test('Test environment validated', {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
  }

  // Performance monitoring
  measurePerformance(operation, fn) {
    return async (...args) => {
      const startTime = Date.now();
      try {
        const result = await fn(...args);
        const duration = Date.now() - startTime;
        
        if (duration > 1000) {
          logger.warn(`Slow operation detected: ${operation}`, {
            duration: `${duration}ms`,
            operation
          });
        } else {
          logger.debug(`Operation completed: ${operation}`, {
            duration: `${duration}ms`,
            operation
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Operation failed: ${operation}`, error, {
          duration: `${duration}ms`,
          operation
        });
        throw error;
      }
    };
  }

  // Memory usage monitoring
  logMemoryUsage(label = '') {
    const usage = process.memoryUsage();
    const formatBytes = (bytes) => {
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    logger.debug(`Memory usage ${label}`, {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external)
    });
  }
}

// Global error handlers for tests
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in tests', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in tests', reason, {
    promise: promise.toString()
  });
  process.exit(1);
});

module.exports = TestRunner;