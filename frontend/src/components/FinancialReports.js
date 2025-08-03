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
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  Alert,
  Divider
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Receipt,
  Assessment,
  PieChart,
  ShowChart,
  BarChart,
  Timeline,
  AccountBalanceWallet,
  CreditCard,
  MoneyOff,
  LocalAtm,
  Analytics,
  Download,
  Print,
  Refresh,
  DateRange,
  CompareArrows,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
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
  ComposedChart,
  Waterfall,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const FinancialReports = ({ tenantId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    overview: {},
    profitLoss: [],
    cashFlow: [],
    revenue: [],
    expenses: [],
    margins: [],
    taxes: [],
    forecasts: [],
    ratios: {},
    breakdown: {}
  });

  // Filters
  const [timeRange, setTimeRange] = useState('30d');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  const [reportType, setReportType] = useState('summary');

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  useEffect(() => {
    loadFinancialData();
  }, [tenantId, timeRange, comparisonPeriod, reportType]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const headers = { 'X-Tenant-ID': tenantId };
      const params = { 
        period: timeRange, 
        comparison: comparisonPeriod,
        type: reportType 
      };
      
      // Mock data for demonstration
      setReportData({
        overview: {
          totalRevenue: 125000,
          totalExpenses: 87500,
          netProfit: 37500,
          grossMargin: 45.2,
          operatingMargin: 30.0,
          netMargin: 28.5,
          revenueGrowth: 12.5,
          expenseGrowth: 8.3,
          profitGrowth: 18.7
        },
        profitLoss: [
          { category: 'Revenue', amount: 125000, percentage: 100 },
          { category: 'Cost of Goods Sold', amount: -68750, percentage: -55 },
          { category: 'Gross Profit', amount: 56250, percentage: 45 },
          { category: 'Operating Expenses', amount: -18750, percentage: -15 },
          { category: 'Operating Profit', amount: 37500, percentage: 30 },
          { category: 'Taxes', amount: -5625, percentage: -4.5 },
          { category: 'Net Profit', amount: 31875, percentage: 25.5 }
        ],
        cashFlow: [
          { period: 'Jan', operating: 15000, investing: -5000, financing: 2000 },
          { period: 'Feb', operating: 18000, investing: -3000, financing: 1000 },
          { period: 'Mar', operating: 22000, investing: -7000, financing: -2000 },
          { period: 'Apr', operating: 25000, investing: -4000, financing: 3000 },
          { period: 'May', operating: 28000, investing: -6000, financing: 1500 },
          { period: 'Jun', operating: 31000, investing: -8000, financing: -1000 }
        ],
        revenue: [
          { source: 'Product Sales', amount: 87500, percentage: 70 },
          { source: 'Services', amount: 25000, percentage: 20 },
          { source: 'Subscriptions', amount: 10000, percentage: 8 },
          { source: 'Other', amount: 2500, percentage: 2 }
        ],
        expenses: [
          { category: 'Cost of Goods', amount: 68750, percentage: 78.6 },
          { category: 'Salaries', amount: 12500, percentage: 14.3 },
          { category: 'Rent', amount: 3000, percentage: 3.4 },
          { category: 'Marketing', amount: 2000, percentage: 2.3 },
          { category: 'Other', amount: 1250, percentage: 1.4 }
        ],
        margins: [
          { period: 'Jan', gross: 42, operating: 28, net: 22 },
          { period: 'Feb', gross: 44, operating: 30, net: 24 },
          { period: 'Mar', gross: 43, operating: 29, net: 23 },
          { period: 'Apr', gross: 46, operating: 32, net: 26 },
          { period: 'May', gross: 45, operating: 31, net: 25 },
          { period: 'Jun', gross: 47, operating: 33, net: 27 }
        ],
        ratios: {
          currentRatio: 2.3,
          quickRatio: 1.8,
          debtToEquity: 0.4,
          returnOnAssets: 15.2,
          returnOnEquity: 22.8,
          assetTurnover: 1.6,
          inventoryTurnover: 8.5,
          receivablesTurnover: 12.3
        },
        breakdown: {
          revenueByPayment: [
            { method: 'Cash', amount: 50000, percentage: 40 },
            { method: 'Card', amount: 62500, percentage: 50 },
            { method: 'Mobile', amount: 12500, percentage: 10 }
          ],
          expensesByType: [
            { type: 'Fixed', amount: 15500, percentage: 17.7 },
            { type: 'Variable', amount: 72000, percentage: 82.3 }
          ]
        }
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || 0}`;
  const formatPercentage = (value) => `${value?.toFixed(1) || 0}%`;

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // Overview Tab
  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Financial Metrics */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {formatCurrency(reportData.overview.totalRevenue)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +{reportData.overview.revenueGrowth}%
                  </Typography>
                </Box>
              </Box>
              <AccountBalanceWallet sx={{ fontSize: 60, color: theme.palette.success.main, opacity: 0.3 }} />
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
                  Total Expenses
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="error.main">
                  {formatCurrency(reportData.overview.totalExpenses)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.error.main, mr: 0.5 }} />
                  <Typography variant="body2" color="error.main">
                    +{reportData.overview.expenseGrowth}%
                  </Typography>
                </Box>
              </Box>
              <MoneyOff sx={{ fontSize: 60, color: theme.palette.error.main, opacity: 0.3 }} />
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
                  Net Profit
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {formatCurrency(reportData.overview.netProfit)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: theme.palette.primary.main, mr: 0.5 }} />
                  <Typography variant="body2" color="primary.main">
                    +{reportData.overview.profitGrowth}%
                  </Typography>
                </Box>
              </Box>
              <Assessment sx={{ fontSize: 60, color: theme.palette.primary.main, opacity: 0.3 }} />
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
                  Net Margin
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {formatPercentage(reportData.overview.netMargin)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gross: {formatPercentage(reportData.overview.grossMargin)}
                </Typography>
              </Box>
              <Timeline sx={{ fontSize: 60, color: theme.palette.warning.main, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Profit & Loss Waterfall */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profit & Loss Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={reportData.profitLoss}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="category" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip 
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill={(entry) => entry.amount > 0 ? theme.palette.success.main : theme.palette.error.main}
                  radius={[4, 4, 0, 0]}
                >
                  {reportData.profitLoss.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.amount > 0 ? theme.palette.success.main : theme.palette.error.main} 
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Revenue Sources */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Revenue Sources
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={reportData.revenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {reportData.revenue?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Margin Trends */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Margin Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.margins}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gross"
                  stroke={theme.palette.success.main}
                  strokeWidth={3}
                  name="Gross Margin (%)"
                />
                <Line
                  type="monotone"
                  dataKey="operating"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  name="Operating Margin (%)"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke={theme.palette.warning.main}
                  strokeWidth={3}
                  name="Net Margin (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Cash Flow Tab
  const CashFlowTab = () => (
    <Grid container spacing={3}>
      {/* Cash Flow Statement */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cash Flow Statement
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar
                  dataKey="operating"
                  stackId="a"
                  fill={theme.palette.success.main}
                  name="Operating Activities"
                />
                <Bar
                  dataKey="investing"
                  stackId="a"
                  fill={theme.palette.warning.main}
                  name="Investing Activities"
                />
                <Bar
                  dataKey="financing"
                  stackId="a"
                  fill={theme.palette.info.main}
                  name="Financing Activities"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Cash Flow Summary */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Operating Cash Flow
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatCurrency(139000)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net cash from operations
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Net Income
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(37500)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Depreciation
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(8500)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Working Capital
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(-15000)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Other
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(5000)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Cash Position */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cash Position
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {formatCurrency(85000)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current cash balance
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cash in Bank
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(75000)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Petty Cash
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(2500)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Short-term Investments
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(7500)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Days Cash on Hand
                </Typography>
                <Typography variant="h6" color="success.main">
                  45 days
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Financial Ratios Tab
  const RatiosTab = () => (
    <Grid container spacing={3}>
      {/* Liquidity Ratios */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Liquidity Ratios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {reportData.ratios.currentRatio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Ratio
                  </Typography>
                  <Chip
                    label="Good"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="warning.main" fontWeight="bold">
                    {reportData.ratios.quickRatio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quick Ratio
                  </Typography>
                  <Chip
                    label="Acceptable"
                    color="warning"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Profitability Ratios */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profitability Ratios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {formatPercentage(reportData.ratios.returnOnAssets)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Return on Assets
                  </Typography>
                  <Chip
                    label="Excellent"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {formatPercentage(reportData.ratios.returnOnEquity)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Return on Equity
                  </Typography>
                  <Chip
                    label="Excellent"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Efficiency Ratios */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Efficiency Ratios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary.main" fontWeight="bold">
                    {reportData.ratios.inventoryTurnover}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inventory Turnover
                  </Typography>
                  <Chip
                    label="Good"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary.main" fontWeight="bold">
                    {reportData.ratios.assetTurnover}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Asset Turnover
                  </Typography>
                  <Chip
                    label="Good"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Leverage Ratios */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Leverage Ratios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {reportData.ratios.debtToEquity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Debt-to-Equity Ratio
                  </Typography>
                  <Chip
                    label="Low Risk"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Ratio Trends */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Key Ratio Trends
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ratio</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Previous</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Benchmark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Current Ratio</TableCell>
                    <TableCell align="right">2.3</TableCell>
                    <TableCell align="right">2.1</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <TrendingUp color="success" sx={{ mr: 0.5 }} />
                        +9.5%
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <CheckCircle color="success" />
                    </TableCell>
                    <TableCell>1.5 - 3.0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ROA</TableCell>
                    <TableCell align="right">15.2%</TableCell>
                    <TableCell align="right">13.8%</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <TrendingUp color="success" sx={{ mr: 0.5 }} />
                        +10.1%
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <CheckCircle color="success" />
                    </TableCell>
                    <TableCell>5% - 20%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Inventory Turnover</TableCell>
                    <TableCell align="right">8.5</TableCell>
                    <TableCell align="right">7.2</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <TrendingUp color="success" sx={{ mr: 0.5 }} />
                        +18.1%
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <CheckCircle color="success" />
                    </TableCell>
                    <TableCell>6 - 12</TableCell>
                  </TableRow>
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
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Financial Reports & Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive financial insights, ratios, and performance metrics
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CompareArrows />}
            >
              Compare Periods
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
              Advanced Analysis
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
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                    <MenuItem value="6m">Last 6 Months</MenuItem>
                    <MenuItem value="1y">Last Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Comparison</InputLabel>
                  <Select
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value)}
                    label="Comparison"
                  >
                    <MenuItem value="previous">Previous Period</MenuItem>
                    <MenuItem value="year_ago">Same Period Last Year</MenuItem>
                    <MenuItem value="budget">Budget</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    label="Report Type"
                  >
                    <MenuItem value="summary">Summary</MenuItem>
                    <MenuItem value="detailed">Detailed</MenuItem>
                    <MenuItem value="consolidated">Consolidated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadFinancialData}
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
              <Tab label="Cash Flow" icon={<AccountBalance />} />
              <Tab label="Financial Ratios" icon={<Assessment />} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <OverviewTab />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <CashFlowTab />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <RatiosTab />
          </TabPanel>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialReports;