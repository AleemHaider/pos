describe('Multi-Tenancy', () => {
  describe('Tenant Onboarding', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should complete tenant onboarding flow', () => {
      const tenantData = {
        name: 'Test Store',
        ownerName: 'Store Owner',
        email: `owner${Date.now()}@example.com`,
        password: 'password123',
        storeName: 'My Test Store',
        businessType: 'retail',
        currency: 'USD',
        timezone: 'America/New_York'
      };

      // Step 1: Owner Registration
      cy.get('input[name="name"]').type(tenantData.ownerName);
      cy.get('input[name="email"]').type(tenantData.email);
      cy.get('input[name="password"]').type(tenantData.password);
      cy.get('input[name="confirmPassword"]').type(tenantData.password);
      cy.get('button[type="submit"]').click();

      // Should redirect to tenant setup
      cy.url().should('include', '/onboarding/tenant');

      // Step 2: Store Information
      cy.get('[data-testid="tenant-setup-form"]').should('be.visible');
      cy.get('input[name="storeName"]').type(tenantData.storeName);
      cy.get('select[name="businessType"]').select(tenantData.businessType);
      cy.get('select[name="currency"]').select(tenantData.currency);
      cy.get('select[name="timezone"]').select(tenantData.timezone);
      
      cy.get('[data-testid="continue-btn"]').click();

      // Step 3: Subscription Plan Selection
      cy.url().should('include', '/onboarding/subscription');
      cy.get('[data-testid="plan-basic"]').click();
      cy.get('[data-testid="start-trial-btn"]').click();

      // Should complete onboarding and redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="welcome-message"]')
        .should('be.visible')
        .and('contain', 'Welcome to your store');
    });

    it('should validate tenant setup form', () => {
      // Register user first
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type(`test${Date.now()}@example.com`);
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();

      // Try to submit empty tenant form
      cy.get('[data-testid="continue-btn"]').click();

      cy.get('input[name="storeName"]:invalid').should('exist');
      cy.get('select[name="businessType"]:invalid').should('exist');
    });

    it('should handle unique store slug validation', () => {
      // Create tenant with existing slug
      cy.createTenant({ slug: 'existing-store' });

      cy.get('input[name="name"]').type('New User');
      cy.get('input[name="email"]').type(`new${Date.now()}@example.com`);
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.get('input[name="storeName"]').type('Existing Store'); // Will generate existing-store slug
      cy.get('select[name="businessType"]').select('retail');
      cy.get('[data-testid="continue-btn"]').click();

      cy.get('[data-testid="slug-error"]')
        .should('be.visible')
        .and('contain', 'Store name already taken');
    });
  });

  describe('Tenant Switching', () => {
    beforeEach(() => {
      // Create user with multiple tenants
      cy.login();
      cy.visit('/dashboard');
    });

    it('should display tenant selector', () => {
      cy.get('[data-testid="tenant-selector"]').should('be.visible');
      cy.get('[data-testid="current-tenant-name"]').should('be.visible');
    });

    it('should switch between tenants', () => {
      // Create second tenant for user
      cy.apiRequest('POST', '/tenant', {
        name: 'Second Store',
        slug: 'second-store'
      });

      // Add user to second tenant
      cy.apiRequest('POST', '/tenant/second-store/users', {
        email: 'admin@pos.com',
        role: 'admin'
      });

      cy.reload();

      cy.get('[data-testid="tenant-selector"]').click();
      cy.get('[data-testid="tenant-option-second-store"]').click();

      cy.get('[data-testid="current-tenant-name"]').should('contain', 'Second Store');
      
      // Verify data isolation - should see different products
      cy.navigateToProducts();
      cy.get('[data-testid="products-table"]').should('not.contain', 'Test Product');
    });

    it('should maintain tenant context across pages', () => {
      cy.switchTenant('test-tenant-2');
      
      cy.navigateToProducts();
      cy.get('[data-testid="current-tenant-name"]').should('contain', 'Test Tenant 2');
      
      cy.navigateToSales();
      cy.get('[data-testid="current-tenant-name"]').should('contain', 'Test Tenant 2');
      
      cy.navigateToDashboard();
      cy.get('[data-testid="current-tenant-name"]').should('contain', 'Test Tenant 2');
    });

    it('should handle tenant access restrictions', () => {
      // Try to access tenant user doesn't belong to
      cy.window().then((win) => {
        win.localStorage.setItem('currentTenant', 'unauthorized-tenant-id');
      });
      
      cy.reload();
      
      cy.get('[data-testid="access-denied"]')
        .should('be.visible')
        .and('contain', 'Access denied');
      
      // Should revert to valid tenant
      cy.get('[data-testid="tenant-selector"]').should('be.visible');
    });
  });

  describe('Tenant Data Isolation', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should isolate products between tenants', () => {
      // Switch to tenant 1
      cy.switchTenant('tenant-1');
      cy.navigateToProducts();
      
      // Create product in tenant 1
      cy.createProduct({
        name: 'Tenant 1 Product',
        sku: 'T1-001'
      });

      // Switch to tenant 2
      cy.switchTenant('tenant-2');
      cy.navigateToProducts();
      
      // Should not see tenant 1's product
      cy.get('[data-testid="products-table"]').should('not.contain', 'Tenant 1 Product');
      
      // Create product in tenant 2 with same SKU
      cy.createProduct({
        name: 'Tenant 2 Product',
        sku: 'T1-001' // Same SKU should be allowed in different tenant
      });
      
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('should isolate customers between tenants', () => {
      cy.switchTenant('tenant-1');
      cy.navigateToCustomers();
      
      cy.createCustomer({
        name: 'Tenant 1 Customer',
        email: 'customer1@tenant1.com'
      });

      cy.switchTenant('tenant-2');
      cy.navigateToCustomers();
      
      cy.get('[data-testid="customers-table"]').should('not.contain', 'Tenant 1 Customer');
    });

    it('should isolate sales between tenants', () => {
      cy.switchTenant('tenant-1');
      cy.navigateToSales();
      
      // Create sale in tenant 1
      cy.createSale({
        items: [{ productName: 'Tenant 1 Product', quantity: 1 }]
      });

      cy.switchTenant('tenant-2');
      cy.visit('/sales/history');
      
      // Should not see tenant 1's sales
      cy.get('[data-testid="sales-table"]').should('not.contain', 'Tenant 1 Product');
    });

    it('should prevent cross-tenant data access via API', () => {
      cy.switchTenant('tenant-1');
      
      // Try to access tenant-2's products via API
      cy.apiRequest('GET', '/products', null, {
        headers: { 'X-Tenant-ID': 'tenant-2-id' }
      }).then((response) => {
        expect(response.status).to.equal(403);
        expect(response.body.message).to.match(/access denied/i);
      });
    });
  });

  describe('Tenant Settings', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/settings/tenant');
    });

    it('should display tenant settings', () => {
      cy.get('[data-testid="tenant-settings"]').should('be.visible');
      cy.get('[data-testid="store-name"]').should('be.visible');
      cy.get('[data-testid="business-type"]').should('be.visible');
      cy.get('[data-testid="currency-setting"]').should('be.visible');
      cy.get('[data-testid="timezone-setting"]').should('be.visible');
    });

    it('should update tenant settings', () => {
      cy.get('input[name="storeName"]').clear().type('Updated Store Name');
      cy.get('select[name="currency"]').select('EUR');
      cy.get('select[name="timezone"]').select('Europe/London');
      
      cy.get('[data-testid="save-settings-btn"]').click();
      
      cy.get('[data-testid="settings-saved"]')
        .should('be.visible')
        .and('contain', 'Settings updated successfully');
      
      // Verify changes are reflected
      cy.get('[data-testid="current-tenant-name"]').should('contain', 'Updated Store Name');
    });

    it('should validate setting changes', () => {
      cy.get('input[name="storeName"]').clear();
      cy.get('[data-testid="save-settings-btn"]').click();
      
      cy.get('[data-testid="validation-error"]')
        .should('be.visible')
        .and('contain', 'Store name is required');
    });

    it('should handle logo upload', () => {
      cy.get('[data-testid="logo-upload"]').should('be.visible');
      
      const fileName = 'store-logo.png';
      cy.fixture(fileName, 'base64').then(fileContent => {
        cy.get('input[type="file"]').invoke('attr', 'style', 'display: block');
        cy.get('input[type="file"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName,
          mimeType: 'image/png'
        });
      });
      
      cy.get('[data-testid="upload-logo-btn"]').click();
      
      cy.get('[data-testid="logo-uploaded"]')
        .should('be.visible')
        .and('contain', 'Logo updated successfully');
    });
  });

  describe('Tenant Subscription Management', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/settings/subscription');
    });

    it('should display current subscription', () => {
      cy.get('[data-testid="current-plan"]').should('be.visible');
      cy.get('[data-testid="plan-name"]').should('contain', 'Basic');
      cy.get('[data-testid="plan-limits"]').should('be.visible');
      cy.get('[data-testid="usage-metrics"]').should('be.visible');
    });

    it('should show usage against limits', () => {
      cy.get('[data-testid="users-usage"]').should('be.visible');
      cy.get('[data-testid="products-usage"]').should('be.visible');
      cy.get('[data-testid="storage-usage"]').should('be.visible');
      
      cy.get('[data-testid="usage-progress"]').should('exist');
    });

    it('should upgrade subscription plan', () => {
      cy.get('[data-testid="upgrade-plan-btn"]').click();
      
      cy.get('[data-testid="plan-selection"]').should('be.visible');
      cy.get('[data-testid="plan-professional"]').click();
      
      cy.get('[data-testid="payment-form"]').should('be.visible');
      cy.get('input[name="cardNumber"]').type('4111111111111111');
      cy.get('input[name="expiryDate"]').type('12/25');
      cy.get('input[name="cvv"]').type('123');
      
      cy.get('[data-testid="confirm-upgrade-btn"]').click();
      
      cy.get('[data-testid="upgrade-success"]')
        .should('be.visible')
        .and('contain', 'Plan upgraded successfully');
    });

    it('should handle subscription cancellation', () => {
      cy.get('[data-testid="cancel-subscription-btn"]').click();
      
      cy.get('[data-testid="cancellation-modal"]').should('be.visible');
      cy.get('[data-testid="cancellation-reason"]').select('Not using enough');
      cy.get('[data-testid="feedback"]').type('Found a better alternative');
      
      cy.get('[data-testid="confirm-cancellation-btn"]').click();
      
      cy.get('[data-testid="cancellation-confirmed"]')
        .should('be.visible')
        .and('contain', 'Subscription cancelled');
    });

    it('should warn when approaching limits', () => {
      // Mock approaching limits
      cy.intercept('GET', '/api/tenant/usage', {
        body: {
          data: {
            users: { current: 4, limit: 5 },
            products: { current: 950, limit: 1000 },
            storage: { current: 900, limit: 1000 }
          }
        }
      }).as('getUsageNearLimit');

      cy.reload();
      cy.wait('@getUsageNearLimit');

      cy.get('[data-testid="limit-warning"]')
        .should('be.visible')
        .and('contain', 'approaching your plan limits');
    });
  });

  describe('Tenant User Management', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/settings/users');
    });

    it('should display tenant users', () => {
      cy.get('[data-testid="users-table"]').should('be.visible');
      cy.get('[data-testid="add-user-btn"]').should('be.visible');
    });

    it('should invite new user to tenant', () => {
      cy.get('[data-testid="add-user-btn"]').click();
      
      cy.get('[data-testid="invite-user-form"]').should('be.visible');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('select[name="role"]').select('manager');
      
      cy.get('[data-testid="send-invitation-btn"]').click();
      
      cy.get('[data-testid="invitation-sent"]')
        .should('be.visible')
        .and('contain', 'Invitation sent successfully');
    });

    it('should change user role', () => {
      cy.get('[data-testid="users-table"] tbody tr')
        .contains('manager@example.com')
        .parent()
        .find('[data-testid="role-select"]')
        .select('admin');
      
      cy.get('[data-testid="save-role-btn"]').click();
      
      cy.get('[data-testid="role-updated"]')
        .should('be.visible')
        .and('contain', 'Role updated successfully');
    });

    it('should remove user from tenant', () => {
      cy.get('[data-testid="users-table"] tbody tr')
        .contains('user@example.com')
        .parent()
        .find('[data-testid="remove-user-btn"]')
        .click();
      
      cy.get('[data-testid="confirm-remove-user"]').click();
      
      cy.get('[data-testid="user-removed"]')
        .should('be.visible')
        .and('contain', 'User removed successfully');
    });

    it('should prevent removing last admin', () => {
      cy.get('[data-testid="users-table"] tbody tr')
        .contains('admin@pos.com')
        .parent()
        .find('[data-testid="remove-user-btn"]')
        .click();
      
      cy.get('[data-testid="cannot-remove-last-admin"]')
        .should('be.visible')
        .and('contain', 'Cannot remove the last admin');
    });
  });

  describe('Cross-Tenant Operations', () => {
    it('should prevent accessing other tenant URLs directly', () => {
      cy.login();
      
      // Try to access another tenant's direct URL
      cy.visit('/tenant/other-tenant/dashboard', { failOnStatusCode: false });
      
      cy.get('[data-testid="access-denied"]')
        .should('be.visible')
        .and('contain', 'Access denied');
    });

    it('should handle tenant not found errors', () => {
      cy.login();
      
      cy.window().then((win) => {
        win.localStorage.setItem('currentTenant', 'non-existent-tenant-id');
      });
      
      cy.reload();
      
      cy.get('[data-testid="tenant-not-found"]')
        .should('be.visible')
        .and('contain', 'Tenant not found');
    });

    it('should redirect to tenant selection if no current tenant', () => {
      cy.login();
      
      cy.window().then((win) => {
        win.localStorage.removeItem('currentTenant');
      });
      
      cy.visit('/dashboard');
      
      cy.url().should('include', '/select-tenant');
      cy.get('[data-testid="tenant-selection"]').should('be.visible');
    });
  });

  describe('Responsive Multi-Tenancy', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      cy.login();
      
      cy.get('[data-testid="mobile-tenant-menu"]').should('be.visible');
      cy.get('[data-testid="mobile-tenant-menu"]').click();
      
      cy.get('[data-testid="tenant-selector"]').should('be.visible');
    });

    it('should handle tenant switching on mobile', () => {
      cy.setMobileViewport();
      cy.login();
      
      cy.get('[data-testid="mobile-tenant-menu"]').click();
      cy.get('[data-testid="switch-tenant-btn"]').click();
      
      cy.get('[data-testid="tenant-list"]').should('be.visible');
    });
  });

  describe('Performance with Multiple Tenants', () => {
    it('should load tenant data efficiently', () => {
      cy.login();
      cy.measurePageLoad('Multi-tenant Dashboard');
      
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
      cy.measureLoadTime(3000);
    });

    it('should handle tenant switching quickly', () => {
      cy.login();
      
      const startTime = Date.now();
      cy.switchTenant('tenant-2');
      
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000); // Should switch within 2 seconds
      });
    });
  });
});