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
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Rating
} from '@mui/material';
import {
  People,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  Star,
  Schedule,
  LocationOn,
  Phone,
  Email,
  Analytics,
  Download,
  Refresh,
  PersonAdd,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  Group,
  AccountBalance,
  Loyalty,
  LocalOffer,
  CalendarToday,
  Compare
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts';
import { customersAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomerAnalytics = ({ tenantId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    overview: {},
    demographics: {},
    segments: [],
    lifetime: [],
    retention: [],
    geography: [],
    behavior: [],
    topCustomers: [],
    churnRisk: [],
    growth: []
  });

  // Filters
  const [timeRange, setTimeRange] = useState('30d');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalSpent');

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  useEffect(() => {
    loadCustomerData();
  }, [tenantId, timeRange, segmentFilter, sortBy]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-Tenant-ID': tenantId };
      const params = { period: timeRange, segment: segmentFilter };
      
      const response = await analyticsAPI.getCustomerAnalytics(params, headers);
      setReportData(response.data);
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load customer analytics');
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'vip': return 'success';
      case 'regular': return 'primary';
      case 'new': return 'info';
      case 'at_risk': return 'warning';
      case 'churned': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || 0}`;

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // Overview Tab
  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Customer Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Customers
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {reportData.overview.totalCustomers?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +{reportData.overview.growthRate || 0}% vs last period
                  </Typography>
                </Box>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                <People />
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
                  Customer LTV
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {formatCurrency(reportData.overview.averageLTV)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average lifetime value
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
                  Retention Rate
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {reportData.overview.retentionRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer retention
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main', width: 60, height: 60 }}>
                <Loyalty />
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
                  New Customers
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="info.main">
                  {reportData.overview.newCustomers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This month
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main', width: 60, height: 60 }}>
                <PersonAdd />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Customer Growth Trend */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Growth & Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData.growth}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
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
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  fill={alpha(theme.palette.success.main, 0.3)}
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="newCustomers"
                  fill={theme.palette.primary.main}
                  name="New Customers"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalCustomers"
                  stroke={theme.palette.secondary.main}
                  strokeWidth={3}
                  name="Total Customers"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Customer Segments */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Segments
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={reportData.segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {reportData.segments?.map((entry, index) => (
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

      {/* Customer Lifetime Value Distribution */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Lifetime Value Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.lifetime}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="range" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.3)}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Demographics Tab
  const DemographicsTab = () => (
    <Grid container spacing={3}>
      {/* Age Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Age Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={reportData.demographics.ageGroups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Gender Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={reportData.demographics.gender}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label
                >
                  {reportData.demographics.gender?.map((entry, index) => (
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

      {/* Geographic Distribution */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Geographic Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={reportData.geography}
                dataKey="customerCount"
                ratio={4/3}
                stroke={theme.palette.background.paper}
                fill={theme.palette.primary.main}
              />
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Spending Patterns by Demographics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Spending Patterns by Age Group
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={reportData.demographics.spendingPatterns}>
                <PolarGrid />
                <PolarAngleAxis dataKey="ageGroup" />
                <PolarRadiusAxis />
                <Radar
                  name="Average Spending"
                  dataKey="averageSpending"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.3)}
                />
                <Radar
                  name="Purchase Frequency"
                  dataKey="frequency"
                  stroke={theme.palette.secondary.main}
                  fill={alpha(theme.palette.secondary.main, 0.3)}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Behavior Analysis Tab
  const BehaviorTab = () => (
    <Grid container spacing={3}>
      {/* Top Customers */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Customers by Value
            </Typography>
            <List>
              {reportData.topCustomers?.slice(0, 8).map((customer, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: colors[index % colors.length] }}>
                        {customer.name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={customer.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {formatCurrency(customer.totalSpent)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.orderCount} orders • Last visit: {customer.lastVisit}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={customer.segment}
                      color={getSegmentColor(customer.segment)}
                      size="small"
                    />
                  </ListItem>
                  {index < reportData.topCustomers?.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Churn Risk Customers */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customers at Risk of Churning
            </Typography>
            <List>
              {reportData.churnRisk?.slice(0, 8).map((customer, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                        {customer.name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={customer.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Last order: {customer.daysSinceLastOrder} days ago
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={customer.churnRisk}
                            color="warning"
                            sx={{ mt: 1 }}
                          />
                          <Typography variant="caption" color="warning.main">
                            Risk: {customer.churnRisk}%
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < reportData.churnRisk?.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Purchase Behavior Patterns */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Purchase Behavior Patterns
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData.behavior}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="hour" stroke={theme.palette.text.secondary} />
                <YAxis yAxisId="left" stroke={theme.palette.text.secondary} />
                <YAxis yAxisId="right" orientation="right" stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="transactions"
                  fill={theme.palette.primary.main}
                  name="Transactions"
                  opacity={0.8}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageValue"
                  stroke={theme.palette.success.main}
                  strokeWidth={3}
                  name="Average Value ($)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Customer Retention Cohort */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Retention Cohort Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.retention}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Legend />
                {reportData.retention?.[0] && Object.keys(reportData.retention[0])
                  .filter(key => key !== 'month')
                  .map((cohort, index) => (
                    <Line
                      key={cohort}
                      type="monotone"
                      dataKey={cohort}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      name={cohort}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Customer Satisfaction & Loyalty */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Segments Performance
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Segment</TableCell>
                    <TableCell align="right">Customers</TableCell>
                    <TableCell align="right">Avg Spending</TableCell>
                    <TableCell align="right">Order Frequency</TableCell>
                    <TableCell align="right">Retention Rate</TableCell>
                    <TableCell align="center">Satisfaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.segments?.map((segment, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={segment.name}
                          color={getSegmentColor(segment.name)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{segment.count}</TableCell>
                      <TableCell align="right">{formatCurrency(segment.avgSpending)}</TableCell>
                      <TableCell align="right">{segment.frequency}</TableCell>
                      <TableCell align="right">{segment.retention}%</TableCell>
                      <TableCell align="center">
                        <Rating
                          value={segment.satisfaction}
                          precision={0.1}
                          size="small"
                          readOnly
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Customer Analytics & Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Understand your customers better with comprehensive analytics and behavioral insights
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Compare />}
          >
            Compare Segments
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export Report
          </Button>
          <Button
            variant="contained"
            startIcon={<Analytics />}
          >
            Advanced Analytics
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer Segment</InputLabel>
                <Select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  label="Customer Segment"
                >
                  <MenuItem value="all">All Segments</MenuItem>
                  <MenuItem value="vip">VIP Customers</MenuItem>
                  <MenuItem value="regular">Regular Customers</MenuItem>
                  <MenuItem value="new">New Customers</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="totalSpent">Total Spent</MenuItem>
                  <MenuItem value="lastVisit">Last Visit</MenuItem>
                  <MenuItem value="orderCount">Order Count</MenuItem>
                  <MenuItem value="loyalty">Loyalty Points</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadCustomerData}
              >
                Refresh Data
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Report Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Overview" icon={<ShowChart />} />
            <Tab label="Demographics" icon={<Group />} />
            <Tab label="Behavior" icon={<Timeline />} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <OverviewTab />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DemographicsTab />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <BehaviorTab />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default CustomerAnalytics;