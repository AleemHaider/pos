// Custom commands for the POS application

// Authentication commands
Cypress.Commands.add('login', (email = 'admin@pos.com', password = '123456') => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Wait for successful login
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('user');
  });
  cy.visit('/login');
});

// Navigation commands
Cypress.Commands.add('navigateToProducts', () => {
  cy.get('[data-testid="nav-products"]').click();
  cy.url().should('include', '/products');
  cy.get('[data-testid="products-page"]').should('be.visible');
});

Cypress.Commands.add('navigateToSales', () => {
  cy.get('[data-testid="nav-sales"]').click();
  cy.url().should('include', '/sales');
  cy.get('[data-testid="sales-page"]').should('be.visible');
});

Cypress.Commands.add('navigateToDashboard', () => {
  cy.get('[data-testid="nav-dashboard"]').click();
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="dashboard-page"]').should('be.visible');
});

Cypress.Commands.add('navigateToCustomers', () => {
  cy.get('[data-testid="nav-customers"]').click();
  cy.url().should('include', '/customers');
  cy.get('[data-testid="customers-page"]').should('be.visible');
});

// Product management commands
Cypress.Commands.add('createProduct', (productData = {}) => {
  const defaultProduct = {
    name: 'Test Product',
    sku: `TEST-${Date.now()}`,
    price: '29.99',
    costPrice: '15.00',
    stock: '100',
    minStock: '10',
    maxStock: '500',
    category: 'Electronics',
    ...productData
  };

  cy.get('[data-testid="add-product-btn"]').click();
  cy.get('[data-testid="product-form"]').should('be.visible');
  
  cy.get('input[name="name"]').type(defaultProduct.name);
  cy.get('input[name="sku"]').type(defaultProduct.sku);
  cy.get('input[name="price"]').type(defaultProduct.price);
  cy.get('input[name="costPrice"]').type(defaultProduct.costPrice);
  cy.get('input[name="stock"]').type(defaultProduct.stock);
  cy.get('input[name="minStock"]').type(defaultProduct.minStock);
  cy.get('input[name="maxStock"]').type(defaultProduct.maxStock);
  
  // Select category
  cy.get('[data-testid="category-select"]').click();
  cy.get(`[data-testid="category-option-${defaultProduct.category}"]`).click();
  
  cy.get('button[type="submit"]').click();
  
  // Wait for success message
  cy.get('[data-testid="success-toast"]').should('be.visible');
  
  return cy.wrap(defaultProduct);
});

Cypress.Commands.add('editProduct', (productName, updates = {}) => {
  // Find product row and click edit
  cy.get('[data-testid="products-table"]')
    .contains('tr', productName)
    .find('[data-testid="edit-product-btn"]')
    .click();
  
  cy.get('[data-testid="product-form"]').should('be.visible');
  
  // Apply updates
  Object.entries(updates).forEach(([field, value]) => {
    cy.get(`input[name="${field}"]`).clear().type(value);
  });
  
  cy.get('button[type="submit"]').click();
  cy.get('[data-testid="success-toast"]').should('be.visible');
});

Cypress.Commands.add('deleteProduct', (productName, confirm = true) => {
  cy.get('[data-testid="products-table"]')
    .contains('tr', productName)
    .find('[data-testid="delete-product-btn"]')
    .click();
  
  if (confirm) {
    cy.get('[data-testid="confirm-dialog"]').should('be.visible');
    cy.get('[data-testid="confirm-delete-btn"]').click();
    cy.get('[data-testid="success-toast"]').should('be.visible');
  } else {
    cy.get('[data-testid="cancel-delete-btn"]').click();
  }
});

// Customer management commands
Cypress.Commands.add('createCustomer', (customerData = {}) => {
  const defaultCustomer = {
    name: 'Test Customer',
    email: `customer${Date.now()}@example.com`,
    phone: '+1234567890',
    address: '123 Test St',
    ...customerData
  };

  cy.get('[data-testid="add-customer-btn"]').click();
  cy.get('[data-testid="customer-form"]').should('be.visible');
  
  cy.get('input[name="name"]').type(defaultCustomer.name);
  cy.get('input[name="email"]').type(defaultCustomer.email);
  cy.get('input[name="phone"]').type(defaultCustomer.phone);
  cy.get('input[name="address"]').type(defaultCustomer.address);
  
  cy.get('button[type="submit"]').click();
  cy.get('[data-testid="success-toast"]').should('be.visible');
  
  return cy.wrap(defaultCustomer);
});

