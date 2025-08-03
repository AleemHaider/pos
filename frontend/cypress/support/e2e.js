// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch;
  win.fetch = function (...args) {
    return originalFetch.apply(this, args);
  };
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on unhandled promise rejections from libraries
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  // Don't fail tests on network errors during testing
  if (err.message.includes('Network Error') || err.message.includes('fetch')) {
    return false;
  }
  
  return true;
});

// Set up API intercepts for consistent testing
beforeEach(() => {
  // Intercept API calls and provide consistent responses
  cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' }).as('getCurrentUser');
  cy.intercept('GET', '/api/products', { fixture: 'products.json' }).as('getProducts');
  cy.intercept('GET', '/api/categories', { fixture: 'categories.json' }).as('getCategories');
  cy.intercept('GET', '/api/customers', { fixture: 'customers.json' }).as('getCustomers');
  cy.intercept('GET', '/api/dashboard/stats', { fixture: 'dashboardStats.json' }).as('getDashboardStats');
  cy.intercept('GET', '/api/analytics/sales', { fixture: 'salesAnalytics.json' }).as('getSalesAnalytics');
});

// Custom viewport commands for responsive testing
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1920, 1080); // Desktop
});

// Performance testing
Cypress.Commands.add('measurePageLoad', (pageName) => {
  cy.window().then((win) => {
    const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
    cy.log(`${pageName} load time: ${loadTime}ms`);
    expect(loadTime).to.be.lessThan(3000); // 3 second threshold
  });
});