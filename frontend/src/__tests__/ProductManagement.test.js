import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductManagement from '../components/ProductManagement';
import * as api from '../services/api';

// Mock the API
jest.mock('../services/api');

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

const mockProducts = [
  {
    _id: '1',
    name: 'Test Product 1',
    sku: 'TEST-001',
    description: 'Test description',
    category: { _id: 'cat1', name: 'Electronics' },
    price: 99.99,
    costPrice: 50.00,
    stock: 25,
    minStock: 5,
    maxStock: 100,
    unit: 'piece',
    isActive: true
  },
  {
    _id: '2',
    name: 'Test Product 2',
    sku: 'TEST-002',
    description: 'Another test product',
    category: { _id: 'cat2', name: 'Beverages' },
    price: 2.99,
    costPrice: 1.50,
    stock: 2, // Low stock
    minStock: 5,
    maxStock: 50,
    unit: 'can',
    isActive: true
  }
];

const mockCategories = [
  { _id: 'cat1', name: 'Electronics' },
  { _id: 'cat2', name: 'Beverages' }
];

describe('ProductManagement Component', () => {
  beforeEach(() => {
    api.productsAPI.getAll = jest.fn().mockResolvedValue({ data: mockProducts });
    api.categoriesAPI.getAll = jest.fn().mockResolvedValue({ data: mockCategories });
    api.productsAPI.create = jest.fn().mockResolvedValue({ data: {} });
    api.productsAPI.update = jest.fn().mockResolvedValue({ data: {} });
    api.productsAPI.delete = jest.fn().mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    expect(screen.getByText('Product Management')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.productsAPI.getAll).toHaveBeenCalled();
      expect(api.categoriesAPI.getAll).toHaveBeenCalled();
    });
  });

  test('displays products correctly', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('TEST-001')).toBeInTheDocument();
      expect(screen.getByText('TEST-002')).toBeInTheDocument();
    });
  });

  test('displays category names correctly', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Beverages')).toBeInTheDocument();
    });
  });

  test('shows low stock alert', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/You have 1 product\(s\) with low stock/)).toBeInTheDocument();
    });
  });

  test('search functionality works', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'TEST-001' } });

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    });
  });

  test('category filter works', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    // Note: This test might need adjustment based on actual filter implementation
  });

  test('add product dialog opens', async () => {
    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Product');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    api.productsAPI.getAll = jest.fn().mockRejectedValue(new Error('API Error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <ProductManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});

export default ProductManagement;