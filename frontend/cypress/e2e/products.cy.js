describe('Product Management', () => {
  beforeEach(() => {
    cy.login();
    cy.navigateToProducts();
  });

  describe('Product List', () => {
    it('should display products table', () => {
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.get('[data-testid="products-header"]').should('contain', 'Products');
      cy.get('[data-testid="add-product-btn"]').should('be.visible');
    });

    it('should load and display products', () => {
      cy.wait('@getProducts');
      
      cy.get('[data-testid="products-table"] tbody tr').should('have.length.at.least', 1);
      cy.get('[data-testid="products-table"]').should('contain', 'Test Product');
    });

    it('should search products by name', () => {
      cy.searchProducts('Test');
      
      cy.get('[data-testid="products-table"] tbody tr').should('have.length.at.least', 1);
      cy.get('[data-testid="products-table"]').should('contain', 'Test');
    });

    it('should filter products by category', () => {
      cy.filterByCategory('Electronics');
      
      cy.get('[data-testid="products-table"] tbody tr').should('exist');
      cy.get('[data-testid="category-filter"]').should('contain', 'Electronics');
    });

    it('should show product details in table', () => {
      cy.get('[data-testid="products-table"] tbody tr').first().within(() => {
        cy.get('td').should('contain', 'Test Product');
        cy.get('td').should('contain', '$');
        cy.get('[data-testid="edit-product-btn"]').should('be.visible');
        cy.get('[data-testid="delete-product-btn"]').should('be.visible');
      });
    });

    it('should handle empty product list', () => {
      cy.intercept('GET', '/api/products', { body: { data: [] } }).as('getEmptyProducts');
      cy.reload();
      cy.wait('@getEmptyProducts');
      
      cy.get('[data-testid="no-products-message"]')
        .should('be.visible')
        .and('contain', 'No products found');
    });

    it('should paginate products when there are many', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/products*', { 
        fixture: 'largeProductList.json' 
      }).as('getLargeProductList');
      
      cy.reload();
      cy.wait('@getLargeProductList');
      
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="next-page-btn"]').should('be.visible');
    });
  });

  describe('Product Creation', () => {
    beforeEach(() => {
      cy.get('[data-testid="add-product-btn"]').click();
      cy.get('[data-testid="product-form"]').should('be.visible');
    });

    it('should display product creation form', () => {
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="sku"]').should('be.visible');
      cy.get('input[name="price"]').should('be.visible');
      cy.get('input[name="stock"]').should('be.visible');
      cy.get('[data-testid="category-select"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should create a new product successfully', () => {
      const productData = {
        name: 'New Test Product',
        sku: `TEST-${Date.now()}`,
        price: '39.99',
        costPrice: '20.00',
        stock: '150',
        minStock: '15',
        maxStock: '500'
      };

      cy.createProduct(productData);
      
      cy.get('[data-testid="success-toast"]')
        .should('be.visible')
        .and('contain', 'Product created successfully');
      
      // Should return to products list
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.get('[data-testid="products-table"]').should('contain', productData.name);
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();
      
      cy.get('input[name="name"]:invalid').should('exist');
      cy.get('input[name="sku"]:invalid').should('exist');
      cy.get('input[name="price"]:invalid').should('exist');
    });

    it('should validate SKU uniqueness', () => {
      cy.get('input[name="name"]').type('Duplicate SKU Product');
      cy.get('input[name="sku"]').type('TEST-001'); // Existing SKU
      cy.get('input[name="price"]').type('29.99');
      cy.get('input[name="stock"]').type('100');
      
      cy.get('[data-testid="category-select"]').click();
      cy.get('[data-testid="category-option-Electronics"]').click();
      
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="error-toast"]')
        .should('be.visible')
        .and('contain', 'SKU already exists');
    });

    it('should validate price is positive', () => {
      cy.get('input[name="name"]').type('Negative Price Product');
      cy.get('input[name="sku"]').type('NEG-001');
      cy.get('input[name="price"]').type('-10.00');
      cy.get('input[name="stock"]').type('100');
      
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Price must be positive');
    });

    it('should handle form cancellation', () => {
      cy.get('[data-testid="cancel-btn"]').click();
      
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.get('[data-testid="product-form"]').should('not.exist');
    });

    it('should auto-generate SKU if not provided', () => {
      cy.get('input[name="name"]').type('Auto SKU Product');
      cy.get('input[name="price"]').type('19.99');
      cy.get('input[name="stock"]').type('50');
      
      // SKU should be auto-generated based on name
      cy.get('input[name="sku"]').should('have.value', 'AUTO-SKU-PRODUCT');
    });
  });

  describe('Product Editing', () => {
    it('should edit an existing product', () => {
      cy.editProduct('Test Product', {
        name: 'Updated Test Product',
        price: '49.99',
        stock: '200'
      });
      
      cy.get('[data-testid="success-toast"]')
        .should('be.visible')
        .and('contain', 'Product updated successfully');
      
      cy.get('[data-testid="products-table"]').should('contain', 'Updated Test Product');
    });

    it('should pre-populate form with existing data', () => {
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Test Product')
        .find('[data-testid="edit-product-btn"]')
        .click();
      
      cy.get('input[name="name"]').should('have.value', 'Test Product');
      cy.get('input[name="sku"]').should('not.be.empty');
      cy.get('input[name="price"]').should('not.be.empty');
    });

    it('should validate updates without changing SKU', () => {
      cy.editProduct('Test Product', {
        name: 'Same SKU Updated Product'
      });
      
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('should handle edit form cancellation', () => {
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Test Product')
        .find('[data-testid="edit-product-btn"]')
        .click();
      
      cy.get('[data-testid="cancel-btn"]').click();
      
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.get('[data-testid="product-form"]').should('not.exist');
    });
  });

  describe('Product Deletion', () => {
    it('should delete a product with confirmation', () => {
      // Create a product without sales for deletion
      cy.createProduct({
        name: 'Product to Delete',
        sku: `DELETE-${Date.now()}`
      });
      
      cy.deleteProduct('Product to Delete', true);
      
      cy.get('[data-testid="success-toast"]')
        .should('be.visible')
        .and('contain', 'Product deleted successfully');
      
      cy.get('[data-testid="products-table"]').should('not.contain', 'Product to Delete');
    });

    it('should cancel deletion when user chooses no', () => {
      cy.deleteProduct('Test Product', false);
      
      cy.get('[data-testid="products-table"]').should('contain', 'Test Product');
    });

    it('should prevent deletion of products with sales', () => {
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Test Product')
        .find('[data-testid="delete-product-btn"]')
        .click();
      
      cy.get('[data-testid="confirm-delete-btn"]').click();
      
      cy.get('[data-testid="error-toast"]')
        .should('be.visible')
        .and('contain', 'Cannot delete product with existing sales');
    });

    it('should show confirmation dialog with product details', () => {
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Test Product')
        .find('[data-testid="delete-product-btn"]')
        .click();
      
      cy.get('[data-testid="confirm-dialog"]')
        .should('be.visible')
        .and('contain', 'Test Product')
        .and('contain', 'Are you sure');
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      // Create additional products for bulk operations
      cy.createProduct({ name: 'Bulk Product 1', sku: 'BULK-001' });
      cy.createProduct({ name: 'Bulk Product 2', sku: 'BULK-002' });
    });

    it('should select multiple products', () => {
      cy.get('[data-testid="select-all-checkbox"]').check();
      
      cy.get('[data-testid="products-table"] tbody tr input[type="checkbox"]')
        .should('be.checked');
      
      cy.get('[data-testid="bulk-actions"]').should('be.visible');
    });

    it('should bulk delete selected products', () => {
      cy.get('[data-testid="products-table"] tbody tr')
        .contains('Bulk Product 1')
        .find('input[type="checkbox"]')
        .check();
      
      cy.get('[data-testid="products-table"] tbody tr')
        .contains('Bulk Product 2')
        .find('input[type="checkbox"]')
        .check();
      
      cy.get('[data-testid="bulk-delete-btn"]').click();
      cy.get('[data-testid="confirm-bulk-delete-btn"]').click();
      
      cy.get('[data-testid="success-toast"]')
        .should('be.visible')
        .and('contain', 'Products deleted successfully');
    });

    it('should export selected products', () => {
      cy.get('[data-testid="select-all-checkbox"]').check();
      cy.get('[data-testid="export-btn"]').click();
      
      // Check that download was triggered
      cy.readFile('cypress/downloads/products.csv').should('exist');
    });
  });

  describe('Stock Management', () => {
    it('should display low stock warning', () => {
      // Create low stock product
      cy.createProduct({
        name: 'Low Stock Product',
        sku: 'LOW-001',
        stock: '5',
        minStock: '10'
      });
      
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Low Stock Product')
        .should('have.class', 'low-stock-row');
      
      cy.get('[data-testid="low-stock-indicator"]').should('be.visible');
    });

    it('should show out of stock products', () => {
      cy.createProduct({
        name: 'Out of Stock Product',
        sku: 'OUT-001',
        stock: '0'
      });
      
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Out of Stock Product')
        .should('have.class', 'out-of-stock-row');
    });

    it('should update stock levels', () => {
      cy.get('[data-testid="products-table"]')
        .contains('tr', 'Test Product')
        .find('[data-testid="quick-stock-btn"]')
        .click();
      
      cy.get('[data-testid="stock-input"]').clear().type('500');
      cy.get('[data-testid="update-stock-btn"]').click();
      
      cy.get('[data-testid="success-toast"]')
        .should('be.visible')
        .and('contain', 'Stock updated successfully');
    });
  });

  describe('Responsive Product Management', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.get('[data-testid="add-product-btn"]').should('be.visible');
      
      // Should show mobile-optimized table
      cy.get('[data-testid="mobile-product-card"]').should('exist');
    });

    it('should work on tablet devices', () => {
      cy.setTabletViewport();
      
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.createProduct({ name: 'Tablet Product', sku: 'TAB-001' });
      
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });
  });

  describe('Product Categories', () => {
    it('should create products with categories', () => {
      cy.get('[data-testid="add-product-btn"]').click();
      
      cy.get('input[name="name"]').type('Categorized Product');
      cy.get('input[name="sku"]').type('CAT-001');
      cy.get('input[name="price"]').type('25.99');
      cy.get('input[name="stock"]').type('75');
      
      cy.get('[data-testid="category-select"]').click();
      cy.get('[data-testid="category-option-Electronics"]').click();
      
      cy.get('button[type="submit"]').click();
      
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('should filter by multiple categories', () => {
      cy.get('[data-testid="category-filter"]').click();
      cy.get('[data-testid="category-Electronics"]').click();
      cy.get('[data-testid="category-Books"]').click();
      
      cy.get('[data-testid="products-table"] tbody tr').should('exist');
    });
  });

  describe('Performance', () => {
    it('should load products quickly', () => {
      cy.measurePageLoad('Products Page');
      
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.wait('@getProducts').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
    });

    it('should handle large product lists efficiently', () => {
      cy.intercept('GET', '/api/products*', { 
        fixture: 'largeProductList.json' 
      }).as('getLargeList');
      
      cy.reload();
      cy.wait('@getLargeList');
      
      cy.get('[data-testid="products-table"]').should('be.visible');
      cy.measureLoadTime(3000); // Should load within 3 seconds
    });
  });
});