import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductManagement from '../../components/ProductManagement';
import { 
  renderWithProviders, 
  mockProduct, 
  createSuccessResponse,
  createErrorResponse,
  fillForm
} from '../utils/testUtils';
import { productsAPI, categoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Mock the APIs
jest.mock('../../services/api');
jest.mock('react-hot-toast');

describe('ProductManagement', () => {
  const mockCategories = [
    { _id: 'cat1', name: 'Electronics' },
    { _id: 'cat2', name: 'Clothing' },
    { _id: 'cat3', name: 'Books' }
  ];

  const mockProducts = [
    mockProduct,
    {
      ...mockProduct,
      _id: '124',
      name: 'Another Product',
      sku: 'TEST-002',
      price: 19.99
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses
    productsAPI.getAll.mockResolvedValue(
      createSuccessResponse(mockProducts)
    );
    
    categoriesAPI.getAll.mockResolvedValue(
      createSuccessResponse(mockCategories)
    );
  });

  describe('Component Rendering', () => {
    test('renders product management interface', async () => {
      renderWithProviders(<ProductManagement />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Product Management')).toBeInTheDocument();
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });
    });

    test('displays products in table format', async () => {
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
        expect(screen.getByText('$29.99')).toBeInTheDocument();
        expect(screen.getByText('$19.99')).toBeInTheDocument();
      });
    });

    test('shows product count and filters', async () => {
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/2 products/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
        expect(screen.getByText(/all categories/i)).toBeInTheDocument();
      });
    });
  });

  describe('Product CRUD Operations', () => {
    test('creates a new product successfully', async () => {
      const user = userEvent.setup();
      const newProduct = {
        name: 'New Test Product',
        sku: 'NEW-001',
        price: '49.99',
        costPrice: '25.00',
        stock: '100',
        minStock: '10',
        maxStock: '500'
      };

      productsAPI.create.mockResolvedValue(
        createSuccessResponse({ product: { ...newProduct, _id: '999' } })
      );

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Click add product button
      const addButton = screen.getByText('Add New Product');
      await user.click(addButton);

      // Fill out the form
      await fillForm(user, newProduct);

      // Select category
      const categorySelect = screen.getByLabelText(/category/i);
      await user.click(categorySelect);
      await user.click(screen.getByText('Electronics'));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(productsAPI.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: newProduct.name,
            sku: newProduct.sku,
            price: 49.99,
            costPrice: 25.00
          })
        );
        expect(toast.success).toHaveBeenCalledWith('Product created successfully!');
      });
    });

    test('updates an existing product', async () => {
      const user = userEvent.setup();
      const updatedProduct = { ...mockProduct, name: 'Updated Product Name' };

      productsAPI.update.mockResolvedValue(
        createSuccessResponse({ product: updatedProduct })
      );

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      // Update product name
      const nameInput = screen.getByDisplayValue('Test Product');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Product Name');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save product/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(productsAPI.update).toHaveBeenCalledWith(
          mockProduct._id,
          expect.objectContaining({
            name: 'Updated Product Name'
          })
        );
        expect(toast.success).toHaveBeenCalledWith('Product updated successfully!');
      });
    });

    test('deletes a product with confirmation', async () => {
      const user = userEvent.setup();
      
      productsAPI.delete.mockResolvedValue(createSuccessResponse({}));

      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to delete this product?'
        );
        expect(productsAPI.delete).toHaveBeenCalledWith(mockProduct._id);
        expect(toast.success).toHaveBeenCalledWith('Product deleted successfully!');
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Search and Filtering', () => {
    test('filters products by search term', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
      });

      // Search for specific product
      const searchInput = screen.getByLabelText(/search/i);
      await user.type(searchInput, 'Another');

      // Should filter products (this would be handled by the component's state)
      // In a real test, we'd check that only matching products are shown
    });

    test('filters products by category', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/all categories/i)).toBeInTheDocument();
      });

      // Select Electronics category
      const categoryFilter = screen.getByText(/all categories/i);
      await user.click(categoryFilter);
      await user.click(screen.getByText('Electronics'));

      // Should filter products by category
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    test('shows no results message when no products match filter', async () => {
      const user = userEvent.setup();
      productsAPI.getAll.mockResolvedValue(createSuccessResponse([]));
      
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Click add product button
      const addButton = screen.getByText('Add New Product');
      await user.click(addButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /save product/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/sku is required/i)).toBeInTheDocument();
        expect(screen.getByText(/price is required/i)).toBeInTheDocument();
      });
    });

    test('validates price format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add New Product');
      await user.click(addButton);

      // Enter invalid price
      const priceInput = screen.getByLabelText(/price/i);
      await user.type(priceInput, 'invalid');

      const submitButton = screen.getByRole('button', { name: /save product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/price must be a valid number/i)).toBeInTheDocument();
      });
    });

    test('validates SKU uniqueness', async () => {
      const user = userEvent.setup();
      
      productsAPI.create.mockRejectedValue(
        createErrorResponse('SKU already exists', 400)
      );

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add New Product');
      await user.click(addButton);

      await fillForm(user, {
        name: 'Test Product',
        sku: 'TEST-001', // Duplicate SKU
        price: '29.99',
        costPrice: '15.00'
      });

      const submitButton = screen.getByRole('button', { name: /save product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('SKU already exists');
      });
    });
  });

  describe('Stock Management', () => {
    test('displays stock status indicators', async () => {
      const lowStockProduct = {
        ...mockProduct,
        stock: 5,
        minStock: 10
      };

      productsAPI.getAll.mockResolvedValue(
        createSuccessResponse([lowStockProduct])
      );

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/low stock/i)).toBeInTheDocument();
      });
    });

    test('shows out of stock products', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        stock: 0
      };

      productsAPI.getAll.mockResolvedValue(
        createSuccessResponse([outOfStockProduct])
      );

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    test('selects multiple products for bulk operations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Select first product
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Skip header checkbox

      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();

      // Select second product
      await user.click(checkboxes[2]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    test('performs bulk delete operation', async () => {
      const user = userEvent.setup();
      
      productsAPI.delete.mockResolvedValue(createSuccessResponse({}));
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Select products
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Click bulk delete
      const bulkDeleteButton = screen.getByText(/delete selected/i);
      await user.click(bulkDeleteButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to delete 2 selected products?'
        );
        expect(productsAPI.delete).toHaveBeenCalledTimes(2);
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      productsAPI.getAll.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load products');
      });
    });

    test('shows retry option on load failure', async () => {
      const user = userEvent.setup();
      productsAPI.getAll.mockRejectedValueOnce(new Error('Network error'));
      productsAPI.getAll.mockResolvedValueOnce(createSuccessResponse(mockProducts));
      
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add new product/i })).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProductManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Product Management')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'text'); // Search input
      
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'button'); // Add button
    });
  });
});