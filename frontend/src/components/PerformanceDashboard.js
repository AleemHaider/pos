import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  Inventory,
  Star,
  Target,
  Speed,
  Assessment,
  Timeline,
  WorkspacePremium,
  EmojiEvents,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
  Settings,
  Fullscreen,
  DragIndicator,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import {
  ResponsiveContainer,
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
  Tooltip as RechartsTooltip,
  RadialBarChart,
  RadialBar,
  Gauge
} from 'recharts';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const PerformanceDashboard = ({ tenantId, currentUser }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [kpiData, setKpiData] = useState({
    performance: {},
    goals: [],
    trends: [],
    alerts: [],
    achievements: [],
    comparison: {}
  });

  const [visibleWidgets, setVisibleWidgets] = useState({
    revenue: true,
    sales: true,
    customers: true,
    inventory: true,
    goals: true,
    performance: true,
    trends: true,
    alerts: true
  });

  useEffect(() => {
    loadPerformanceData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tenantId, autoRefresh]);

  const loadPerformanceData = async () => {
    try {
      const headers = { 'X-Tenant-ID': tenantId };
      
      // Mock performance data
      setKpiData({
        performance: {
          revenueScore: 85,
          salesScore: 92,
          customerScore: 78,
          operationalScore: 88,
          overallScore: 86
        },
        goals: [
          { name: 'Monthly Revenue', current: 125000, target: 150000, percentage: 83.3, trend: 'up' },
          { name: 'New Customers', current: 248, target: 300, percentage: 82.7, trend: 'up' },
          { name: 'Order Volume', current: 1847, target: 2000, percentage: 92.4, trend: 'up' },
          { name: 'Customer Satisfaction', current: 4.6, target: 4.8, percentage: 95.8, trend: 'stable' }
        ],
        trends: [
          { period: 'Week 1', revenue: 28000, sales: 420, customers: 58 },
          { period: 'Week 2', revenue: 32000, sales: 485, customers: 67 },
          { period: 'Week 3', revenue: 35000, sales: 523, customers: 72 },
          { period: 'Week 4', revenue: 30000, sales: 419, customers: 51 }
        ],
        alerts: [
          { type: 'warning', message: 'Inventory low for 3 products', priority: 'high' },
          { type: 'info', message: 'Monthly goal 83% achieved', priority: 'medium' },
          { type: 'success', message: 'Customer satisfaction improved', priority: 'low' }
        ],
        achievements: [
          { title: 'Revenue Milestone', description: 'Reached $100K monthly revenue', date: '2 days ago', icon: 'trophy' },
          { title: 'Customer Champion', description: '1000+ satisfied customers', date: '1 week ago', icon: 'star' },
          { title: 'Sales Expert', description: 'Top performer this month', date: '2 weeks ago', icon: 'medal' }
        ],
        comparison: {
          vsLastMonth: { revenue: 12.5, sales: 8.3, customers: 15.2 },
          vsLastYear: { revenue: 45.8, sales: 32.1, customers: 28.7 }
        }
      });
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || 0}`;
  const formatPercentage = (value) => `${value?.toFixed(1) || 0}%`;

  // KPI Widget Component
  const KPIWidget = ({ title, current, target, percentage, trend, icon, color, format = 'number' }) => {
    const formatValue = (value) => {
      switch (format) {
        case 'currency': return formatCurrency(value);
        case 'percentage': return formatPercentage(value);
        default: return value?.toLocaleString() || 0;
      }
    };

    const getTrendIcon = (trend) => {
      switch (trend) {
        case 'up': return <TrendingUp color="success" />;
        case 'down': return <TrendingDown color="error" />;
        default: return <Timeline color="info" />;
      }
    };

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={color}>
                {formatValue(current)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target: {formatValue(target)}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: alpha(color, 0.1), color }}>
              {icon}
            </Avatar>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatPercentage(percentage)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percentage, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(color, 0.1),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 4
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon(trend)}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                vs last period
              </Typography>
            </Box>
            <Chip
              label={percentage > 90 ? 'Excellent' : percentage > 70 ? 'Good' : 'Needs Attention'}
              color={percentage > 90 ? 'success' : percentage > 70 ? 'primary' : 'warning'}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Performance Score Widget
  const PerformanceScoreWidget = ({ title, score, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={score}
            size={120}
            thickness={4}
            sx={{
              color: color,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h3" fontWeight="bold" color={color}>
              {score}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Score
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {score > 90 ? 'Outstanding' : score > 80 ? 'Excellent' : score > 70 ? 'Good' : 'Needs Improvement'}
        </Typography>
      </CardContent>
    </Card>
  );

  // Mini Chart Widget
  const MiniChartWidget = ({ title, data, dataKey, color, type = 'line' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={data}>
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={color} 
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  fill={alpha(color, 0.3)}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Last 4 weeks trend
        </Typography>
      </CardContent>
    </Card>
  );

  // Alerts Widget
  const AlertsWidget = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Alerts & Notifications
          </Typography>
          <Chip label={kpiData.alerts?.length || 0} color="primary" size="small" />
        </Box>
        <List dense>
          {kpiData.alerts?.map((alert, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  {alert.type === 'warning' && <Warning color="warning" />}
                  {alert.type === 'info' && <Schedule color="info" />}
                  {alert.type === 'success' && <CheckCircle color="success" />}
                </ListItemIcon>
                <ListItemText
                  primary={alert.message}
                  secondary={
                    <Chip
                      label={alert.priority}
                      size="small"
                      color={alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'default'}
                    />
                  }
                />
              </ListItem>
              {index < kpiData.alerts?.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  // Achievements Widget
  const AchievementsWidget = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Achievements
        </Typography>
        <List dense>
          {kpiData.achievements?.map((achievement, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                    {achievement.icon === 'trophy' && <EmojiEvents />}
                    {achievement.icon === 'star' && <Star />}
                    {achievement.icon === 'medal' && <WorkspacePremium />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={achievement.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.date}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < kpiData.achievements?.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Performance Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Performance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time KPIs and performance metrics for {currentUser?.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          <IconButton onClick={loadPerformanceData} color="primary">
            <Refresh />
          </IconButton>
          <IconButton color="primary">
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Overall Performance Score */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <PerformanceScoreWidget
            title="Overall Performance"
            score={kpiData.performance.overallScore}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <PerformanceScoreWidget
            title="Revenue Score"
            score={kpiData.performance.revenueScore}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <PerformanceScoreWidget
            title="Sales Score"
            score={kpiData.performance.salesScore}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <PerformanceScoreWidget
            title="Customer Score"
            score={kpiData.performance.customerScore}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* KPI Goals */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiData.goals?.map((goal, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <KPIWidget
              title={goal.name}
              current={goal.current}
              target={goal.target}
              percentage={goal.percentage}
              trend={goal.trend}
              icon={
                goal.name.includes('Revenue') ? <AttachMoney /> :
                goal.name.includes('Customer') ? <People /> :
                goal.name.includes('Order') ? <ShoppingCart /> :
                <Star />
              }
              color={
                index === 0 ? theme.palette.success.main :
                index === 1 ? theme.palette.primary.main :
                index === 2 ? theme.palette.info.main :
                theme.palette.warning.main
              }
              format={
                goal.name.includes('Revenue') ? 'currency' :
                goal.name.includes('Satisfaction') ? 'number' :
                'number'
              }
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts and Widgets */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MiniChartWidget
            title="Revenue Trend"
            data={kpiData.trends}
            dataKey="revenue"
            color={theme.palette.success.main}
            type="area"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MiniChartWidget
            title="Sales Trend"
            data={kpiData.trends}
            dataKey="sales"
            color={theme.palette.primary.main}
            type="line"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MiniChartWidget
            title="Customer Growth"
            data={kpiData.trends}
            dataKey="customers"
            color={theme.palette.info.main}
            type="area"
          />
        </Grid>
      </Grid>

      {/* Alerts and Achievements */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AlertsWidget />
        </Grid>
        <Grid item xs={12} md={6}>
          <AchievementsWidget />
        </Grid>
      </Grid>

      {/* Comparison Widget */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Comparison
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <Typography variant="subtitle2" gutterBottom>
                      vs Last Month
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="success.main">
                            +{formatPercentage(kpiData.comparison.vsLastMonth?.revenue)}
                          </Typography>
                          <Typography variant="caption">Revenue</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            +{formatPercentage(kpiData.comparison.vsLastMonth?.sales)}
                          </Typography>
                          <Typography variant="caption">Sales</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="info.main">
                            +{formatPercentage(kpiData.comparison.vsLastMonth?.customers)}
                          </Typography>
                          <Typography variant="caption">Customers</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                    <Typography variant="subtitle2" gutterBottom>
                      vs Last Year
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="success.main">
                            +{formatPercentage(kpiData.comparison.vsLastYear?.revenue)}
                          </Typography>
                          <Typography variant="caption">Revenue</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            +{formatPercentage(kpiData.comparison.vsLastYear?.sales)}
                          </Typography>
                          <Typography variant="caption">Sales</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="info.main">
                            +{formatPercentage(kpiData.comparison.vsLastYear?.customers)}
                          </Typography>
                          <Typography variant="caption">Customers</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceDashboard;