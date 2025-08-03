describe('Dashboard Analytics', () => {
  beforeEach(() => {
    cy.login();
    cy.navigateToDashboard();
  });

  describe('Dashboard Overview', () => {
    it('should display main dashboard components', () => {
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
      cy.get('[data-testid="dashboard-header"]').should('contain', 'Dashboard');
      cy.checkDashboardKPIs();
    });

    it('should load dashboard data', () => {
      cy.wait('@getDashboardStats');
      
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should display KPI cards with data', () => {
      cy.get('[data-testid="total-revenue"]').within(() => {
        cy.get('[data-testid="kpi-value"]').should('not.be.empty');
        cy.get('[data-testid="kpi-label"]').should('contain', 'Total Revenue');
        cy.get('[data-testid="kpi-change"]').should('be.visible');
      });

      cy.get('[data-testid="total-sales"]').within(() => {
        cy.get('[data-testid="kpi-value"]').should('not.be.empty');
        cy.get('[data-testid="kpi-label"]').should('contain', 'Total Sales');
      });

      cy.get('[data-testid="total-customers"]').within(() => {
        cy.get('[data-testid="kpi-value"]').should('not.be.empty');
        cy.get('[data-testid="kpi-label"]').should('contain', 'Customers');
      });

      cy.get('[data-testid="avg-order-value"]').within(() => {
        cy.get('[data-testid="kpi-value"]').should('not.be.empty');
        cy.get('[data-testid="kpi-label"]').should('contain', 'Average Order');
      });
    });

    it('should show percentage changes in KPIs', () => {
      cy.get('[data-testid="kpi-change"]').each(($change) => {
        cy.wrap($change).should('contain.oneOf', ['%', 'increase', 'decrease']);
      });
    });

    it('should handle empty dashboard data', () => {
      cy.intercept('GET', '/api/dashboard/stats', {
        body: {
          data: {
            revenue: 0,
            sales: 0,
            customers: 0,
            averageOrder: 0
          }
        }
      }).as('getEmptyStats');

      cy.reload();
      cy.wait('@getEmptyStats');

      cy.get('[data-testid="total-revenue"] [data-testid="kpi-value"]')
        .should('contain', '$0');
    });
  });

  describe('Time Range Selection', () => {
    it('should change data based on time range', () => {
      cy.changeDashboardTimeRange('7days');
      
      cy.wait('@getDashboardStats');
      cy.get('[data-testid="time-range-selector"]').should('contain', '7 days');
    });

    it('should support multiple time ranges', () => {
      const timeRanges = ['today', '7days', '30days', '90days', '1year'];
      
      timeRanges.forEach(range => {
        cy.changeDashboardTimeRange(range);
        cy.get('[data-testid="dashboard-loading"]').should('not.exist');
        cy.checkDashboardKPIs();
      });
    });

    it('should remember selected time range', () => {
      cy.changeDashboardTimeRange('30days');
      cy.reload();
      
      cy.get('[data-testid="time-range-selector"]').should('contain', '30 days');
    });

    it('should handle custom date range', () => {
      cy.get('[data-testid="time-range-selector"]').click();
      cy.get('[data-testid="custom-range"]').click();
      
      cy.get('[data-testid="start-date-picker"]').type('2024-01-01');
      cy.get('[data-testid="end-date-picker"]').type('2024-01-31');
      cy.get('[data-testid="apply-custom-range"]').click();
      
      cy.wait('@getDashboardStats');
      cy.get('[data-testid="time-range-selector"]').should('contain', 'Custom');
    });
  });

  describe('Sales Charts', () => {
    it('should display sales over time chart', () => {
      cy.get('[data-testid="sales-chart"]').should('be.visible');
      cy.get('[data-testid="sales-chart"] .recharts-wrapper').should('exist');
    });

    it('should display revenue trend chart', () => {
      cy.get('[data-testid="revenue-chart"]').should('be.visible');
      cy.get('[data-testid="revenue-chart"] .recharts-line').should('exist');
    });

    it('should show chart tooltips on hover', () => {
      cy.get('[data-testid="sales-chart"] .recharts-bar').first().trigger('mouseover');
      cy.get('.recharts-tooltip').should('be.visible');
    });

    it('should allow chart type switching', () => {
      cy.get('[data-testid="chart-type-selector"]').click();
      cy.get('[data-testid="chart-type-line"]').click();
      
      cy.get('[data-testid="sales-chart"] .recharts-line').should('exist');
    });

    it('should handle chart data loading states', () => {
      cy.intercept('GET', '/api/analytics/sales', {
        delay: 2000,
        body: { data: [] }
      }).as('getSlowAnalytics');

      cy.reload();
      cy.get('[data-testid="chart-loading"]').should('be.visible');
      
      cy.wait('@getSlowAnalytics');
      cy.get('[data-testid="chart-loading"]').should('not.exist');
    });

    it('should export chart data', () => {
      cy.get('[data-testid="export-chart-btn"]').click();
      cy.get('[data-testid="export-format-csv"]').click();
      
      cy.readFile('cypress/downloads/sales-chart.csv').should('exist');
    });
  });

  describe('Product Performance', () => {
    it('should display top selling products', () => {
      cy.get('[data-testid="top-products"]').should('be.visible');
      cy.get('[data-testid="product-performance-list"]').should('exist');
    });

    it('should show product performance metrics', () => {
      cy.get('[data-testid="product-performance-list"] li').first().within(() => {
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-sales"]').should('be.visible');
        cy.get('[data-testid="product-revenue"]').should('be.visible');
      });
    });

    it('should link to product details', () => {
      cy.get('[data-testid="product-performance-list"] li')
        .first()
        .find('[data-testid="product-link"]')
        .click();
      
      cy.url().should('include', '/products');
    });

    it('should display low stock alerts', () => {
      cy.get('[data-testid="low-stock-alerts"]').should('be.visible');
      cy.get('[data-testid="low-stock-count"]').should('be.visible');
    });

    it('should show inventory warnings', () => {
      cy.get('[data-testid="inventory-warnings"]').within(() => {
        cy.get('[data-testid="out-of-stock-count"]').should('be.visible');
        cy.get('[data-testid="low-stock-count"]').should('be.visible');
        cy.get('[data-testid="overstock-count"]').should('be.visible');
      });
    });
  });

  describe('Customer Analytics', () => {
    it('should display customer growth chart', () => {
      cy.get('[data-testid="customer-growth-chart"]').should('be.visible');
      cy.get('[data-testid="customer-growth-chart"] .recharts-area').should('exist');
    });

    it('should show new vs returning customers', () => {
      cy.get('[data-testid="customer-segments"]').should('be.visible');
      cy.get('[data-testid="new-customers"]').should('be.visible');
      cy.get('[data-testid="returning-customers"]').should('be.visible');
    });

    it('should display customer lifetime value', () => {
      cy.get('[data-testid="customer-ltv"]').should('be.visible');
      cy.get('[data-testid="avg-ltv"]').should('contain', '$');
    });

    it('should show top customers', () => {
      cy.get('[data-testid="top-customers"]').should('be.visible');
      cy.get('[data-testid="customer-list"] li').should('have.length.at.least', 1);
    });
  });

  describe('Recent Activity', () => {
    it('should display recent sales', () => {
      cy.get('[data-testid="recent-sales"]').should('be.visible');
      cy.get('[data-testid="recent-sales-list"]').should('exist');
    });

    it('should show activity timestamps', () => {
      cy.get('[data-testid="recent-sales-list"] li').first().within(() => {
        cy.get('[data-testid="sale-timestamp"]').should('be.visible');
        cy.get('[data-testid="sale-amount"]').should('contain', '$');
      });
    });

    it('should link to sale details', () => {
      cy.get('[data-testid="recent-sales-list"] li')
        .first()
        .find('[data-testid="view-sale-link"]')
        .click();
      
      cy.url().should('include', '/sales');
    });

    it('should display recent product additions', () => {
      cy.get('[data-testid="recent-products"]').should('be.visible');
      cy.get('[data-testid="recent-products-list"]').should('exist');
    });

    it('should show system notifications', () => {
      cy.get('[data-testid="notifications"]').should('be.visible');
      cy.get('[data-testid="notification-count"]').should('be.visible');
    });
  });

  describe('Dashboard Customization', () => {
    it('should allow widget rearrangement', () => {
      cy.get('[data-testid="customize-dashboard-btn"]').click();
      cy.get('[data-testid="edit-mode"]').should('be.visible');
      
      // Drag and drop widgets (simplified)
      cy.get('[data-testid="sales-chart-widget"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 200 })
        .trigger('mouseup');
      
      cy.get('[data-testid="save-layout-btn"]').click();
      cy.get('[data-testid="layout-saved"]').should('be.visible');
    });

    it('should hide/show widgets', () => {
      cy.get('[data-testid="customize-dashboard-btn"]').click();
      
      cy.get('[data-testid="widget-customer-growth"]')
        .find('[data-testid="hide-widget-btn"]')
        .click();
      
      cy.get('[data-testid="save-layout-btn"]').click();
      cy.get('[data-testid="customer-growth-chart"]').should('not.exist');
    });

    it('should reset dashboard to default', () => {
      cy.get('[data-testid="customize-dashboard-btn"]').click();
      cy.get('[data-testid="reset-layout-btn"]').click();
      cy.get('[data-testid="confirm-reset"]').click();
      
      cy.get('[data-testid="layout-reset"]').should('be.visible');
    });
  });

  describe('Real-time Updates', () => {
    it('should update dashboard when new sale is made', () => {
      // Get initial sales count
      cy.get('[data-testid="total-sales"] [data-testid="kpi-value"]')
        .invoke('text')
        .as('initialSales');
      
      // Make a new sale
      cy.navigateToSales();
      cy.createSale();
      
      // Return to dashboard and check update
      cy.navigateToDashboard();
      
      cy.get('@initialSales').then((initial) => {
        const initialCount = parseInt(initial);
        cy.get('[data-testid="total-sales"] [data-testid="kpi-value"]')
          .should('contain', (initialCount + 1).toString());
      });
    });

    it('should show live notifications', () => {
      // Simulate new notification
      cy.window().its('socket').invoke('emit', 'notification', {
        type: 'low_stock',
        message: 'Product running low on stock'
      });
      
      cy.get('[data-testid="live-notification"]')
        .should('be.visible')
        .and('contain', 'low on stock');
    });

    it('should auto-refresh data periodically', () => {
      cy.intercept('GET', '/api/dashboard/stats').as('getRefreshedStats');
      
      // Wait for auto-refresh (typically every 30 seconds)
      cy.wait('@getRefreshedStats', { timeout: 35000 });
      
      cy.get('[data-testid="last-updated"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/dashboard/stats', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getStatsError');

      cy.reload();
      cy.wait('@getStatsError');

      cy.get('[data-testid="dashboard-error"]')
        .should('be.visible')
        .and('contain', 'Unable to load dashboard data');
      
      cy.get('[data-testid="retry-btn"]').should('be.visible');
    });

    it('should retry failed requests', () => {
      cy.intercept('GET', '/api/dashboard/stats', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getStatsError');

      cy.reload();
      cy.wait('@getStatsError');

      // Mock successful retry
      cy.intercept('GET', '/api/dashboard/stats', { fixture: 'dashboardStats.json' }).as('getStatsSuccess');
      
      cy.get('[data-testid="retry-btn"]').click();
      cy.wait('@getStatsSuccess');
      
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should handle partial data loading', () => {
      cy.intercept('GET', '/api/dashboard/stats', {
        body: {
          data: {
            revenue: 1000,
            sales: null, // Missing data
            customers: 50,
            averageOrder: undefined
          }
        }
      }).as('getPartialStats');

      cy.reload();
      cy.wait('@getPartialStats');

      cy.get('[data-testid="total-revenue"]').should('contain', '$1,000');
      cy.get('[data-testid="total-sales"]').should('contain', 'N/A');
    });
  });

  describe('Responsive Dashboard', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
      cy.get('[data-testid="mobile-dashboard-layout"]').should('exist');
      
      // KPI cards should stack vertically
      cy.get('[data-testid="kpi-cards"]').should('have.class', 'mobile-layout');
      
      // Charts should be responsive
      cy.get('[data-testid="sales-chart"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.setTabletViewport();
      
      cy.checkDashboardKPIs();
      cy.get('[data-testid="sales-chart"]').should('be.visible');
      cy.get('[data-testid="customer-growth-chart"]').should('be.visible');
    });

    it('should hide less important elements on small screens', () => {
      cy.setMobileViewport();
      
      // Some widgets might be hidden on mobile
      cy.get('[data-testid="advanced-analytics"]').should('not.be.visible');
      cy.get('[data-testid="secondary-metrics"]').should('not.be.visible');
    });
  });

  describe('Performance', () => {
    it('should load dashboard quickly', () => {
      cy.measurePageLoad('Dashboard');
      
      cy.get('[data-testid="dashboard-page"]').should('be.visible');
      cy.measureLoadTime(3000); // Should load within 3 seconds
    });

    it('should handle large datasets efficiently', () => {
      cy.intercept('GET', '/api/dashboard/stats', { 
        fixture: 'largeDashboardStats.json' 
      }).as('getLargeStats');
      
      cy.reload();
      cy.wait('@getLargeStats');
      
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
      cy.measureLoadTime(5000);
    });

    it('should lazy load charts', () => {
      cy.get('[data-testid="sales-chart"]').should('be.visible');
      
      // Scroll to reveal lazy-loaded charts
      cy.scrollTo('bottom');
      cy.get('[data-testid="advanced-analytics-chart"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'time-range-selector');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'customize-dashboard-btn');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="sales-chart"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Sales chart');
      
      cy.get('[data-testid="total-revenue"]')
        .should('have.attr', 'role', 'region')
        .and('have.attr', 'aria-label', 'Total revenue metric');
    });

    it('should support screen readers', () => {
      cy.checkA11y('[data-testid="dashboard-page"]');
    });
  });
});