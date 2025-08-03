import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Slide,
  Fab,
  AppBar,
  Toolbar,
  Container,
  Paper,
  Zoom,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  Search,
  ShoppingCart,
  Payment,
  Receipt,
  QrCode,
  Person,
  LocalAtm,
  CreditCard,
  Smartphone,
  Clear,
  ShoppingBag,
  Category,
  AttachMoney,
  CheckCircle,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Fullscreen,
  CloseFullscreen,
} from '@mui/icons-material';
import { productsAPI, salesAPI, customersAPI } from '../services/api';
import { useRefresh } from '../contexts/RefreshContext';
import toast from 'react-hot-toast';

const POSTerminal = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const { triggerRefresh } = useRefresh();

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home', 'Sports'];

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      const productsData = response.data?.products || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.price }]);
    }
    toast.success(`${product.name} added to cart`, {
      icon: '🛒',
      style: {
        background: '#10b981',
        color: 'white',
      },
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item._id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const getTax = () => {
    return getCartTotal() * 0.1; // 10% tax
  };

  const getFinalTotal = () => {
    return getCartTotal() + getTax();
  };

  const getChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - getFinalTotal());
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    if (paymentMethod === 'cash' && paid < getFinalTotal()) {
      toast.error('Insufficient payment amount');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          product: item._id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
        })),
        customer: selectedCustomer?._id,
        subtotal: getCartTotal(),
        tax: getTax(),
        total: getFinalTotal(),
        paymentMethod,
        amountPaid: paid,
        change: getChange(),
        cashier: user._id,
      };

      await salesAPI.create(saleData);
      toast.success('Sale completed successfully! 🎉', {
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
      
      // Trigger refresh of dashboard and sales components
      triggerRefresh(['dashboard', 'sales']);
      
      clearCart();
      setPaymentDialog(false);
      setAmountPaid('');
      setSelectedCustomer(null);
    } catch (error) {
      toast.error('Error processing sale');
      console.error('Sale error:', error);
    } finally {
      setLoading(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = safeProducts.filter(product => {
    if (!product || !product.name) return false;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <LocalAtm />, color: '#10b981' },
    { value: 'card', label: 'Card', icon: <CreditCard />, color: '#3b82f6' },
    { value: 'mobile', label: 'Mobile', icon: <Smartphone />, color: '#8b5cf6' },
  ];

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        overflow: 'hidden', 
        bgcolor: 'background.default',
        position: fullScreen ? 'fixed' : 'relative',
        top: fullScreen ? 0 : 'auto',
        left: fullScreen ? 0 : 'auto',
        right: fullScreen ? 0 : 'auto',
        bottom: fullScreen ? 0 : 'auto',
        zIndex: fullScreen ? 9999 : 'auto',
      }}
    >
      {/* Top Bar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
            >
              <ShoppingBag />
            </Avatar>
            <Box>
              <Typography variant="h6" color="text.primary" fontWeight="bold">
                POS Terminal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleDateString()} • {user.name}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<ShoppingCart />}
              label={`${cart.length} items`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<AttachMoney />}
              label={`$${getFinalTotal().toFixed(2)}`}
              color="success" 
              sx={{ fontWeight: 'bold' }}
            />
            <IconButton
              onClick={() => setFullScreen(!fullScreen)}
              sx={{
                bgcolor: fullScreen ? 'primary.main' : 'grey.100',
                color: fullScreen ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: fullScreen ? 'primary.dark' : 'grey.200',
                },
              }}
              title={fullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {fullScreen ? <CloseFullscreen /> : <Fullscreen />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ height: 'calc(100vh - 64px)', p: 2 }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Products Section */}
          <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Search and Filters */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                        },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'grey.50',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Category"
                        startAdornment={<Category sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<QrCode />}
                      sx={{ height: 56 }}
                    >
                      Scan
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Products Grid */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={product._id}>
                      <Zoom in timeout={300}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { 
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            },
                            height: 200,
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onClick={() => addToCart(product)}
                        >
                          <Box
                            sx={{
                              height: 120,
                              background: `linear-gradient(135deg, ${
                                ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][
                                  Math.floor(Math.random() * 5)
                                ]
                              } 0%, rgba(255,255,255,0.1) 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            <Typography
                              variant="h3"
                              sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              }}
                            >
                              {product.name.charAt(0)}
                            </Typography>
                            <Chip
                              label={`$${product.price}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                          <CardContent sx={{ flex: 1, p: 1.5 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip
                                label={`Stock: ${product.stock}`}
                                size="small"
                                color={product.stock > 10 ? 'success' : product.stock > 5 ? 'warning' : 'error'}
                                variant="outlined"
                              />
                              <IconButton
                                size="small"
                                sx={{
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'primary.dark' },
                                }}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>
          </Grid>

          {/* Cart Section */}
          <Grid item xs={12} lg={4} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Cart Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'grey.200',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'success.main',
                        width: 32,
                        height: 32,
                      }}
                    >
                      <ShoppingCart fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      Shopping Cart
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge badgeContent={cart.length} color="primary">
                      <ShoppingBag />
                    </Badge>
                    <IconButton
                      size="small"
                      onClick={() => setCartExpanded(!cartExpanded)}
                    >
                      {cartExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Cart Items */}
              <Slide direction="down" in={cartExpanded} mountOnEnter unmountOnExit>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {cart.length === 0 ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '300px',
                        color: 'text.secondary',
                      }}
                    >
                      <ShoppingCart sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                      <Typography variant="h6" gutterBottom>
                        Your cart is empty
                      </Typography>
                      <Typography variant="body2">
                        Add some products to get started
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {cart.map((item, index) => (
                        <Fade in key={item._id} timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
                          <ListItem
                            sx={{
                              borderBottom: '1px solid',
                              borderColor: 'grey.200',
                              '&:hover': { bgcolor: 'grey.50' },
                            }}
                          >
                            <Avatar
                              sx={{
                                mr: 2,
                                bgcolor: 'primary.light',
                                width: 40,
                                height: 40,
                              }}
                            >
                              {item.name.charAt(0)}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {item.name}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  ${item.price} × {item.quantity} = ${item.total.toFixed(2)}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                  sx={{ bgcolor: 'grey.100' }}
                                >
                                  <Remove fontSize="small" />
                                </IconButton>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    minWidth: 30,
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                  sx={{ bgcolor: 'grey.100' }}
                                >
                                  <Add fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => removeFromCart(item._id)}
                                  sx={{ ml: 1, color: 'error.main' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </Fade>
                      ))}
                    </List>
                  )}
                </Box>
              </Slide>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${getCartTotal().toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tax (10%):</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${getTax().toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" color="primary">
                        Total:
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        ${getFinalTotal().toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={clearCart}
                      startIcon={<Clear />}
                      sx={{ flex: 1 }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setPaymentDialog(true)}
                      startIcon={<Payment />}
                      sx={{
                        flex: 2,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        },
                      }}
                    >
                      Checkout
                    </Button>
                  </Box>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialog} 
        onClose={() => setPaymentDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'success.main',
              width: 60,
              height: 60,
              mx: 'auto',
              mb: 2,
            }}
          >
            <Payment sx={{ fontSize: 30 }} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            Process Payment
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" color="primary" fontWeight="bold" gutterBottom>
              ${getFinalTotal().toFixed(2)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Amount Due
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Select Payment Method
              </Typography>
              <Grid container spacing={2}>
                {paymentMethods.map((method) => (
                  <Grid item xs={4} key={method.value}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: paymentMethod === method.value ? 'primary.main' : 'grey.200',
                        bgcolor: paymentMethod === method.value ? 'primary.50' : 'white',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: method.color,
                            mx: 'auto',
                            mb: 1,
                          }}
                        >
                          {method.icon}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {method.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {paymentMethod === 'cash' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount Paid"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      startAdornment: <AttachMoney />,
                    },
                  }}
                />
                {amountPaid && (
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: getChange() >= 0 ? 'success.50' : 'error.50',
                      border: '1px solid',
                      borderColor: getChange() >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    <Typography
                      variant="h6"
                      color={getChange() >= 0 ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <CheckCircle />
                      Change: ${getChange().toFixed(2)}
                    </Typography>
                  </Paper>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setPaymentDialog(false)} size="large">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCheckout}
            disabled={loading}
            startIcon={<Receipt />}
            size="large"
            sx={{
              minWidth: 150,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }}
        onClick={() => setPaymentDialog(true)}
        disabled={cart.length === 0}
      >
        <Payment />
      </Fab>
    </Box>
  );
};

export default POSTerminal;