// Sales/POS commands
Cypress.Commands.add('createSale', (saleData = {}) => {
  const defaultSale = {
    items: [
      { productName: 'Test Product', quantity: 2 }
    ],
    customer: 'Test Customer',
    paymentMethod: 'cash',
    ...saleData
  };

  cy.get('[data-testid="pos-terminal"]').should('be.visible');
  
  // Add items to cart
  defaultSale.items.forEach(item => {
    cy.get('[data-testid="product-search"]').type(item.productName);
    cy.get(`[data-testid="product-${item.productName}"]`).click();
    
    if (item.quantity > 1) {
      cy.get('[data-testid="quantity-input"]').clear().type(item.quantity.toString());
    }
    
    cy.get('[data-testid="add-to-cart-btn"]').click();
  });
  
  // Select customer if provided
  if (defaultSale.customer) {
    cy.get('[data-testid="customer-select"]').click();
    cy.get(`[data-testid="customer-${defaultSale.customer}"]`).click();
  }
  
  // Select payment method
  cy.get(`[data-testid="payment-${defaultSale.paymentMethod}"]`).click();
  
  // Complete sale
  cy.get('[data-testid="complete-sale-btn"]').click();
  cy.get('[data-testid="sale-complete-modal"]').should('be.visible');
  
  return cy.wrap(defaultSale);
});

// Search and filter commands
Cypress.Commands.add('searchProducts', (searchTerm) => {
  cy.get('[data-testid="product-search"]').clear().type(searchTerm);
  cy.get('[data-testid="products-table"]').should('be.visible');
});

Cypress.Commands.add('filterByCategory', (categoryName) => {
  cy.get('[data-testid="category-filter"]').click();
  cy.get(`[data-testid="category-${categoryName}"]`).click();
  cy.get('[data-testid="products-table"]').should('be.visible');
});

// Dashboard testing commands
Cypress.Commands.add('checkDashboardKPIs', () => {
  cy.get('[data-testid="total-revenue"]').should('be.visible');
  cy.get('[data-testid="total-sales"]').should('be.visible');
  cy.get('[data-testid="total-customers"]').should('be.visible');
  cy.get('[data-testid="avg-order-value"]').should('be.visible');
});

Cypress.Commands.add('changeDashboardTimeRange', (timeRange) => {
  cy.get('[data-testid="time-range-selector"]').click();
  cy.get(`[data-testid="time-range-${timeRange}"]`).click();
  
  // Wait for data to reload
  cy.get('[data-testid="dashboard-loading"]').should('not.exist');
});

// Responsive testing commands
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.log(`Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    callback(viewport);
  });
});

// Accessibility testing commands
Cypress.Commands.add('checkA11y', (selector = null) => {
  cy.get(selector || 'body').should('be.visible');
  // This would integrate with cypress-axe for automated accessibility testing
  // cy.checkA11y(selector);
});

// Performance testing commands
Cypress.Commands.add('measureLoadTime', (threshold = 3000) => {
  cy.window().then((win) => {
    const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
    cy.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).to.be.lessThan(threshold);
  });
});

// Data cleanup commands
Cypress.Commands.add('cleanupTestData', () => {
  // This would clean up any test data created during the test
  cy.task('clearDatabase');
});

// API testing commands
Cypress.Commands.add('apiRequest', (method, url, body = null, options = {}) => {
  const token = window.localStorage.getItem('token');
  const tenantId = window.localStorage.getItem('currentTenant');
  
  const requestOptions = {
    method,
    url: `${Cypress.env('API_URL')}${url}`,
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
      'X-Tenant-ID': tenantId || undefined,
      'Content-Type': 'application/json',
      ...options.headers
    },
    body,
    ...options
  };

  return cy.request(requestOptions);
});

// Multi-tenancy testing commands
Cypress.Commands.add('switchTenant', (tenantId) => {
  cy.window().then((win) => {
    win.localStorage.setItem('currentTenant', tenantId);
  });
  cy.reload();
});

Cypress.Commands.add('createTenant', (tenantData = {}) => {
  const defaultTenant = {
    name: `Test Tenant ${Date.now()}`,
    slug: `test-tenant-${Date.now()}`,
    ...tenantData
  };

  return cy.apiRequest('POST', '/tenant', defaultTenant);
});