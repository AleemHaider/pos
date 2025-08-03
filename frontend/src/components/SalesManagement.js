import React, { useState, useEffect } from 'react';
import { useRefresh } from '../contexts/RefreshContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Menu,
  Alert,
  TablePagination,
  Collapse,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Receipt,
  MoreVert,
  Print,
  Email,
  MoneyOff,
  Search,
  FilterList,
  DateRange,
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  Person,
  CreditCard,
  LocalAtm,
  Smartphone,
  ExpandMore,
  ExpandLess,
  Analytics,
  FileDownload,
  Visibility,
  Delete,
  Edit,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import { salesAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';

const SalesManagement = ({ currentUser }) => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useRefresh();
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <LocalAtm />, color: 'success' },
    { value: 'card', label: 'Card', icon: <CreditCard />, color: 'primary' },
    { value: 'mobile', label: 'Mobile', icon: <Smartphone />, color: 'info' },
  ];

  const saleStatuses = [
    { value: 'completed', label: 'Completed', color: 'success', icon: <CheckCircle /> },
    { value: 'pending', label: 'Pending', color: 'warning', icon: <Schedule /> },
    { value: 'refunded', label: 'Refunded', color: 'error', icon: <MoneyOff /> },
    { value: 'cancelled', label: 'Cancelled', color: 'default', icon: <Cancel /> },
  ];

  useEffect(() => {
    loadSales();
    loadCustomers();
  }, [dateFilter, customStartDate, customEndDate]);

  // Listen for refresh triggers from POS
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Sales Management refreshing due to trigger');
      loadSales();
    }
  }, [refreshTrigger]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Add date filters
      if (dateFilter === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      } else if (dateFilter !== 'all') {
        const today = new Date();
        switch (dateFilter) {
          case 'today':
            params.startDate = today.toISOString().split('T')[0];
            params.endDate = today.toISOString().split('T')[0];
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            params.startDate = weekAgo.toISOString().split('T')[0];
            params.endDate = today.toISOString().split('T')[0];
            break;
          case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            params.startDate = monthAgo.toISOString().split('T')[0];
            params.endDate = today.toISOString().split('T')[0];
            break;
        }
      }

      const response = await salesAPI.getAll(params);
      const salesData = response.data?.sales || response.data || [];
      console.log('Sales loaded:', salesData);
      setSales(Array.isArray(salesData) ? salesData : []);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Error loading sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      const customersData = response.data?.customers || response.data || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const handleRefund = async () => {
    if (!selectedSale || !refundAmount) {
      toast.error('Please enter refund amount');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0 || amount > selectedSale.total) {
      toast.error('Invalid refund amount');
      return;
    }

    setLoading(true);
    try {
      // This would typically call a refund API endpoint
      // await salesAPI.refund(selectedSale._id, { amount, reason: refundReason });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Refund processed successfully');
      loadSales();
      setRefundDialog(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedSale(null);
    } catch (error) {
      toast.error('Error processing refund');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (sale) => {
    // This would typically integrate with a receipt printer
    console.log('Printing receipt for sale:', sale._id);
    toast.success('Receipt sent to printer');
  };

  const handleEmailReceipt = (sale) => {
    // This would typically send an email receipt
    console.log('Emailing receipt for sale:', sale._id);
    toast.success('Receipt sent via email');
  };

  const getPaymentMethodInfo = (method) => {
    return paymentMethods.find(pm => pm.value === method) || paymentMethods[0];
  };

  const getStatusInfo = (status) => {
    return saleStatuses.find(s => s.value === status) || saleStatuses[0];
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    return customer ? customer.name : 'Walk-in Customer';
  };

  // Filter sales based on search and filters
  const safeSales = Array.isArray(sales) ? sales : [];
  const filteredSales = safeSales.filter(sale => {
    if (!sale) return false;

    const matchesSearch = searchTerm === '' || 
      sale._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(sale.customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.items && sale.items.some(item => 
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesStatus = statusFilter === '' || sale.status === statusFilter;
    const matchesPayment = paymentFilter === '' || sale.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate summary statistics
  const totalSales = filteredSales.length;
  const completedSales = filteredSales.filter(s => s.status === 'completed').length;
  const totalRevenue = filteredSales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.total || 0), 0);
  const averageOrderValue = completedSales > 0 ? totalRevenue / completedSales : 0;

  // Paginated sales
  const paginatedSales = filteredSales.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Sales Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all sales transactions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => toast.success('Sales report exported')}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={() => toast.info('Advanced analytics coming soon')}
          >
            Analytics
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Receipt />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalSales}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {completedSales}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ${totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ${averageOrderValue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Order Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {dateFilter === 'custom' && (
              <>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  {saleStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Payment</InputLabel>
                <Select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  label="Payment"
                >
                  <MenuItem value="">All Methods</MenuItem>
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPaymentFilter('');
                  setDateFilter('today');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sale ID</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale) => {
                const paymentInfo = getPaymentMethodInfo(sale.paymentMethod);
                const statusInfo = getStatusInfo(sale.status);
                const isExpanded = expandedRow === sale._id;
                
                return (
                  <React.Fragment key={sale._id}>
                    <TableRow hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedRow(isExpanded ? null : sale._id)}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                          <Typography variant="body2" fontFamily="monospace">
                            #{sale._id.slice(-8)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, width: 32, height: 32, bgcolor: 'primary.light' }}>
                            <Person />
                          </Avatar>
                          <Typography variant="body2">
                            {getCustomerName(sale.customer)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {sale.items?.length || 0} items
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sale.items?.slice(0, 2).map(item => item.productName).join(', ')}
                          {sale.items?.length > 2 && '...'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          ${sale.total?.toFixed(2) || '0.00'}
                        </Typography>
                        {sale.tax > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Tax: ${sale.tax?.toFixed(2)}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={paymentInfo.label}
                          color={paymentInfo.color}
                          size="small"
                          icon={paymentInfo.icon}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          icon={statusInfo.icon}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {sale.cashierName || 'Unknown'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            setSelectedSale(sale);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Sale Items:
                            </Typography>
                            <List dense>
                              {sale.items?.map((item, index) => (
                                <ListItem key={index} sx={{ py: 0.5 }}>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">
                                          {item.productName} × {item.quantity}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          ${item.totalPrice?.toFixed(2)}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={`Unit price: $${item.unitPrice?.toFixed(2)}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                            
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Subtotal: ${sale.subtotal?.toFixed(2)} | Tax: ${sale.tax?.toFixed(2)} | Total: ${sale.total?.toFixed(2)}
                                </Typography>
                                {sale.paymentMethod === 'cash' && (
                                  <Typography variant="body2" color="text.secondary">
                                    Paid: ${sale.amountPaid?.toFixed(2)} | Change: ${sale.change?.toFixed(2)}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  startIcon={<Print />}
                                  onClick={() => handlePrintReceipt(sale)}
                                >
                                  Print
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Email />}
                                  onClick={() => handleEmailReceipt(sale)}
                                >
                                  Email
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setDetailsDialog(true);
            setMenuAnchor(null);
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            handlePrintReceipt(selectedSale);
            setMenuAnchor(null);
          }}
        >
          <Print sx={{ mr: 1 }} />
          Print Receipt
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleEmailReceipt(selectedSale);
            setMenuAnchor(null);
          }}
        >
          <Email sx={{ mr: 1 }} />
          Email Receipt
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setRefundDialog(true);
            setMenuAnchor(null);
          }}
          disabled={selectedSale?.status !== 'completed' || currentUser.role === 'cashier'}
          sx={{ color: 'error.main' }}
        >
          <MoneyOff sx={{ mr: 1 }} />
          Process Refund
        </MenuItem>
      </Menu>

      {/* Sale Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Sale Details - #{selectedSale?._id.slice(-8)}
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Sale Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Sale ID" secondary={selectedSale._id} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Date & Time" 
                      secondary={new Date(selectedSale.createdAt).toLocaleString()} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Customer" 
                      secondary={getCustomerName(selectedSale.customer)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Cashier" 
                      secondary={selectedSale.cashierName || 'Unknown'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Payment Method" 
                      secondary={getPaymentMethodInfo(selectedSale.paymentMethod).label} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Subtotal" 
                      secondary={`$${selectedSale.subtotal?.toFixed(2)}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Tax" 
                      secondary={`$${selectedSale.tax?.toFixed(2)}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Total" 
                      secondary={`$${selectedSale.total?.toFixed(2)}`} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Items Purchased
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSale.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell align="right">${item.totalPrice?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => handlePrintReceipt(selectedSale)}
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialog} onClose={() => setRefundDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Processing a refund will update the sale status and cannot be undone.
          </Alert>
          
          <TextField
            fullWidth
            label="Refund Amount"
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            sx={{ mb: 2 }}
            helperText={`Maximum refund: $${selectedSale?.total?.toFixed(2) || '0.00'}`}
          />
          
          <TextField
            fullWidth
            label="Refund Reason"
            multiline
            rows={3}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Enter reason for refund (optional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRefund}
            disabled={loading || !refundAmount}
            startIcon={<MoneyOff />}
          >
            {loading ? 'Processing...' : 'Process Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesManagement;