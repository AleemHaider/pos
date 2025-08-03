import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  useTheme,
  alpha,
  ButtonGroup,
  Menu,
  MenuItem,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  Inventory,
  Receipt,
  Store,
  LocalAtm,
  CreditCard,
  Smartphone,
  MoreVert,
  Refresh,
  DateRange,
  FilterList,
  Download,
  Visibility,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  AccountBalance,
  Warning,
  CheckCircle,
  Schedule,
  Star,
  WorkspacePremium
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { dashboardAPI, salesAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const EnhancedDashboard = ({ currentUser, tenantId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [menuAnchor, setMenuAnchor] = useState(null);
  
  // Dashboard data
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    todaySales: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    topSellingProducts: []
  });
  
  const [chartData, setChartData] = useState({
    salesTrend: [],
    paymentMethods: [],
    topProducts: [],
    customerSegments: [],
    hourlyTrends: []
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    growthRate: 0,
    conversionRate: 0,
    customerRetention: 0,
    inventoryTurnover: 0
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [timeRange, tenantId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-Tenant-ID': tenantId };
      
      // Load all dashboard data in parallel
      const [
        dashboardResponse,
        salesAnalyticsResponse,
        recentSalesResponse
      ] = await Promise.all([
        dashboardAPI.getStats(headers),
        analyticsAPI.getSalesAnalytics({ period: timeRange }, headers),
        salesAPI.getAll({ limit: 10, page: 1 }, headers)
      ]);

      setStats(dashboardResponse.data.stats);
      setChartData(salesAnalyticsResponse.data.analytics);
      setRecentActivities(recentSalesResponse.data.sales || []);
      
      // Calculate performance metrics
      calculatePerformanceMetrics(salesAnalyticsResponse.data.analytics);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = (analyticsData) => {
    // Mock calculations - replace with actual business logic
    setPerformanceMetrics({
      growthRate: 12.5,
      conversionRate: 3.2,
      customerRetention: 78.5,
      inventoryTurnover: 4.2
    });
  };

  const timeRangeOptions = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  // KPI Card Component
  const KPICard = ({ title, value, change, icon, color, subtitle, trend }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 60, height: 60 }}>
            {icon}
          </Avatar>
        </Box>
        
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {change > 0 ? (
              <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: theme.palette.error.main, mr: 0.5 }} />
            )}
            <Typography 
              variant="body2" 
              color={change > 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {Math.abs(change)}% vs last period
            </Typography>
          </Box>
        )}
        
        {trend && (
          <Box sx={{ mt: 2, height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Performance Gauge Component
  const PerformanceGauge = ({ title, value, max = 100, color, unit = '%' }) => (
    <Box sx={{ textAlign: 'center' }}>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}
      >
        {title}
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <ResponsiveContainer 
          width={{ xs: 80, sm: 100, md: 120 }} 
          height={{ xs: 80, sm: 100, md: 120 }}
        >
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="60%" 
            outerRadius="90%" 
            data={[{ value, max }]}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" fill={color} cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            color={color}
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}
          >
            {value}
          </Typography>
          <Typography 
            variant="caption"
            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
          >
            {unit}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            variant={{ xs: 'h5', sm: 'h4' }} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            Dashboard Overview
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Welcome back, {currentUser?.name}! Here's what's happening with your business.
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <ButtonGroup 
            variant="outlined" 
            size="small"
            sx={{ 
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              '& .MuiButton-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                minWidth: { xs: 'auto', sm: '64px' }
              }
            }}
          >
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'contained' : 'outlined'}
                onClick={() => setTimeRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
            <IconButton onClick={loadDashboardData} color="primary" size="small">
              <Refresh />
            </IconButton>
            
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={`$${stats.totalRevenue?.toLocaleString() || 0}`}
            change={15.3}
            icon={<AttachMoney />}
            color={theme.palette.success.main}
            subtitle={`$${stats.todayRevenue?.toFixed(2) || 0} today`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Sales"
            value={stats.totalSales?.toLocaleString() || 0}
            change={8.7}
            icon={<ShoppingCart />}
            color={theme.palette.primary.main}
            subtitle={`${stats.todaySales || 0} today`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Customers"
            value={stats.totalCustomers?.toLocaleString() || 0}
            change={12.1}
            icon={<People />}
            color={theme.palette.info.main}
            subtitle="Active customers"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Order Value"
            value={`$${stats.averageOrderValue?.toFixed(2) || 0}`}
            change={-2.4}
            icon={<Receipt />}
            color={theme.palette.warning.main}
            subtitle="Per transaction"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: { xs: 350, sm: 400 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 0 },
                mb: 2 
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Sales Trend
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<ShowChart />}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    View Details
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    Details
                  </Box>
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={{ xs: 250, sm: 300 }}>
                <AreaChart data={chartData.salesTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
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
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: { xs: 350, sm: 400 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Payment Methods
              </Typography>
              <ResponsiveContainer width="100%" height={{ xs: 200, sm: 250 }}>
                <RechartsPieChart>
                  <Pie
                    data={chartData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={{ xs: 30, sm: 40 }}
                    outerRadius={{ xs: 60, sm: 80 }}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.paymentMethods?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      fontSize: '12px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics & Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: { xs: 'auto', md: 350 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Performance Metrics
              </Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <PerformanceGauge
                    title="Growth Rate"
                    value={performanceMetrics.growthRate}
                    color={theme.palette.success.main}
                  />
                </Grid>
                <Grid item xs={6}>
                  <PerformanceGauge
                    title="Conversion"
                    value={performanceMetrics.conversionRate}
                    color={theme.palette.primary.main}
                  />
                </Grid>
                <Grid item xs={6}>
                  <PerformanceGauge
                    title="Retention"
                    value={performanceMetrics.customerRetention}
                    color={theme.palette.info.main}
                  />
                </Grid>
                <Grid item xs={6}>
                  <PerformanceGauge
                    title="Inventory Turn"
                    value={performanceMetrics.inventoryTurnover}
                    max={10}
                    color={theme.palette.warning.main}
                    unit="x"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: { xs: 'auto', md: 350 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 0 },
                mb: 2 
              }}>
                <Typography 
                  variant="h6"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Recent Sales
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<Visibility />}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    View All
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    All
                  </Box>
                </Button>
              </Box>
              <List sx={{ 
                maxHeight: { xs: 200, md: 250 }, 
                overflow: 'auto',
                px: { xs: 0, sm: 1 }
              }}>
                {recentActivities.slice(0, 6).map((activity, index) => (
                  <React.Fragment key={activity._id || index}>
                    <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 }
                          }}
                        >
                          <Receipt sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          >
                            Sale #{activity._id?.slice(-6) || 'N/A'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              ${activity.total?.toFixed(2) || '0.00'} • {activity.items?.length || 0} items
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                            >
                              {new Date(activity.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={activity.paymentMethod || 'N/A'}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 }
                        }}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products Bar Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 0 },
                mb: 2 
              }}>
                <Typography 
                  variant="h6"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Top Selling Products
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<BarChart />}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Full Report
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    Report
                  </Box>
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={{ xs: 250, sm: 300 }}>
                <RechartsBarChart data={chartData.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="name" 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    angle={{ xs: -45, sm: 0 }}
                    textAnchor={{ xs: 'end', sm: 'middle' }}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
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
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Download sx={{ mr: 1 }} />
          Export Dashboard
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Timeline sx={{ mr: 1 }} />
          Advanced Analytics
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <FilterList sx={{ mr: 1 }} />
          Customize View
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnhancedDashboard;