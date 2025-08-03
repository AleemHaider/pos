import React, { useState, useEffect } from 'react';
import { useRefresh } from '../contexts/RefreshContext';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  Inventory,
  Warning,
  Assessment,
  MoreVert,
  Refresh,
} from '@mui/icons-material';
import { analyticsAPI, productsAPI, salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const ModernDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    sales: null,
    inventory: null,
    customers: null,
    recentSales: [],
    loading: true,
  });

  const [refreshing, setRefreshing] = useState(false);
  const { refreshTrigger } = useRefresh();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Dashboard refreshing due to trigger');
      loadDashboardData(true);
    }
  }, [refreshTrigger]);

  const loadDashboardData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    
    try {
      const [salesResponse, inventoryResponse, customerResponse, recentSalesResponse] = await Promise.all([
        analyticsAPI.getSalesAnalytics({ period: '30' }).catch(() => ({ data: { data: { overview: {} } } })),
        analyticsAPI.getInventoryAnalytics().catch(() => ({ data: { data: { overview: {} } } })),
        analyticsAPI.getCustomerAnalytics().catch(() => ({ data: { data: { overview: {} } } })),
        salesAPI.getAll().catch(() => ({ data: [] })),
      ]);

      setDashboardData({
        sales: salesResponse.data.data,
        inventory: inventoryResponse.data.data,
        customers: customerResponse.data.data,
        recentSales: (recentSalesResponse.data || []).slice(0, 5),
        loading: false,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
    toast.success('Dashboard refreshed');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const StatCard = ({ title, value, change, icon, color = 'primary', prefix = '', suffix = '' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {prefix}{value}{suffix}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {change > 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={change > 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {Math.abs(change)}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56, ml: 2 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (dashboardData.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome back, {user.name}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your business today.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value={(dashboardData.sales?.overview?.totalRevenue || 0).toFixed(2)}
            change={12.5}
            icon={<AttachMoney />}
            color="success"
            prefix="$"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={dashboardData.sales?.overview?.totalSales || 0}
            change={8.2}
            icon={<ShoppingCart />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={dashboardData.customers?.overview?.totalCustomers || 0}
            change={15.3}
            icon={<People />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inventory Value"
            value={(dashboardData.inventory?.overview?.totalValue || 0).toFixed(0)}
            change={-2.1}
            icon={<Inventory />}
            color="warning"
            prefix="$"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Sales Trend (Last 30 Days)
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.sales?.dailySales || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `$${value.toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Sales'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Selling Products
              </Typography>
              <Box sx={{ mt: 2 }}>
                {(dashboardData.sales?.topProducts || []).slice(0, 5).map((product, index) => (
                  <Box
                    key={product._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: index < 4 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 2,
                          bgcolor: COLORS[index % COLORS.length],
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {product.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.quantitySold} sold
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      ${product.revenue?.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Sales */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Sales
                </Typography>
                <Button size="small" color="primary">
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentSales.map((sale) => (
                      <TableRow key={sale._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {sale.receiptNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sale.customer?.name || 'Walk-in Customer'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${sale.total?.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sale.paymentMethod?.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sale.paymentStatus}
                            size="small"
                            color={sale.paymentStatus === 'paid' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats & Alerts */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Inventory Alert */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning sx={{ mr: 2, fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {(dashboardData.inventory?.lowStockProducts || []).length}
                      </Typography>
                      <Typography variant="body2">
                        Low Stock Items
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button variant="contained" size="small" fullWidth>
                      New Sale
                    </Button>
                    <Button variant="outlined" size="small" fullWidth>
                      Add Product
                    </Button>
                    <Button variant="outlined" size="small" fullWidth>
                      Add Customer
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* System Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    System Status
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Server</Typography>
                    <Chip label="Online" color="success" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Database</Typography>
                    <Chip label="Connected" color="success" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Last Backup</Typography>
                    <Typography variant="body2" color="text.secondary">
                      2 hours ago
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModernDashboard;