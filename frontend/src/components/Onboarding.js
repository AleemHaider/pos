import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Store,
  CreditCard,
  Check,
  Close,
  TrendingUp,
  People,
  Inventory,
  Analytics,
  LocationOn,
  Support,
  Api,
  Palette,
  Star,
  ArrowForward,
  ArrowBack,
  Restaurant,
  LocalGroceryStore,
  LocalPharmacy,
  ShoppingCart,
  Business
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

const Onboarding = ({ user, setUser }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  
  // Form data
  const [shopData, setShopData] = useState({
    shopName: '',
    businessType: 'retail',
    currency: 'USD',
    timezone: 'America/New_York',
    taxRate: 0,
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    phone: '',
    website: ''
  });
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const steps = ['Shop Information', 'Choose Your Plan', 'Get Started'];

  const businessTypes = [
    { value: 'retail', label: 'Retail Store', icon: <Store /> },
    { value: 'restaurant', label: 'Restaurant', icon: <Restaurant /> },
    { value: 'grocery', label: 'Grocery Store', icon: <LocalGroceryStore /> },
    { value: 'pharmacy', label: 'Pharmacy', icon: <LocalPharmacy /> },
    { value: 'other', label: 'Other', icon: <Business /> }
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      setPlans(response.data.plans);
      // Auto-select the popular plan
      const popularPlan = response.data.plans.find(p => p.isPopular);
      if (popularPlan) {
        setSelectedPlan(popularPlan._id);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateShopInfo()) {
      return;
    }
    if (activeStep === 1 && !selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateShopInfo = () => {
    if (!shopData.shopName.trim()) {
      toast.error('Please enter your shop name');
      return false;
    }
    return true;
  };

  const handleCreateSubscription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/create`,
        {
          planId: selectedPlan,
          billingCycle,
          ...shopData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Welcome to your new POS system!');
        // Update user context
        setUser({
          ...user,
          hasTenant: true,
          currentTenant: response.data.tenant._id
        });
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const renderShopInfo = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Tell us about your shop
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        We'll use this information to customize your POS experience
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Shop Name"
            value={shopData.shopName}
            onChange={(e) => setShopData({ ...shopData, shopName: e.target.value })}
            placeholder="My Awesome Store"
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Business Type
          </Typography>
          <RadioGroup
            row
            value={shopData.businessType}
            onChange={(e) => setShopData({ ...shopData, businessType: e.target.value })}
          >
            {businessTypes.map((type) => (
              <FormControlLabel
                key={type.value}
                value={type.value}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              value={shopData.currency}
              onChange={(e) => setShopData({ ...shopData, currency: e.target.value })}
              label="Currency"
            >
              <MenuItem value="USD">USD - US Dollar</MenuItem>
              <MenuItem value="EUR">EUR - Euro</MenuItem>
              <MenuItem value="GBP">GBP - British Pound</MenuItem>
              <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Sales Tax Rate (%)"
            type="number"
            value={shopData.taxRate}
            onChange={(e) => setShopData({ ...shopData, taxRate: parseFloat(e.target.value) || 0 })}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Contact Information (Optional)
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={shopData.phone}
            onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Website"
            value={shopData.website}
            onChange={(e) => setShopData({ ...shopData, website: e.target.value })}
            placeholder="https://mystore.com"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPlanSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Choose your plan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All plans include a free trial. No credit card required.
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <RadioGroup
          row
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value)}
        >
          <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
          <FormControlLabel 
            value="yearly" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Yearly
                <Chip label="Save 20%" size="small" color="success" />
              </Box>
            } 
          />
        </RadioGroup>
      </Box>

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan._id}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                cursor: 'pointer',
                border: selectedPlan === plan._id ? 2 : 1,
                borderColor: selectedPlan === plan._id ? 'primary.main' : 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => setSelectedPlan(plan._id)}
            >
              {plan.isPopular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16
                  }}
                />
              )}
              
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {plan.name}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" component="span" fontWeight="bold">
                    ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                  </Typography>
                  <Typography variant="body2" component="span" color="text.secondary">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {plan.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Features:
                </Typography>
                <List dense>
                  {plan.features.inventory && (
                    <ListItem>
                      <ListItemIcon><Check color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Inventory Management" />
                    </ListItem>
                  )}
                  {plan.features.customers && (
                    <ListItem>
                      <ListItemIcon><Check color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Customer Management" />
                    </ListItem>
                  )}
                  {plan.features.loyalty && (
                    <ListItem>
                      <ListItemIcon><Check color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Loyalty Program" />
                    </ListItem>
                  )}
                  {plan.features.analytics && (
                    <ListItem>
                      <ListItemIcon><Check color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Advanced Analytics" />
                    </ListItem>
                  )}
                  {plan.features.multiLocation && (
                    <ListItem>
                      <ListItemIcon><Check color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Multiple Locations" />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Limits:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {plan.limits.maxUsers} Users<br />
                  • {plan.limits.maxProducts} Products<br />
                  • {plan.limits.maxTransactionsPerMonth} Transactions/month
                </Typography>

                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant={selectedPlan === plan._id ? "contained" : "outlined"}
                    color="primary"
                  >
                    {selectedPlan === plan._id ? 'Selected' : 'Select Plan'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderGetStarted = () => {
    const selectedPlanDetails = plans.find(p => p._id === selectedPlan);
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Ready to get started!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Review your selections and start your free trial
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Shop Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Shop Name" 
                    secondary={shopData.shopName} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Business Type" 
                    secondary={businessTypes.find(t => t.value === shopData.businessType)?.label} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Currency" 
                    secondary={shopData.currency} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Tax Rate" 
                    secondary={`${shopData.taxRate}%`} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Subscription Plan
              </Typography>
              {selectedPlanDetails && (
                <>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {selectedPlanDetails.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedPlanDetails.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h5">
                      ${billingCycle === 'yearly' 
                        ? selectedPlanDetails.price.yearly 
                        : selectedPlanDetails.price.monthly}
                      <Typography variant="body2" component="span" color="text.secondary">
                        /{billingCycle}
                      </Typography>
                    </Typography>
                  </Box>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Your {selectedPlanDetails.trialDays}-day free trial starts today. 
                      No credit card required.
                    </Typography>
                  </Alert>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateSubscription}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Check />}
          >
            {loading ? 'Creating Your Shop...' : 'Start Free Trial'}
          </Button>
        </Box>
      </Box>
    );
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderShopInfo();
      case 1:
        return renderPlanSelection();
      case 2:
        return renderGetStarted();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Welcome to CloudPOS
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Let's set up your shop in just a few steps
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {getStepContent(activeStep)}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        
        {activeStep < steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Onboarding;