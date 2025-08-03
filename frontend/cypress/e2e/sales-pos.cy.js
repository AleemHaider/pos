describe('Sales and POS Terminal', () => {
  beforeEach(() => {
    cy.login();
    cy.navigateToSales();
  });

  describe('POS Terminal Interface', () => {
    it('should display POS terminal components', () => {
      cy.get('[data-testid="pos-terminal"]').should('be.visible');
      cy.get('[data-testid="product-search"]').should('be.visible');
      cy.get('[data-testid="cart-section"]').should('be.visible');
      cy.get('[data-testid="payment-section"]').should('be.visible');
      cy.get('[data-testid="customer-section"]').should('be.visible');
    });

    it('should search for products in POS', () => {
      cy.get('[data-testid="product-search"]').type('Test Product');
      
      cy.get('[data-testid="product-search-results"]').should('be.visible');
      cy.get('[data-testid="product-Test Product"]').should('be.visible');
    });

    it('should display product grid', () => {
      cy.get('[data-testid="product-grid"]').should('be.visible');
      cy.get('[data-testid="product-card"]').should('have.length.at.least', 1);
      
      cy.get('[data-testid="product-card"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-price"]').should('be.visible');
        cy.get('[data-testid="product-stock"]').should('be.visible');
      });
    });

    it('should filter products by category in POS', () => {
      cy.get('[data-testid="category-tabs"]').should('be.visible');
      cy.get('[data-testid="category-Electronics"]').click();
      
      cy.get('[data-testid="product-grid"]').should('be.visible');
      cy.get('[data-testid="product-card"]').should('exist');
    });
  });

  describe('Cart Management', () => {
    it('should add product to cart', () => {
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      cy.get('[data-testid="cart-items"]').should('contain', 'Test Product');
      cy.get('[data-testid="cart-total"]').should('not.contain', '$0.00');
    });

    it('should update quantity in cart', () => {
      // Add product to cart first
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      // Update quantity
      cy.get('[data-testid="cart-items"]')
        .contains('Test Product')
        .find('[data-testid="quantity-input"]')
        .clear()
        .type('3');
      
      cy.get('[data-testid="quantity-update-btn"]').click();
      
      // Check updated total
      cy.get('[data-testid="cart-total"]').should('contain', '$');
      cy.get('[data-testid="item-quantity"]').should('contain', '3');
    });

    it('should remove item from cart', () => {
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      cy.get('[data-testid="cart-items"]')
        .contains('Test Product')
        .find('[data-testid="remove-item-btn"]')
        .click();
      
      cy.get('[data-testid="cart-items"]').should('not.contain', 'Test Product');
      cy.get('[data-testid="cart-total"]').should('contain', '$0.00');
    });

    it('should clear entire cart', () => {
      // Add products to cart
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      cy.get('[data-testid="clear-cart-btn"]').click();
      cy.get('[data-testid="confirm-clear-cart"]').click();
      
      cy.get('[data-testid="empty-cart-message"]')
        .should('be.visible')
        .and('contain', 'Cart is empty');
    });

    it('should apply discount to cart', () => {
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      cy.get('[data-testid="discount-btn"]').click();
      cy.get('[data-testid="discount-input"]').type('10');
      cy.get('[data-testid="discount-type-percent"]').click();
      cy.get('[data-testid="apply-discount-btn"]').click();
      
      cy.get('[data-testid="discount-applied"]')
        .should('be.visible')
        .and('contain', '10%');
    });

    it('should calculate tax correctly', () => {
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      cy.get('[data-testid="tax-section"]').should('be.visible');
      cy.get('[data-testid="tax-amount"]').should('contain', '$');
      cy.get('[data-testid="total-with-tax"]').should('be.visible');
    });
  });

  describe('Customer Management in POS', () => {
    it('should select existing customer', () => {
      cy.get('[data-testid="customer-section"]').should('be.visible');
      cy.get('[data-testid="customer-search"]').click();
      cy.get('[data-testid="customer-search"]').type('Test Customer');
      
      cy.get('[data-testid="customer-Test Customer"]').click();
      
      cy.get('[data-testid="selected-customer"]')
        .should('be.visible')
        .and('contain', 'Test Customer');
    });

    it('should create new customer during sale', () => {
      cy.get('[data-testid="add-new-customer-btn"]').click();
      
      cy.get('[data-testid="quick-customer-form"]').should('be.visible');
      cy.get('input[name="name"]').type('Walk-in Customer');
      cy.get('input[name="phone"]').type('+1234567890');
      cy.get('[data-testid="save-customer-btn"]').click();
      
      cy.get('[data-testid="selected-customer"]')
        .should('contain', 'Walk-in Customer');
    });

    it('should handle walk-in customers', () => {
      cy.get('[data-testid="walk-in-customer-btn"]').click();
      
      cy.get('[data-testid="selected-customer"]')
        .should('contain', 'Walk-in Customer');
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      // Add product to cart for payment tests
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
    });

    it('should process cash payment', () => {
      cy.get('[data-testid="payment-cash"]').click();
      cy.get('[data-testid="cash-received-input"]').type('50.00');
      
      cy.get('[data-testid="complete-sale-btn"]').click();
      
      cy.get('[data-testid="sale-complete-modal"]').should('be.visible');
      cy.get('[data-testid="change-amount"]').should('be.visible');
    });

    it('should process card payment', () => {
      cy.get('[data-testid="payment-card"]').click();
      cy.get('[data-testid="card-details-form"]').should('be.visible');
      
      cy.get('input[name="cardNumber"]').type('4111111111111111');
      cy.get('input[name="expiryDate"]').type('12/25');
      cy.get('input[name="cvv"]').type('123');
      
      cy.get('[data-testid="process-card-payment"]').click();
      
      cy.get('[data-testid="payment-processing"]').should('be.visible');
      cy.get('[data-testid="sale-complete-modal"]').should('be.visible');
    });

    it('should split payment between cash and card', () => {
      cy.get('[data-testid="split-payment-btn"]').click();
      
      cy.get('[data-testid="cash-amount-input"]').type('20.00');
      cy.get('[data-testid="card-amount-input"]').type('10.00');
      
      cy.get('[data-testid="process-split-payment"]').click();
      
      cy.get('[data-testid="sale-complete-modal"]').should('be.visible');
    });

    it('should validate payment amount', () => {
      cy.get('[data-testid="payment-cash"]').click();
      cy.get('[data-testid="cash-received-input"]').type('5.00'); // Less than total
      
      cy.get('[data-testid="complete-sale-btn"]').click();
      
      cy.get('[data-testid="payment-error"]')
        .should('be.visible')
        .and('contain', 'Insufficient payment amount');
    });

    it('should handle payment failures', () => {
      cy.intercept('POST', '/api/sales', {
        statusCode: 400,
        body: { message: 'Payment failed' }
      }).as('paymentFailure');

      cy.get('[data-testid="payment-cash"]').click();
      cy.get('[data-testid="cash-received-input"]').type('50.00');
      cy.get('[data-testid="complete-sale-btn"]').click();

      cy.wait('@paymentFailure');
      cy.get('[data-testid="payment-error"]')
        .should('be.visible')
        .and('contain', 'Payment failed');
    });
  });

  describe('Sale Completion', () => {
    beforeEach(() => {
      // Setup complete sale
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      cy.get('[data-testid="payment-cash"]').click();
      cy.get('[data-testid="cash-received-input"]').type('50.00');
    });

    it('should complete sale successfully', () => {
      cy.createSale(); // Use custom command
      
      cy.get('[data-testid="sale-complete-modal"]').should('be.visible');
      cy.get('[data-testid="sale-receipt"]').should('be.visible');
      cy.get('[data-testid="sale-id"]').should('be.visible');
    });

    it('should print receipt', () => {
      cy.createSale();
      
      cy.get('[data-testid="print-receipt-btn"]').click();
      
      // Verify print dialog or print job
      cy.window().its('print').should('have.been.called');
    });

    it('should email receipt to customer', () => {
      // Select customer with email first
      cy.get('[data-testid="customer-search"]').click();
      cy.get('[data-testid="customer-search"]').type('Test Customer');
      cy.get('[data-testid="customer-Test Customer"]').click();
      
      cy.createSale();
      
      cy.get('[data-testid="email-receipt-btn"]').click();
      
      cy.get('[data-testid="email-sent-confirmation"]')
        .should('be.visible')
        .and('contain', 'Receipt emailed successfully');
    });

    it('should start new sale after completion', () => {
      cy.createSale();
      
      cy.get('[data-testid="new-sale-btn"]').click();
      
      cy.get('[data-testid="empty-cart-message"]').should('be.visible');
      cy.get('[data-testid="cart-total"]').should('contain', '$0.00');
    });

    it('should save sale to history', () => {
      cy.createSale();
      
      cy.get('[data-testid="view-sales-history-btn"]').click();
      
      cy.url().should('include', '/sales/history');
      cy.get('[data-testid="sales-table"]').should('contain', 'Test Product');
    });
  });

  describe('Sales History', () => {
    beforeEach(() => {
      cy.visit('/sales/history');
    });

    it('should display sales history', () => {
      cy.get('[data-testid="sales-table"]').should('be.visible');
      cy.get('[data-testid="sales-header"]').should('contain', 'Sales History');
    });

    it('should filter sales by date range', () => {
      cy.get('[data-testid="date-range-picker"]').click();
      cy.get('[data-testid="start-date"]').type('2024-01-01');
      cy.get('[data-testid="end-date"]').type('2024-12-31');
      cy.get('[data-testid="apply-filter-btn"]').click();
      
      cy.get('[data-testid="sales-table"] tbody tr').should('exist');
    });

    it('should search sales by customer', () => {
      cy.get('[data-testid="customer-filter"]').type('Test Customer');
      
      cy.get('[data-testid="sales-table"]')
        .should('contain', 'Test Customer');
    });

    it('should view sale details', () => {
      cy.get('[data-testid="sales-table"] tbody tr')
        .first()
        .find('[data-testid="view-sale-btn"]')
        .click();
      
      cy.get('[data-testid="sale-details-modal"]').should('be.visible');
      cy.get('[data-testid="sale-items"]').should('be.visible');
      cy.get('[data-testid="payment-details"]').should('be.visible');
    });

    it('should refund sale', () => {
      cy.get('[data-testid="sales-table"] tbody tr')
        .first()
        .find('[data-testid="refund-sale-btn"]')
        .click();
      
      cy.get('[data-testid="refund-modal"]').should('be.visible');
      cy.get('[data-testid="refund-reason"]').type('Customer requested');
      cy.get('[data-testid="process-refund-btn"]').click();
      
      cy.get('[data-testid="refund-success"]')
        .should('be.visible')
        .and('contain', 'Refund processed successfully');
    });
  });

  describe('Responsive POS', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-testid="pos-terminal"]').should('be.visible');
      cy.get('[data-testid="mobile-pos-layout"]').should('exist');
      
      // Test mobile-specific interactions
      cy.get('[data-testid="product-search"]').type('Test Product');
      cy.get('[data-testid="product-Test Product"]').click();
      
      cy.get('[data-testid="cart-items"]').should('contain', 'Test Product');
    });

    it('should work on tablet devices', () => {
      cy.setTabletViewport();
      
      cy.get('[data-testid="pos-terminal"]').should('be.visible');
      cy.createSale();
      
      cy.get('[data-testid="sale-complete-modal"]').should('be.visible');
    });
  });

  describe('Barcode Scanning', () => {
    it('should scan product barcode', () => {
      cy.get('[data-testid="barcode-scanner-btn"]').click();
      
      // Simulate barcode scan
      cy.get('[data-testid="barcode-input"]').type('1234567890123');
      cy.get('[data-testid="barcode-input"]').type('{enter}');
      
      cy.get('[data-testid="cart-items"]').should('contain', 'Test Product');
    });

    it('should handle invalid barcodes', () => {
      cy.get('[data-testid="barcode-scanner-btn"]').click();
      cy.get('[data-testid="barcode-input"]').type('0000000000000');
      cy.get('[data-testid="barcode-input"]').type('{enter}');
      
      cy.get('[data-testid="barcode-error"]')
        .should('be.visible')
        .and('contain', 'Product not found');
    });
  });

  describe('Inventory Updates', () => {
    it('should update product stock after sale', () => {
      // Check initial stock
      cy.navigateToProducts();
      cy.get('[data-testid="products-table"]')
        .contains('Test Product')
        .parent()
        .find('[data-testid="stock-count"]')
        .invoke('text')
        .as('initialStock');
      
      // Make a sale
      cy.navigateToSales();
      cy.createSale();
      
      // Check updated stock
      cy.navigateToProducts();
      cy.get('@initialStock').then((initialStock) => {
        const initial = parseInt(initialStock);
        cy.get('[data-testid="products-table"]')
          .contains('Test Product')
          .parent()
          .find('[data-testid="stock-count"]')
          .should('contain', (initial - 1).toString());
      });
    });

    it('should prevent overselling', () => {
      // Create product with limited stock
      cy.navigateToProducts();
      cy.createProduct({
        name: 'Limited Stock Product',
        sku: 'LIMITED-001',
        stock: '1'
      });
      
      cy.navigateToSales();
      cy.get('[data-testid="product-search"]').type('Limited Stock Product');
      cy.get('[data-testid="product-Limited Stock Product"]').click();
      
      // Try to add more than available
      cy.get('[data-testid="cart-items"]')
        .contains('Limited Stock Product')
        .find('[data-testid="quantity-input"]')
        .clear()
        .type('5');
      
      cy.get('[data-testid="quantity-update-btn"]').click();
      
      cy.get('[data-testid="stock-error"]')
        .should('be.visible')
        .and('contain', 'Insufficient stock');
    });
  });

  describe('Performance', () => {
    it('should load POS terminal quickly', () => {
      cy.measurePageLoad('POS Terminal');
      
      cy.get('[data-testid="pos-terminal"]').should('be.visible');
      cy.measureLoadTime(2000); // Should load within 2 seconds
    });

    it('should handle rapid product additions', () => {
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="product-search"]').clear().type('Test Product');
        cy.get('[data-testid="product-Test Product"]').click();
      }
      
      cy.get('[data-testid="item-quantity"]').should('contain', '10');
    });
  });
});