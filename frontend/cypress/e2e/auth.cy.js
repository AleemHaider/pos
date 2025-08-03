describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Login', () => {
    it('should display login form', () => {
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should login with valid credentials', () => {
      cy.get('input[name="email"]').type('admin@pos.com');
      cy.get('input[name="password"]').type('123456');
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
      
      // Should store token in localStorage
      cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
      
      // Should remain on login page
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();

      cy.get('input[name="email"]:invalid').should('exist');
      cy.get('input[name="password"]:invalid').should('exist');
    });

    it('should validate email format', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.get('input[name="email"]:invalid').should('exist');
    });

    it('should handle server errors gracefully', () => {
      // Intercept login request to simulate server error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('loginError');

      cy.get('input[name="email"]').type('admin@pos.com');
      cy.get('input[name="password"]').type('123456');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginError');
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'server error');
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('[data-testid="register-link"]').click();
      cy.url().should('include', '/register');
    });

    it('should display registration form', () => {
      cy.get('[data-testid="register-form"]').should('be.visible');
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should register new user successfully', () => {
      const userData = {
        name: 'New User',
        email: `newuser${Date.now()}@example.com`,
        password: 'password123',
        confirmPassword: 'password123'
      };

      cy.get('input[name="name"]').type(userData.name);
      cy.get('input[name="email"]').type(userData.email);
      cy.get('input[name="password"]').type(userData.password);
      cy.get('input[name="confirmPassword"]').type(userData.confirmPassword);
      
      cy.get('button[type="submit"]').click();

      // Should redirect to onboarding or dashboard
      cy.url().should('not.include', '/register');
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Registration successful');
    });

    it('should validate password confirmation', () => {
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('differentpassword');
      
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Passwords do not match');
    });

    it('should validate email uniqueness', () => {
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('admin@pos.com'); // Existing email
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Email already exists');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.login(); // Use custom command
      cy.visit('/dashboard');
    });

    it('should logout successfully', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-btn"]').click();

      // Should redirect to login page
      cy.url().should('include', '/login');
      
      // Should clear localStorage
      cy.window().its('localStorage').invoke('getItem', 'token').should('not.exist');
      cy.window().its('localStorage').invoke('getItem', 'user').should('not.exist');
    });

    it('should redirect to login if accessing protected route after logout', () => {
      cy.logout();
      cy.visit('/dashboard');

      cy.url().should('include', '/login');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.login();
      cy.visit('/dashboard');
      
      cy.reload();
      
      // Should still be logged in
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
    });

    it('should handle expired tokens', () => {
      cy.login();
      
      // Set expired token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired.token.here');
      });
      
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated users from protected routes', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
      
      cy.visit('/products');
      cy.url().should('include', '/login');
      
      cy.visit('/sales');
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('[data-testid="forgot-password-link"]').click();
    });

    it('should display forgot password form', () => {
      cy.get('[data-testid="forgot-password-form"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should send password reset email', () => {
      cy.get('input[name="email"]').type('admin@pos.com');
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Password reset email sent');
    });

    it('should validate email for password reset', () => {
      cy.get('input[name="email"]').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Email not found');
    });
  });

  describe('Responsive Authentication', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('input[name="email"]').type('admin@pos.com');
      cy.get('input[name="password"]').type('123456');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
    });

    it('should work on tablet devices', () => {
      cy.setTabletViewport();
      
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.login();
      cy.visit('/dashboard');
      
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
    });
  });
});