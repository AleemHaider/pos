import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CreditCard,
  Check,
  Close,
  Warning,
  TrendingUp,
  People,
  Inventory,
  Receipt,
  Cancel,
  Upgrade,
  History,
  Download,
  Email,
  CalendarToday,
  Timer,
  AttachMoney
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

const SubscriptionManagement = ({ tenantId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [changePlanDialog, setChangePlanDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [tenantId]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId 
      };

      // Load subscription details
      const [subResponse, usageResponse, plansResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/subscription/current`, { headers }),
        axios.get(`${API_BASE_URL}/subscription/usage`, { headers }),
        axios.get(`${API_BASE_URL}/subscription/plans`)
      ]);

      setSubscription(subResponse.data.subscription);
      setUsage(usageResponse.data.usage);
      setPlans(plansResponse.data.plans);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    setChangePlanDialog(true);
  };

  const handleChangePlan = async () => {
    if (!selectedNewPlan) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/subscription/change-plan`,
        { planId: selectedNewPlan },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantId 
          }
        }
      );

      if (response.data.success) {
        toast.success('Plan changed successfully');
        setChangePlanDialog(false);
        loadSubscriptionData();
      }
    } catch (error) {
      toast.error('Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (reason) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/cancel`,
        { reason },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantId 
          }
        }
      );

      if (response.data.success) {
        toast.success('Subscription cancelled');
        setCancelDialog(false);
        loadSubscriptionData();
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/subscription/create-checkout-session`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantId 
          }
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error('Failed to start payment process');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trialing': return 'info';
      case 'past_due': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No subscription found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Subscription & Billing
      </Typography>

      <Grid container spacing={3}>
        {/* Current Plan */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Current Plan</Typography>
                <Chip 
                  label={subscription.status} 
                  color={getStatusColor(subscription.status)}
                  size="small"
                />
              </Box>

              <Typography variant="h4" color="primary" gutterBottom>
                {subscription.plan.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {subscription.plan.description}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h5">
                  ${subscription.billingCycle === 'yearly' 
                    ? subscription.plan.price.yearly 
                    : subscription.plan.price.monthly}
                  <Typography variant="body2" component="span" color="text.secondary">
                    /{subscription.billingCycle}
                  </Typography>
                </Typography>
              </Box>

              {subscription.isInTrial && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Trial ends in {subscription.trialDaysRemaining} days
                  </Typography>
                </Alert>
              )}

              {subscription.status === 'trialing' && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleStartPayment}
                  startIcon={<CreditCard />}
                >
                  Add Payment Method
                </Button>
              )}

              {subscription.status === 'active' && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleUpgradeClick}
                    startIcon={<Upgrade />}
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => setCancelDialog(true)}
                    startIcon={<Cancel />}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Billing Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing Information
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon><CalendarToday /></ListItemIcon>
                  <ListItemText 
                    primary="Current Period" 
                    secondary={`${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`}
                  />
                </ListItem>

                {subscription.lastPayment && (
                  <ListItem>
                    <ListItemIcon><AttachMoney /></ListItemIcon>
                    <ListItemText 
                      primary="Last Payment" 
                      secondary={`$${subscription.lastPayment.amount} on ${formatDate(subscription.lastPayment.date)}`}
                    />
                  </ListItem>
                )}

                {subscription.nextPayment && (
                  <ListItem>
                    <ListItemIcon><Timer /></ListItemIcon>
                    <ListItemText 
                      primary="Next Payment" 
                      secondary={`$${subscription.nextPayment.amount} on ${formatDate(subscription.nextPayment.date)}`}
                    />
                  </ListItem>
                )}
              </List>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<History />}
                >
                  Payment History
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                >
                  Download Invoice
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage & Limits
              </Typography>

              <Grid container spacing={3}>
                {usage && Object.entries(usage).map(([key, data]) => (
                  <Grid item xs={12} sm={6} md={3} key={key}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                        <Typography variant="body2">
                          {data.used} / {data.limit}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={data.percentage} 
                        color={data.percentage > 90 ? 'error' : data.percentage > 75 ? 'warning' : 'primary'}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                      {data.percentage > 90 && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          Approaching limit
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Features */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Features
              </Typography>

              <Grid container spacing={2}>
                {Object.entries(subscription.plan.features).map(([feature, enabled]) => (
                  <Grid item xs={12} sm={6} md={4} key={feature}>
                    <ListItem>
                      <ListItemIcon>
                        {enabled ? <Check color="success" /> : <Close color="disabled" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                        primaryTypographyProps={{
                          color: enabled ? 'text.primary' : 'text.disabled'
                        }}
                      />
                    </ListItem>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Plan Dialog */}
      <Dialog 
        open={changePlanDialog} 
        onClose={() => setChangePlanDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Change Your Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {plans.filter(p => p._id !== subscription.plan._id).map((plan) => (
              <Grid item xs={12} md={6} key={plan._id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedNewPlan === plan._id ? 2 : 1,
                    borderColor: selectedNewPlan === plan._id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedNewPlan(plan._id)}
                >
                  <CardContent>
                    <Typography variant="h6">{plan.name}</Typography>
                    <Typography variant="h4" color="primary">
                      ${subscription.billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                      <Typography variant="body2" component="span" color="text.secondary">
                        /{subscription.billingCycle}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePlanDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleChangePlan}
            disabled={!selectedNewPlan || loading}
          >
            Change Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog 
        open={cancelDialog} 
        onClose={() => setCancelDialog(false)}
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription? You'll lose access to all features at the end of your current billing period.
          </Alert>
          <Typography variant="body2">
            Your subscription will remain active until {formatDate(subscription.currentPeriodEnd)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Keep Subscription</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => handleCancelSubscription('User requested cancellation')}
            disabled={loading}
          >
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;