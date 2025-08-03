import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  alpha,
  CircularProgress,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
  Fade,
  Grow
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  Receipt,
  LocalAtm,
  CreditCard,
  Smartphone,
  Refresh,
  PlayArrow,
  Pause,
  Settings,
  Fullscreen,
  Notifications,
  Speed,
  FlashOn,
  Update,
  Visibility,
  Analytics,
  Timeline,
  PulseIcon,
  Circle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { salesAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const RealTimeAnalytics = ({ tenantId }) => {
  const theme = useTheme();
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef(null);
  
  // Real-time data state
  const [realtimeData, setRealtimeData] = useState({
    currentSales: 0,
    currentRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    topProducts: [],
    recentTransactions: [],
    hourlyTrend: [],
    paymentMethods: [],
    alerts: [],
    systemHealth: {
      api: 'healthy',
      database: 'healthy',
      payments: 'healthy'
    }
  });

  // Animation states
  const [animatedValues, setAnimatedValues] = useState({
    sales: 0,
    revenue: 0,
    users: 0
  });

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  useEffect(() => {
    loadInitialData();
    
    if (isLive) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => stopRealTimeUpdates();
  }, [isLive, tenantId]);

  // Animate value changes
  useEffect(() => {
    const animateValue = (start, end, duration, callback) => {
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const value = start + (end - start) * progress;
        callback(Math.round(value));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    animateValue(animatedValues.sales, realtimeData.currentSales, 1000, 
      (value) => setAnimatedValues(prev => ({ ...prev, sales: value })));
    
    animateValue(animatedValues.revenue, realtimeData.currentRevenue, 1000,
      (value) => setAnimatedValues(prev => ({ ...prev, revenue: value })));
    
    animateValue(animatedValues.users, realtimeData.activeUsers, 1000,
      (value) => setAnimatedValues(prev => ({ ...prev, users: value })));
  }, [realtimeData.currentSales, realtimeData.currentRevenue, realtimeData.activeUsers]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await fetchRealtimeData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load real-time data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    const headers = { 'X-Tenant-ID': tenantId };
    
    // Simulate real-time data updates
    const mockData = {
      currentSales: Math.floor(Math.random() * 100) + realtimeData.currentSales,
      currentRevenue: Math.floor(Math.random() * 5000) + realtimeData.currentRevenue,
      activeUsers: Math.floor(Math.random() * 50) + 120,
      pendingOrders: Math.floor(Math.random() * 20) + 5,
      conversionRate: (Math.random() * 2 + 3).toFixed(1),
      avgOrderValue: (Math.random() * 50 + 85).toFixed(2),
      topProducts: [
        { name: 'Product A', sales: Math.floor(Math.random() * 50) + 20 },
        { name: 'Product B', sales: Math.floor(Math.random() * 40) + 15 },
        { name: 'Product C', sales: Math.floor(Math.random() * 30) + 10 }
      ],
      recentTransactions: generateMockTransactions(),
      hourlyTrend: generateHourlyTrend(),
      paymentMethods: [
        { name: 'Card', value: Math.floor(Math.random() * 30) + 40 },
        { name: 'Cash', value: Math.floor(Math.random() * 20) + 30 },
        { name: 'Mobile', value: Math.floor(Math.random() * 15) + 10 }
      ],
      alerts: generateAlerts(),
      systemHealth: {
        api: Math.random() > 0.1 ? 'healthy' : 'warning',
        database: Math.random() > 0.05 ? 'healthy' : 'error',
        payments: Math.random() > 0.08 ? 'healthy' : 'warning'
      }
    };

    setRealtimeData(mockData);
    setLastUpdate(new Date());
  };

  const generateMockTransactions = () => {
    const transactions = [];
    for (let i = 0; i < 5; i++) {
      transactions.push({
        id: `TXN${Math.random().toString(36).substr(2, 9)}`,
        amount: (Math.random() * 200 + 20).toFixed(2),
        customer: `Customer ${Math.floor(Math.random() * 1000)}`,
        method: ['Card', 'Cash', 'Mobile'][Math.floor(Math.random() * 3)],
        time: new Date(Date.now() - Math.random() * 300000).toLocaleTimeString(),
        status: Math.random() > 0.1 ? 'completed' : 'pending'
      });
    }
    return transactions;
  };

  const generateHourlyTrend = () => {
    const trend = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      trend.push({
        hour: hour.getHours(),
        sales: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 2000) + 500
      });
    }
    return trend;
  };

  const generateAlerts = () => {
    const alertTypes = [
      { type: 'info', message: 'New customer registered', priority: 'low' },
      { type: 'warning', message: 'High traffic detected', priority: 'medium' },
      { type: 'success', message: 'Daily goal achieved', priority: 'low' },
      { type: 'error', message: 'Payment gateway timeout', priority: 'high' }
    ];
    
    return alertTypes
      .filter(() => Math.random() > 0.6)
      .map(alert => ({
        ...alert,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      }));
  };

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(fetchRealtimeData, 5000); // Update every 5 seconds
  };

  const stopRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleToggleLive = () => {
    setIsLive(!isLive);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '●';
      case 'warning': return '●';
      case 'error': return '●';
      default: return '●';
    }
  };

  // Real-time metric card component
  const RealtimeMetricCard = ({ title, value, change, icon, color, isAnimated = false, format = 'number' }) => {
    const formatValue = (val) => {
      switch (format) {
        case 'currency': return `$${val?.toLocaleString() || 0}`;
        case 'percentage': return `${val}%`;
        default: return val?.toLocaleString() || 0;
      }
    };

    return (
      <Grow in={true} timeout={1000}>
        <Card 
          sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
            border: `1px solid ${alpha(color, 0.2)}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {isLive && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {title}
                </Typography>
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  color={color}
                  sx={{
                    transition: 'all 0.3s ease',
                    ...(isAnimated && {
                      animation: 'countUp 1s ease-out'
                    })
                  }}
                >
                  {formatValue(isAnimated ? 
                    (title.includes('Sales') ? animatedValues.sales :
                     title.includes('Revenue') ? animatedValues.revenue :
                     title.includes('Users') ? animatedValues.users : value) 
                    : value)}
                </Typography>
                {change && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
                      {Math.abs(change)}% live
                    </Typography>
                  </Box>
                )}
              </Box>
              <Avatar sx={{ bgcolor: color, width: 60, height: 60 }}>
                {icon}
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grow>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Real-time Analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              Real-time Analytics
            </Typography>
            {isLive && (
              <Chip 
                label="LIVE" 
                color="success" 
                size="small" 
                sx={{ 
                  ml: 2,
                  animation: 'pulse 2s infinite',
                  fontWeight: 'bold'
                }} 
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            Live monitoring of your business performance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isLive}
                onChange={handleToggleLive}
                color="success"
              />
            }
            label="Live Updates"
          />
          <IconButton onClick={fetchRealtimeData} color="primary">
            <Refresh />
          </IconButton>
          <IconButton color="primary">
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* System Health Status */}
      <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">System Health</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {Object.entries(realtimeData.systemHealth).map(([system, status]) => (
                <Box key={system} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Circle sx={{ color: getStatusColor(status), fontSize: 12, mr: 1 }} />
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {system}: {status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <RealtimeMetricCard
            title="Today's Sales"
            value={realtimeData.currentSales}
            change={5.2}
            icon={<ShoppingCart />}
            color={theme.palette.primary.main}
            isAnimated={true}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <RealtimeMetricCard
            title="Today's Revenue"
            value={realtimeData.currentRevenue}
            change={8.7}
            icon={<AttachMoney />}
            color={theme.palette.success.main}
            isAnimated={true}
            format="currency"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <RealtimeMetricCard
            title="Active Users"
            value={realtimeData.activeUsers}
            change={12.3}
            icon={<People />}
            color={theme.palette.info.main}
            isAnimated={true}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <RealtimeMetricCard
            title="Conversion Rate"
            value={realtimeData.conversionRate}
            change={-2.1}
            icon={<Speed />}
            color={theme.palette.warning.main}
            format="percentage"
          />
        </Grid>
      </Grid>

      {/* Live Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Hourly Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  24-Hour Live Trend
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isLive && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mr: 1,
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Updates every 5 seconds
                  </Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realtimeData.hourlyTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis dataKey="hour" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius
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

        {/* Payment Methods */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Methods (Live)
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={realtimeData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {realtimeData.paymentMethods?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Transactions and Alerts */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Live Transactions</Typography>
                <Badge badgeContent={realtimeData.recentTransactions?.length || 0} color="primary">
                  <Receipt />
                </Badge>
              </Box>
              <List dense>
                {realtimeData.recentTransactions?.map((transaction, index) => (
                  <Fade in={true} timeout={500 + index * 100} key={transaction.id}>
                    <ListItem
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: transaction.status === 'completed' 
                          ? alpha(theme.palette.success.main, 0.05)
                          : alpha(theme.palette.warning.main, 0.05)
                      }}
                    >
                      <ListItemIcon>
                        {transaction.method === 'Card' && <CreditCard color="primary" />}
                        {transaction.method === 'Cash' && <LocalAtm color="success" />}
                        {transaction.method === 'Mobile' && <Smartphone color="info" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              {transaction.customer}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ${transaction.amount}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">
                              {transaction.time}
                            </Typography>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={transaction.status === 'completed' ? 'success' : 'warning'}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  </Fade>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Live Alerts</Typography>
                <Badge badgeContent={realtimeData.alerts?.length || 0} color="error">
                  <Notifications />
                </Badge>
              </Box>
              <List dense>
                {realtimeData.alerts?.length > 0 ? (
                  realtimeData.alerts.map((alert, index) => (
                    <Fade in={true} timeout={500 + index * 100} key={alert.id}>
                      <ListItem
                        sx={{
                          border: `1px solid ${alpha(
                            alert.type === 'error' ? theme.palette.error.main :
                            alert.type === 'warning' ? theme.palette.warning.main :
                            alert.type === 'success' ? theme.palette.success.main :
                            theme.palette.info.main, 0.3
                          )}`,
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: alpha(
                            alert.type === 'error' ? theme.palette.error.main :
                            alert.type === 'warning' ? theme.palette.warning.main :
                            alert.type === 'success' ? theme.palette.success.main :
                            theme.palette.info.main, 0.05
                          )
                        }}
                      >
                        <ListItemText
                          primary={alert.message}
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography variant="caption">
                                {alert.timestamp.toLocaleTimeString()}
                              </Typography>
                              <Chip
                                label={alert.priority}
                                size="small"
                                color={
                                  alert.priority === 'high' ? 'error' :
                                  alert.priority === 'medium' ? 'warning' : 'default'
                                }
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    </Fade>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No alerts at the moment
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CSS Animation styles */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes countUp {
          from { transform: scale(0.8); opacity: 0.5; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default RealTimeAnalytics;