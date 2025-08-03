import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  Receipt,
  DateRange,
  Download,
  Print,
  Share,
  FilterList,
  Visibility,
  Schedule,
  Person,
  Store,
  CreditCard,
  LocalAtm,
  Smartphone,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  Compare,
  Analytics
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { salesAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const SalesReports = ({ tenantId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    overview: {},
    trends: [],
    products: [],
    categories: [],
    paymentMethods: [],
    hourlyData: [],
    salespeople: [],
    comparisons: []
  });

  // Filters
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [groupBy, setGroupBy] = useState('day');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

  // Dialog states
  const [exportDialog, setExportDialog] = useState(false);
  const [compareDialog, setCompareDialog] = useState(false);

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  useEffect(() => {
    loadReportData();
  }, [dateRange, startDate, endDate, groupBy, selectedCashier, selectedPaymentMethod, tenantId]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-Tenant-ID': tenantId };
      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        groupBy,
        cashier: selectedCashier !== 'all' ? selectedCashier : undefined,
        paymentMethod: selectedPaymentMethod !== 'all' ? selectedPaymentMethod : undefined
      };

      const response = await analyticsAPI.getSalesAnalytics(params, headers);
      setReportData(response.data);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    // Export functionality
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    setExportDialog(false);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // Overview Tab
  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  ${reportData.overview.totalRevenue?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +12.5% vs last period
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main', width: 60, height: 60 }}>
                <AttachMoney />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Sales
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {reportData.overview.totalSales?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.primary.main, mr: 0.5 }} />
                  <Typography variant="body2" color="primary.main">
                    +8.7% vs last period
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                <ShoppingCart />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Avg Order Value
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  ${reportData.overview.averageOrderValue?.toFixed(2) || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingDown sx={{ color: theme.palette.error.main, mr: 0.5 }} />
                  <Typography variant="body2" color="error.main">
                    -2.3% vs last period
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main', width: 60, height: 60 }}>
                <Receipt />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Items Sold
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="info.main">
                  {reportData.overview.totalItems?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.info.main, mr: 0.5 }} />
                  <Typography variant="body2" color="info.main">
                    +15.2% vs last period
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main', width: 60, height: 60 }}>
                <Store />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Sales Trend Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sales Trend
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                <YAxis yAxisId="left" stroke={theme.palette.text.secondary} />
                <YAxis yAxisId="right" orientation="right" stroke={theme.palette.text.secondary} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill={alpha(theme.palette.primary.main, 0.3)}
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="sales"
                  fill={theme.palette.secondary.main}
                  name="Sales Count"
                  opacity={0.8}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Methods */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={reportData.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.paymentMethods?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Hourly Sales Pattern */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Hourly Sales Pattern
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="hour" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={theme.palette.info.main}
                  fill={alpha(theme.palette.info.main, 0.3)}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Products Performance Tab
  const ProductsTab = () => (
    <Grid container spacing={3}>
      {/* Top Products Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Top Selling Products
            </Typography>
            <ResponsiveContainer width="100%" height={{ xs: 300, sm: 400 }}>
              <RechartsBarChart data={reportData.products} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  type="number" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={{ xs: 80, sm: 120, md: 150 }}
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  fill={theme.palette.primary.main} 
                  radius={[0, 4, 4, 0]} 
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Product Categories */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Sales by Category
            </Typography>
            <ResponsiveContainer width="100%" height={{ xs: 250, sm: 300 }}>
              <RechartsPieChart>
                <Pie
                  data={reportData.categories}
                  cx="50%"
                  cy="50%"
                  outerRadius={{ xs: 60, sm: 80 }}
                  dataKey="value"
                  label={{ fontSize: 12 }}
                >
                  {reportData.categories?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    fontSize: '12px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Product Performance Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Product Performance Details
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Product Name
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}
                    >
                      Units Sold
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Revenue
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      Avg Price
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Margin
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}
                    >
                      Trend
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.products?.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: { xs: 1, sm: 2 }, 
                              bgcolor: colors[index % colors.length],
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 },
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {product.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                fontWeight: 'medium'
                              }}
                            >
                              {product.name}
                            </Typography>
                            {/* Show units sold on mobile as secondary text */}
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ display: { xs: 'block', sm: 'none' } }}
                            >
                              {product.sales?.toLocaleString()} sold
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', sm: 'table-cell' }
                        }}
                      >
                        {product.sales?.toLocaleString()}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        <Box>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            ${product.revenue?.toLocaleString()}
                          </Typography>
                          {/* Show avg price on mobile as secondary text */}
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: { xs: 'block', md: 'none' } }}
                          >
                            Avg: ${product.avgPrice?.toFixed(2)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', md: 'table-cell' }
                        }}
                      >
                        ${product.avgPrice?.toFixed(2)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Chip
                            label={`${product.profitMargin}%`}
                            color={product.profitMargin > 20 ? 'success' : product.profitMargin > 10 ? 'warning' : 'error'}
                            size="small"
                            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                          />
                          {/* Show trend on mobile */}
                          <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                            {product.trend > 0 ? (
                              <TrendingUp color="success" sx={{ fontSize: 16 }} />
                            ) : (
                              <TrendingDown color="error" sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', sm: 'table-cell' }
                        }}
                      >
                        {product.trend > 0 ? (
                          <TrendingUp color="success" />
                        ) : (
                          <TrendingDown color="error" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Salespeople Performance Tab
  const SalespeopleTab = () => (
    <Grid container spacing={3}>
      {/* Performance Comparison */}
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Salesperson Performance
            </Typography>
            <ResponsiveContainer width="100%" height={{ xs: 300, sm: 400 }}>
              <RadarChart data={reportData.salespeople}>
                <PolarGrid stroke={alpha(theme.palette.divider, 0.3)} />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Sales"
                  dataKey="sales"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.3)}
                  strokeWidth={2}
                />
                <Radar
                  name="Revenue"
                  dataKey="revenue"
                  stroke={theme.palette.secondary.main}
                  fill={alpha(theme.palette.secondary.main, 0.3)}
                  strokeWidth={2}
                />
                <Legend 
                  wrapperStyle={{
                    fontSize: '12px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Salespeople Details Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Detailed Performance
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Salesperson
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}
                    >
                      Sales Count
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Revenue
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      Avg Sale
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      Commission
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Performance
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.salespeople?.map((person, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: { xs: 1, sm: 2 },
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 }
                            }}
                          >
                            <Person sx={{ fontSize: { xs: 18, sm: 24 } }} />
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                fontWeight: 'medium'
                              }}
                            >
                              {person.name}
                            </Typography>
                            {/* Show sales count on mobile as secondary text */}
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ display: { xs: 'block', sm: 'none' } }}
                            >
                              {person.sales} sales
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', sm: 'table-cell' }
                        }}
                      >
                        {person.sales}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        <Box>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            ${person.revenue?.toLocaleString()}
                          </Typography>
                          {/* Show avg sale and commission on mobile */}
                          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                            >
                              Avg: ${person.avgSale?.toFixed(2)}
                            </Typography>
                            <br />
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                            >
                              Comm: ${person.commission?.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', md: 'table-cell' }
                        }}
                      >
                        ${person.avgSale?.toFixed(2)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', md: 'table-cell' }
                        }}
                      >
                        ${person.commission?.toFixed(2)}
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={person.performance}
                            color={person.performance > 80 ? 'success' : person.performance > 60 ? 'warning' : 'error'}
                            sx={{ width: { xs: 60, sm: 100 }, mb: 0.5 }}
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                          >
                            {person.performance}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ 
          mb: { xs: 3, sm: 4 }, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              Sales Reports & Analytics
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Comprehensive insights into your sales performance
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 2 },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              variant="outlined"
              startIcon={<Compare />}
              onClick={() => setCompareDialog(true)}
              size={{ xs: 'small', sm: 'medium' }}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Compare Periods
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Compare
              </Box>
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => setExportDialog(true)}
              size={{ xs: 'small', sm: 'medium' }}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Analytics />}
              size={{ xs: 'small', sm: 'medium' }}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Advanced Analytics
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Analytics
              </Box>
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={{ xs: 2, sm: 2 }} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    label="Date Range"
                  >
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                    <MenuItem value="1y">Last Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {dateRange === 'custom' && (
                <>
                  <Grid item xs={12} sm={6} md={2}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Group By</InputLabel>
                  <Select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    label="Group By"
                  >
                    <MenuItem value="hour">Hour</MenuItem>
                    <MenuItem value="day">Day</MenuItem>
                    <MenuItem value="week">Week</MenuItem>
                    <MenuItem value="month">Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cashier</InputLabel>
                  <Select
                    value={selectedCashier}
                    onChange={(e) => setSelectedCashier(e.target.value)}
                    label="Cashier"
                  >
                    <MenuItem value="all">All Cashiers</MenuItem>
                    <MenuItem value="john">John Doe</MenuItem>
                    <MenuItem value="jane">Jane Smith</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="all">All Methods</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="mobile">Mobile</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Report Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={{ xs: 'fullWidth', sm: 'standard' }}
              scrollButtons={{ xs: 'auto', sm: false }}
              allowScrollButtonsMobile
            >
              <Tab 
                label={{ xs: 'Overview', sm: 'Overview' }} 
                icon={<ShowChart />} 
                iconPosition={{ xs: 'top', sm: 'start' }}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minHeight: { xs: 64, sm: 48 }
                }}
              />
              <Tab 
                label={{ xs: 'Products', sm: 'Products' }} 
                icon={<Store />} 
                iconPosition={{ xs: 'top', sm: 'start' }}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minHeight: { xs: 64, sm: 48 }
                }}
              />
              <Tab 
                label={{ xs: 'People', sm: 'Salespeople' }} 
                icon={<Person />} 
                iconPosition={{ xs: 'top', sm: 'start' }}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minHeight: { xs: 64, sm: 48 }
                }}
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <OverviewTab />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ProductsTab />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <SalespeopleTab />
          </TabPanel>
        </Card>

        {/* Export Dialog */}
        <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Choose export format:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExport('pdf')}
                  startIcon={<Download />}
                >
                  PDF
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExport('excel')}
                  startIcon={<Download />}
                >
                  Excel
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExport('csv')}
                  startIcon={<Download />}
                >
                  CSV
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExport('json')}
                  startIcon={<Download />}
                >
                  JSON
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesReports;