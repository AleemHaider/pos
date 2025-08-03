import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Store,
  Receipt,
  Notifications,
  Security,
  Palette,
  Language,
  AttachMoney,
  Print,
  Backup,
  Update,
  Info,
  Business,
  Email,
  Phone,
  LocationOn,
  Save,
  RestoreFromTrash,
  Download,
  Upload,
  ExpandMore,
  Warning,
  CheckCircle,
  Error,
  Wifi,
  Scanner,
  CreditCard,
  LocalShipping,
  Tax,
  Inventory,
  Storage,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const Settings = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: '2.1.0',
    lastBackup: new Date().toISOString(),
    diskUsage: '2.3 GB / 10 GB',
    uptime: '5 days, 14 hours',
  });

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'ModernPOS Business',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@modernpos.com',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 10.00,
    autoLogout: 30,
    enableNotifications: true,
    enableSounds: true,
  });

  // POS Settings
  const [posSettings, setPosSettings] = useState({
    enableBarcode: true,
    enableCustomerDisplay: false,
    enableReceiptPrinter: true,
    enableCashDrawer: true,
    enableScale: false,
    defaultPaymentMethod: 'cash',
    enableQuickSale: true,
    enableDiscounts: true,
    enableTips: false,
    tipPercentages: [15, 18, 20, 25],
    receiptTemplate: 'standard',
    printReceipts: true,
    emailReceipts: false,
    lowStockAlert: true,
    lowStockThreshold: 10,
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#1976d2',
    compactMode: false,
    showAnimations: true,
    fontSize: 'medium',
    sidebarCollapsed: false,
    showBranding: true,
    customLogo: null,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    requireStrongPasswords: true,
    sessionTimeout: 60,
    enableTwoFactor: false,
    auditLog: true,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    enableGuestMode: false,
    ipWhitelist: '',
    enableSSL: true,
    automaticUpdates: true,
  });

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState({
    paymentGateway: 'stripe',
    stripeKey: '',
    paypalEnabled: false,
    squareEnabled: false,
    accountingSoftware: 'none',
    quickbooksEnabled: false,
    emailProvider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    backupProvider: 'local',
    cloudBackup: false,
  });

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleGeneralChange = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePosChange = (field, value) => {
    setPosSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAppearanceChange = (field, value) => {
    setAppearanceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleIntegrationChange = (field, value) => {
    setIntegrationSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async (category) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${category} settings saved successfully`);
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = (category) => {
    if (window.confirm(`Are you sure you want to reset ${category} settings to defaults?`)) {
      // Reset logic would go here
      toast.success(`${category} settings reset to defaults`);
    }
  };

  const exportSettings = () => {
    const settings = {
      general: generalSettings,
      pos: posSettings,
      appearance: appearanceSettings,
      security: { ...securitySettings, smtpPassword: '[REDACTED]' },
      integration: { ...integrationSettings, stripeKey: '[REDACTED]', smtpPassword: '[REDACTED]' },
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `modernpos-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Settings exported successfully');
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSystemInfo(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
      toast.success('Backup created successfully');
    } catch (error) {
      toast.error('Error creating backup');
    } finally {
      setLoading(false);
      setBackupDialog(false);
    }
  };

  const tabs = [
    { label: 'General', icon: <Business /> },
    { label: 'POS Terminal', icon: <Store /> },
    { label: 'Appearance', icon: <Palette /> },
    { label: 'Security', icon: <Security /> },
    { label: 'Integrations', icon: <Wifi /> },
    { label: 'System', icon: <SettingsIcon /> },
  ];

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  const SettingCard = ({ title, description, children, onSave, onReset, category }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onReset(category)}
              disabled={currentUser.role !== 'admin'}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => onSave(category)}
              disabled={loading || currentUser.role !== 'admin'}
            >
              Save
            </Button>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure your POS system preferences and options
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportSettings}
          >
            Export Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<Backup />}
            onClick={() => setBackupDialog(true)}
            disabled={currentUser.role !== 'admin'}
          >
            Create Backup
          </Button>
        </Box>
      </Box>

      {/* Role-based Access Warning */}
      {currentUser.role !== 'admin' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have read-only access to system settings. Only administrators can modify settings.
        </Alert>
      )}

      {/* Settings Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <SettingCard
            title="Company Information"
            description="Basic company details and contact information"
            category="Company"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={generalSettings.companyName}
                  onChange={(e) => handleGeneralChange('companyName', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Email"
                  value={generalSettings.companyEmail}
                  onChange={(e) => handleGeneralChange('companyEmail', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={generalSettings.companyPhone}
                  onChange={(e) => handleGeneralChange('companyPhone', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={generalSettings.currency}
                    onChange={(e) => handleGeneralChange('currency', e.target.value)}
                    label="Currency"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Address"
                  multiline
                  rows={2}
                  value={generalSettings.companyAddress}
                  onChange={(e) => handleGeneralChange('companyAddress', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
            </Grid>
          </SettingCard>

          <SettingCard
            title="Regional Settings"
            description="Date, time, and localization preferences"
            category="Regional"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={generalSettings.timezone}
                    onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                    label="Timezone"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={generalSettings.dateFormat}
                    onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                    label="Date Format"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  value={generalSettings.taxRate}
                  onChange={(e) => handleGeneralChange('taxRate', parseFloat(e.target.value))}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
            </Grid>
          </SettingCard>
        </TabPanel>

        {/* POS Settings */}
        <TabPanel value={activeTab} index={1}>
          <SettingCard
            title="Hardware Configuration"
            description="Configure connected POS hardware devices"
            category="Hardware"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={posSettings.enableBarcode}
                      onChange={(e) => handlePosChange('enableBarcode', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Barcode Scanner"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={posSettings.enableReceiptPrinter}
                      onChange={(e) => handlePosChange('enableReceiptPrinter', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Receipt Printer"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={posSettings.enableCashDrawer}
                      onChange={(e) => handlePosChange('enableCashDrawer', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Cash Drawer"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={posSettings.enableCustomerDisplay}
                      onChange={(e) => handlePosChange('enableCustomerDisplay', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Customer Display"
                />
              </Grid>
            </Grid>
          </SettingCard>

          <SettingCard
            title="Sales Configuration"
            description="Configure sales process and payment options"
            category="Sales"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Payment Method</InputLabel>
                  <Select
                    value={posSettings.defaultPaymentMethod}
                    onChange={(e) => handlePosChange('defaultPaymentMethod', e.target.value)}
                    label="Default Payment Method"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Credit/Debit Card</MenuItem>
                    <MenuItem value="mobile">Mobile Payment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Low Stock Threshold"
                  type="number"
                  value={posSettings.lowStockThreshold}
                  onChange={(e) => handlePosChange('lowStockThreshold', parseInt(e.target.value))}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={posSettings.enableDiscounts}
                      onChange={(e) => handlePosChange('enableDiscounts', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Enable Discounts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={posSettings.enableTips}
                      onChange={(e) => handlePosChange('enableTips', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Enable Tips"
                />
              </Grid>
            </Grid>
          </SettingCard>
        </TabPanel>

        {/* Appearance Settings */}
        <TabPanel value={activeTab} index={2}>
          <SettingCard
            title="Theme & Colors"
            description="Customize the look and feel of your POS system"
            category="Appearance"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={appearanceSettings.theme}
                    onChange={(e) => handleAppearanceChange('theme', e.target.value)}
                    label="Theme"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto (System)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Primary Color"
                  type="color"
                  value={appearanceSettings.primaryColor}
                  onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Font Size</InputLabel>
                  <Select
                    value={appearanceSettings.fontSize}
                    onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
                    label="Font Size"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={appearanceSettings.compactMode}
                      onChange={(e) => handleAppearanceChange('compactMode', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Compact Mode"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={appearanceSettings.showAnimations}
                      onChange={(e) => handleAppearanceChange('showAnimations', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Show Animations"
                />
              </Grid>
            </Grid>
          </SettingCard>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={activeTab} index={3}>
          <SettingCard
            title="Authentication & Access"
            description="Configure security policies and access controls"
            category="Security"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => handleSecurityChange('maxLoginAttempts', parseInt(e.target.value))}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.requireStrongPasswords}
                      onChange={(e) => handleSecurityChange('requireStrongPasswords', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Require Strong Passwords"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.auditLog}
                      onChange={(e) => handleSecurityChange('auditLog', e.target.checked)}
                      disabled={currentUser.role !== 'admin'}
                    />
                  }
                  label="Enable Audit Logging"
                />
              </Grid>
            </Grid>
          </SettingCard>
        </TabPanel>

        {/* Integration Settings */}
        <TabPanel value={activeTab} index={4}>
          <SettingCard
            title="Payment Gateway"
            description="Configure payment processing services"
            category="Payments"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Gateway</InputLabel>
                  <Select
                    value={integrationSettings.paymentGateway}
                    onChange={(e) => handleIntegrationChange('paymentGateway', e.target.value)}
                    label="Payment Gateway"
                    disabled={currentUser.role !== 'admin'}
                  >
                    <MenuItem value="stripe">Stripe</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="square">Square</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={integrationSettings.stripeKey}
                  onChange={(e) => handleIntegrationChange('stripeKey', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                  helperText="Enter your payment gateway API key"
                />
              </Grid>
            </Grid>
          </SettingCard>

          <SettingCard
            title="Email Configuration"
            description="Configure email settings for receipts and notifications"
            category="Email"
            onSave={saveSettings}
            onReset={resetToDefaults}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={integrationSettings.smtpHost}
                  onChange={(e) => handleIntegrationChange('smtpHost', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Port"
                  type="number"
                  value={integrationSettings.smtpPort}
                  onChange={(e) => handleIntegrationChange('smtpPort', parseInt(e.target.value))}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  value={integrationSettings.smtpUsername}
                  onChange={(e) => handleIntegrationChange('smtpUsername', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Password"
                  type="password"
                  value={integrationSettings.smtpPassword}
                  onChange={(e) => handleIntegrationChange('smtpPassword', e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                />
              </Grid>
            </Grid>
          </SettingCard>
        </TabPanel>

        {/* System Settings */}
        <TabPanel value={activeTab} index={5}>
          <SettingCard
            title="System Information"
            description="View system status and information"
            category="System"
            onSave={() => {}}
            onReset={() => {}}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      primary="Version"
                      secondary={systemInfo.version}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Backup />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Backup"
                      secondary={new Date(systemInfo.lastBackup).toLocaleString()}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Storage />
                    </ListItemIcon>
                    <ListItemText
                      primary="Disk Usage"
                      secondary={systemInfo.diskUsage}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Update />
                    </ListItemIcon>
                    <ListItemText
                      primary="System Uptime"
                      secondary={systemInfo.uptime}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </SettingCard>

          <SettingCard
            title="Maintenance"
            description="System maintenance and troubleshooting tools"
            category="Maintenance"
            onSave={() => {}}
            onReset={() => {}}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RestoreFromTrash />}
                  disabled={currentUser.role !== 'admin'}
                >
                  Clear Cache
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  disabled={currentUser.role !== 'admin'}
                >
                  Export Logs
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Update />}
                  color="warning"
                  disabled={currentUser.role !== 'admin'}
                >
                  Check Updates
                </Button>
              </Grid>
            </Grid>
          </SettingCard>
        </TabPanel>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={backupDialog} onClose={() => setBackupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will create a complete backup of your system data including:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Product inventory and pricing" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Sales transactions and history" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Customer information" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="User accounts and settings" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="System configuration" />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            The backup process may take a few minutes depending on your data size.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createBackup}
            disabled={loading}
            startIcon={<Backup />}
          >
            {loading ? 'Creating Backup...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;