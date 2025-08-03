const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    return JSON.stringify(logEntry) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  info(message, meta = {}) {
    const logEntry = this.formatMessage('info', message, meta);
    console.log(`ℹ️  ${message}`, meta);
    this.writeToFile('app.log', logEntry);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code
        }
      })
    };

    const logEntry = this.formatMessage('error', message, errorMeta);
    console.error(`❌ ${message}`, errorMeta);
    this.writeToFile('error.log', logEntry);
    this.writeToFile('app.log', logEntry);
  }

  warn(message, meta = {}) {
    const logEntry = this.formatMessage('warn', message, meta);
    console.warn(`⚠️  ${message}`, meta);
    this.writeToFile('app.log', logEntry);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      const logEntry = this.formatMessage('debug', message, meta);
      console.log(`🐛 ${message}`, meta);
      this.writeToFile('debug.log', logEntry);
    }
  }

  test(message, meta = {}) {
    if (process.env.NODE_ENV === 'test') {
      const logEntry = this.formatMessage('test', message, meta);
      console.log(`🧪 ${message}`, meta);
      this.writeToFile('test.log', logEntry);
    }
  }

  // Database operation logging
  dbOperation(operation, collection, query = {}, result = null, error = null) {
    const meta = {
      operation,
      collection,
      query: JSON.stringify(query),
      ...(result && { result: typeof result === 'object' ? JSON.stringify(result) : result }),
      ...(error && { error: error.message })
    };

    if (error) {
      this.error(`Database operation failed: ${operation} on ${collection}`, error, meta);
    } else {
      this.debug(`Database operation: ${operation} on ${collection}`, meta);
    }
  }

  // API request logging
  apiRequest(method, url, statusCode, responseTime, error = null) {
    const meta = {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`
    };

    if (error) {
      this.error(`API request failed: ${method} ${url}`, error, meta);
    } else if (statusCode >= 400) {
      this.warn(`API request warning: ${method} ${url}`, meta);
    } else {
      this.info(`API request: ${method} ${url}`, meta);
    }
  }

  // Test-specific logging
  testStart(testName, testSuite = '') {
    this.test(`Test started: ${testSuite ? testSuite + ' - ' : ''}${testName}`);
  }

  testEnd(testName, testSuite = '', passed = true, duration = 0) {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    this.test(`Test ended: ${testSuite ? testSuite + ' - ' : ''}${testName} - ${status} (${duration}ms)`);
  }

  testError(testName, error, testSuite = '') {
    this.error(`Test failed: ${testSuite ? testSuite + ' - ' : ''}${testName}`, error, {
      testSuite,
      testName
    });
  }

  // Validation error logging
  validationError(field, value, rule, message) {
    this.warn('Validation error', {
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      rule,
      message
    });
  }

  // Authentication/Authorization logging
  authAttempt(email, success, reason = null) {
    const meta = { email, success };
    if (reason) meta.reason = reason;

    if (success) {
      this.info('Authentication successful', meta);
    } else {
      this.warn('Authentication failed', meta);
    }
  }

  authError(email, error, attemptType = 'login') {
    this.error(`Authentication error during ${attemptType}`, error, { email, attemptType });
  }

  // Tenant operation logging
  tenantOperation(operation, tenantId, userId, success = true, error = null) {
    const meta = {
      operation,
      tenantId,
      userId,
      success
    };

    if (error) {
      this.error(`Tenant operation failed: ${operation}`, error, meta);
    } else {
      this.info(`Tenant operation: ${operation}`, meta);
    }
  }

  // Clear logs (useful for testing)
  clearLogs() {
    const logFiles = ['app.log', 'error.log', 'debug.log', 'test.log'];
    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
      }
    });
  }

  // Get log contents
  getLogs(type = 'app') {
    const filePath = path.join(this.logDir, `${type}.log`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return '';
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;