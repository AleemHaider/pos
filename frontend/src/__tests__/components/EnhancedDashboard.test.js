import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedDashboard from '../../components/EnhancedDashboard';
import { 
  renderWithProviders, 
  mockUser, 
  mockDashboardStats,
  mockAnalyticsData,
  createSuccessResponse,
  setMobileViewport,
  setDesktopViewport
} from '../utils/testUtils';
import { dashboardAPI, analyticsAPI, salesAPI } from '../../services/api';

// Mock the APIs
jest.mock('../../services/api');

describe('EnhancedDashboard', () => {
  const defaultProps = {
    currentUser: mockUser,
    tenantId: '987654321'
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default API responses
    dashboardAPI.getStats.mockResolvedValue(
      createSuccessResponse({ stats: mockDashboardStats })
    );
    
    analyticsAPI.getSalesAnalytics.mockResolvedValue(
      createSuccessResponse({ analytics: mockAnalyticsData })
    );
    
    salesAPI.getAll.mockResolvedValue(
      createSuccessResponse({ sales: [] })
    );
  });

  describe('Component Rendering', () => {
    test('renders dashboard with loading state initially', () => {
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders dashboard header correctly', async () => {
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
        expect(screen.getByText(/Welcome back, Test User/)).toBeInTheDocument();
      });
    });

    test('displays KPI cards with correct data', async () => {
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$4,500')).toBeInTheDocument();
        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('Customers')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
        expect(screen.getByText('$30.00')).toBeInTheDocument();
      });
    });

    test('displays charts', async () => {
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile viewport', async () => {
      setMobileViewport();
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Check if mobile-specific styles are applied
        const header = screen.getByText('Dashboard Overview');
        expect(header).toBeVisible();
      });
    });

    test('shows desktop layout on large screens', async () => {
      setDesktopViewport();
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Test User/)).toBeVisible();
      });
    });
  });

  describe('User Interactions', () => {
    test('refreshes data when refresh button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should call APIs again
      expect(dashboardAPI.getStats).toHaveBeenCalledTimes(2);
    });

    test('changes time range when filter is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      // Click on 30 Days button
      const thirtyDaysButton = screen.getByRole('button', { name: '30 Days' });
      await user.click(thirtyDaysButton);

      // Should call analytics API with new period
      expect(analyticsAPI.getSalesAnalytics).toHaveBeenCalledWith(
        { period: '30d' },
        { 'X-Tenant-ID': '987654321' }
      );
    });

    test('opens menu when more options button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      expect(screen.getByText('Export Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });
  });

  describe('Data Loading and Error Handling', () => {
    test('handles API errors gracefully', async () => {
      dashboardAPI.getStats.mockRejectedValue(new Error('API Error'));
      
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render the component structure
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });

    test('displays fallback values when data is missing', async () => {
      dashboardAPI.getStats.mockResolvedValue(
        createSuccessResponse({ stats: {} })
      );
      
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('$0')).toBeInTheDocument(); // Fallback revenue
        expect(screen.getByText('0')).toBeInTheDocument(); // Fallback sales
      });
    });

    test('auto-refreshes data every 5 minutes', async () => {
      jest.useFakeTimers();
      
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(dashboardAPI.getStats).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(300000);
      
      await waitFor(() => {
        expect(dashboardAPI.getStats).toHaveBeenCalledTimes(2);
      });
      
      jest.useRealTimers();
    });
  });

  describe('Performance Metrics', () => {
    test('displays performance gauges correctly', async () => {
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
        expect(screen.getByText('Growth Rate')).toBeInTheDocument();
        expect(screen.getByText('Conversion')).toBeInTheDocument();
        expect(screen.getByText('Retention')).toBeInTheDocument();
        expect(screen.getByText('Inventory Turn')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activities', () => {
    test('displays recent sales when available', async () => {
      const mockSales = [
        {
          _id: '123456',
          total: 29.99,
          items: [{ quantity: 1 }],
          paymentMethod: 'cash',
          createdAt: new Date().toISOString()
        }
      ];
      
      salesAPI.getAll.mockResolvedValue(
        createSuccessResponse({ sales: mockSales })
      );
      
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Sales')).toBeInTheDocument();
        expect(screen.getByText('Sale #123456')).toBeInTheDocument();
        expect(screen.getByText('$29.99')).toBeInTheDocument();
      });
    });

    test('shows empty state when no recent sales', async () => {
      salesAPI.getAll.mockResolvedValue(
        createSuccessResponse({ sales: [] })
      );
      
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Sales')).toBeInTheDocument();
        // Should render the section even if empty
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
        
        const moreButton = screen.getByLabelText(/more options/i);
        expect(moreButton).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EnhancedDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'button');
    });
  });
});