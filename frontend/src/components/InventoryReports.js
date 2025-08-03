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
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Inventory,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  InfoOutlined,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  Category,
  AttachMoney,
  LocalShipping,
  Schedule,
  Analytics,
  Download,
  Refresh,
  FilterList,
  Search
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { productsAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const InventoryReports = ({ tenantId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    overview: {},
    products: [],
    categories: [],
    lowStock: [],
    outOfStock: [],
    overstocked: [],
    movement: [],
    turnover: [],
    valuation: {},
    trends: []
  });

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  useEffect(() => {
    loadInventoryData();
  }, [tenantId, categoryFilter, stockStatus, sortBy]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-Tenant-ID': tenantId };
      
      // Load inventory analytics
      const response = await analyticsAPI.getInventoryAnalytics(headers);
      setReportData(response.data);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Failed to load inventory reports');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'overstocked': return 'info';
      default: return 'default';
    }
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return <CheckCircle />;
      case 'low_stock': return <Warning />;
      case 'out_of_stock': return <Error />;
      case 'overstocked': return <InfoOutlined />;
      default: return <Inventory />;
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // Overview Tab
  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Inventory Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Products
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {reportData.overview.totalProducts?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active items
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                <Inventory />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  ${reportData.valuation.totalValue?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inventory worth
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main', width: 60, height: 60 }}>
                <AttachMoney />
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
                  Low Stock Items
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {reportData.overview.lowStockCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need attention
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main', width: 60, height: 60 }}>
                <Warning />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Out of Stock
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="error.main">
                  {reportData.overview.outOfStockCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Urgent restock
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'error.main', width: 60, height: 60 }}>
                <Error />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Stock Level Distribution */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stock Level Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData.products}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis yAxisId="left" stroke={theme.palette.text.secondary} />
                <YAxis yAxisId="right" orientation="right" stroke={theme.palette.text.secondary} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="currentStock"
                  fill={theme.palette.primary.main}
                  name="Current Stock"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="minStock"
                  stroke={theme.palette.warning.main}
                  strokeWidth={2}
                  name="Min Stock Level"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="maxStock"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  name="Max Stock Level"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Category Distribution */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={reportData.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.categories?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Inventory Turnover */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Turnover Rate
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.turnover}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="turnoverRate"
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

  // Stock Alerts Tab
  const StockAlertsTab = () => (
    <Grid container spacing={3}>
      {/* Low Stock Alert */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Warning color="warning" sx={{ mr: { xs: 0.5, sm: 1 } }} />
              <Typography 
                variant="h6"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Low Stock Items
              </Typography>
            </Box>
            <List sx={{ px: { xs: 0, sm: 1 } }}>
              {reportData.lowStock?.slice(0, 5).map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.warning.main, 
                          width: { xs: 28, sm: 32 }, 
                          height: { xs: 28, sm: 32 },
                          fontSize: { xs: '0.75rem', sm: '1rem' }
                        }}
                      >
                        {item.name?.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontWeight: 'medium'
                          }}
                        >
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Current: {item.currentStock} | Min: {item.minStock}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(item.currentStock / item.minStock) * 100}
                            color="warning"
                            sx={{ mt: 1, height: { xs: 4, sm: 6 } }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < reportData.lowStock?.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button 
              fullWidth 
              variant="outlined" 
              color="warning" 
              sx={{ 
                mt: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                View All Low Stock
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                View All
              </Box>
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Out of Stock Alert */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Error color="error" sx={{ mr: { xs: 0.5, sm: 1 } }} />
              <Typography 
                variant="h6"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Out of Stock
              </Typography>
            </Box>
            <List sx={{ px: { xs: 0, sm: 1 } }}>
              {reportData.outOfStock?.slice(0, 5).map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.error.main, 
                          width: { xs: 28, sm: 32 }, 
                          height: { xs: 28, sm: 32 },
                          fontSize: { xs: '0.75rem', sm: '1rem' }
                        }}
                      >
                        {item.name?.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontWeight: 'medium'
                          }}
                        >
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="error"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Stock: 0 | Last sold: {item.lastSold}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                          >
                            Revenue lost: ${item.lostRevenue?.toFixed(2)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < reportData.outOfStock?.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button 
              fullWidth 
              variant="outlined" 
              color="error" 
              sx={{ 
                mt: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                View All Out of Stock
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                View All
              </Box>
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Overstocked Items */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <InfoOutlined color="info" sx={{ mr: { xs: 0.5, sm: 1 } }} />
              <Typography 
                variant="h6"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Overstocked Items
              </Typography>
            </Box>
            <List sx={{ px: { xs: 0, sm: 1 } }}>
              {reportData.overstocked?.slice(0, 5).map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.info.main, 
                          width: { xs: 28, sm: 32 }, 
                          height: { xs: 28, sm: 32 },
                          fontSize: { xs: '0.75rem', sm: '1rem' }
                        }}
                      >
                        {item.name?.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontWeight: 'medium'
                          }}
                        >
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Current: {item.currentStock} | Max: {item.maxStock}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                          >
                            Excess value: ${item.excessValue?.toFixed(2)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < reportData.overstocked?.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button 
              fullWidth 
              variant="outlined" 
              color="info" 
              sx={{ 
                mt: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                View All Overstocked
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                View All
              </Box>
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Alert Summary Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stock Status Summary
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
                { name: 'In Stock', value: reportData.overview.inStockCount, fill: theme.palette.success.main },
                { name: 'Low Stock', value: reportData.overview.lowStockCount, fill: theme.palette.warning.main },
                { name: 'Out of Stock', value: reportData.overview.outOfStockCount, fill: theme.palette.error.main },
                { name: 'Overstocked', value: reportData.overview.overstockedCount, fill: theme.palette.info.main }
              ]}>
                <RadialBar dataKey="value" cornerRadius={10} />
                <Legend />
                <RechartsTooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Performance Analytics Tab
  const PerformanceTab = () => (
    <Grid container spacing={3}>
      {/* Top Performing Products */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Best Performing Products
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsBarChart data={reportData.products?.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="turnoverRate" fill={theme.palette.success.main} radius={[0, 4, 4, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Slow Moving Products */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Slow Moving Products
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsBarChart data={reportData.products?.slice(-10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="turnoverRate" fill={theme.palette.error.main} radius={[0, 4, 4, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Inventory Movement Trends */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Movement Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={reportData.movement}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="stockIn"
                  stroke={theme.palette.success.main}
                  strokeWidth={3}
                  name="Stock In"
                />
                <Line
                  type="monotone"
                  dataKey="stockOut"
                  stroke={theme.palette.error.main}
                  strokeWidth={3}
                  name="Stock Out"
                />
                <Line
                  type="monotone"
                  dataKey="netMovement"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  name="Net Movement"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Detailed Performance Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Product Performance Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="right">Turnover Rate</TableCell>
                    <TableCell align="right">Days on Hand</TableCell>
                    <TableCell align="right">Stock Value</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.products?.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: colors[index % colors.length] }}>
                            {product.name?.charAt(0)}
                          </Avatar>
                          {product.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{product.currentStock}</TableCell>
                      <TableCell align="right">{product.turnoverRate?.toFixed(2)}x</TableCell>
                      <TableCell align="right">{product.daysOnHand}</TableCell>
                      <TableCell align="right">${product.stockValue?.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStockStatusIcon(product.status)}
                          label={product.status?.replace('_', ' ').toUpperCase()}
                          color={getStockStatusColor(product.status)}
                          size="small"
                        />
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
            Inventory Reports & Analytics
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Monitor stock levels, track performance, and optimize inventory management
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
            startIcon={<Download />}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Export Report
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Export
            </Box>
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadInventoryData}
            size={{ xs: 'small', sm: 'medium' }}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 }
            }}
          >
            Refresh
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="electronics">Electronics</MenuItem>
                  <MenuItem value="clothing">Clothing</MenuItem>
                  <MenuItem value="books">Books</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  label="Stock Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="in_stock">In Stock</MenuItem>
                  <MenuItem value="low_stock">Low Stock</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="stock">Stock Level</MenuItem>
                  <MenuItem value="value">Value</MenuItem>
                  <MenuItem value="turnover">Turnover Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Advanced Filters
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Filters
                </Box>
              </Button>
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
              label={{ xs: 'Alerts', sm: 'Stock Alerts' }} 
              icon={<Warning />} 
              iconPosition={{ xs: 'top', sm: 'start' }}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minHeight: { xs: 64, sm: 48 }
              }}
            />
            <Tab 
              label={{ xs: 'Performance', sm: 'Performance' }} 
              icon={<Timeline />} 
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
          <StockAlertsTab />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PerformanceTab />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default InventoryReports;