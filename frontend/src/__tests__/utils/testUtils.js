import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Create a default theme for testing
const theme = createTheme();

// Custom render function that includes providers
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    theme: customTheme = theme,
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }) {
    return (
      <ThemeProvider theme={customTheme}>
        <CssBaseline />
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data generators
export const mockUser = {
  _id: '123456789',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  tenants: [
    {
      tenant: '987654321',
      role: 'admin'
    }
  ]
};

export const mockTenant = {
  _id: '987654321',
  name: 'Test Store',
  slug: 'test-store',
  settings: {
    currency: 'USD',
    timezone: 'UTC',
    language: 'en'
  },
  subscription: {
    plan: 'premium',
    status: 'active'
  }
};

export const mockProduct = {
  _id: '123',
  name: 'Test Product',
  description: 'A test product',
  sku: 'TEST-001',
  category: {
    _id: 'cat1',
    name: 'Test Category'
  },
  price: 29.99,
  costPrice: 15.00,
  stock: 100,
  minStock: 10,
  maxStock: 500,
  unit: 'piece',
  tenant: '987654321'
};

export const mockCustomer = {
  _id: '456',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+1234567890',
  address: '123 Test St',
  tenant: '987654321'
};

export const mockSale = {
  _id: '789',
  items: [
    {
      product: mockProduct,
      quantity: 2,
      price: 29.99,
      total: 59.98
    }
  ],
  customer: mockCustomer,
  total: 59.98,
  paymentMethod: 'cash',
  status: 'completed',
  tenant: '987654321',
  createdAt: new Date().toISOString()
};

export const mockDashboardStats = {
  totalSales: 150,
  totalRevenue: 4500.00,
  totalCustomers: 75,
  totalProducts: 200,
  todaySales: 12,
  todayRevenue: 360.00,
  averageOrderValue: 30.00,
  topSellingProducts: [
    { name: 'Product A', sales: 25 },
    { name: 'Product B', sales: 20 },
    { name: 'Product C', sales: 15 }
  ]
};

export const mockAnalyticsData = {
  salesTrend: [
    { date: '2024-01-01', revenue: 1200 },
    { date: '2024-01-02', revenue: 1400 },
    { date: '2024-01-03', revenue: 1100 }
  ],
  paymentMethods: [
    { name: 'Cash', value: 45 },
    { name: 'Card', value: 35 },
    { name: 'Mobile', value: 20 }
  ],
  topProducts: [
    { name: 'Product A', sales: 25, revenue: 750 },
    { name: 'Product B', sales: 20, revenue: 600 }
  ]
};

// API Response Helpers
export const createSuccessResponse = (data) => ({
  data,
  status: 200,
  statusText: 'OK'
});

export const createErrorResponse = (message = 'Error', status = 400) => ({
  response: {
    data: { message },
    status,
    statusText: status === 400 ? 'Bad Request' : 'Internal Server Error'
  }
});

// Common test helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

// Form testing helpers
export const fillForm = async (user, fields) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

// Chart testing helpers
export const getChartData = (chartTestId) => {
  const chart = document.querySelector(`[data-testid="${chartTestId}"]`);
  return chart ? chart.getAttribute('data-chart-data') : null;
};

// Responsive testing helpers
export const setMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  });
  window.dispatchEvent(new Event('resize'));
};

export const setTabletViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  window.dispatchEvent(new Event('resize'));
};

export const setDesktopViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
  });
  window.dispatchEvent(new Event('resize'));
};

// Default export for convenience
export * from '@testing-library/react';
export { renderWithProviders as render };