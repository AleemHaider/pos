import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme
} from '@mui/material';
import {
  FileDownload,
  PictureAsPdf,
  TableChart,
  InsertChart,
  Email,
  Schedule,
  Settings,
  Check,
  Close,
  ArrowBack,
  ArrowForward,
  Description,
  Image,
  Assessment
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import toast from 'react-hot-toast';

const ReportExporter = ({ open, onClose, reportType, reportData, tenantId }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Export configuration
  const [exportConfig, setExportConfig] = useState({
    format: 'pdf',
    includeCharts: true,
    includeData: true,
    includeSummary: true,
    dateRange: 'current',
    customStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    customEndDate: new Date(),
    recipients: '',
    filename: '',
    schedule: 'none',
    scheduleFrequency: 'weekly',
    compression: 'none',
    password: '',
    watermark: true
  });

  const steps = ['Format & Content', 'Options & Settings', 'Delivery & Schedule'];

  const exportFormats = [
    {
      value: 'pdf',
      label: 'PDF Document',
      icon: <PictureAsPdf />,
      description: 'Formatted report with charts and styling',
      features: ['Charts', 'Formatting', 'Professional Layout']
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      icon: <TableChart />,
      description: 'Data tables with formulas and pivot tables',
      features: ['Raw Data', 'Formulas', 'Pivot Tables']
    },
    {
      value: 'csv',
      label: 'CSV Data',
      icon: <Description />,
      description: 'Raw data for analysis and import',
      features: ['Raw Data', 'Import Ready', 'Lightweight']
    },
    {
      value: 'json',
      label: 'JSON Data',
      icon: <Assessment />,
      description: 'Structured data for API integration',
      features: ['API Ready', 'Structured', 'Developer Friendly']
    },
    {
      value: 'png',
      label: 'Image Export',
      icon: <Image />,
      description: 'Charts and graphs as images',
      features: ['Charts Only', 'High Quality', 'Presentation Ready']
    }
  ];

  const reportTypes = {
    sales: 'Sales Report',
    inventory: 'Inventory Report',
    customers: 'Customer Analytics',
    financial: 'Financial Report',
    performance: 'Performance Dashboard'
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock export logic based on format
      switch (exportConfig.format) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'json':
          await exportToJSON();
          break;
        case 'png':
          await exportToPNG();
          break;
        default:
          throw new Error('Unsupported format');
      }

      toast.success(`Report exported successfully as ${exportConfig.format.toUpperCase()}`);
      
      // Send email if recipients specified
      if (exportConfig.recipients) {
        await sendEmailReport();
        toast.success('Report sent via email');
      }

      // Schedule if requested
      if (exportConfig.schedule !== 'none') {
        await scheduleReport();
        toast.success(`Report scheduled ${exportConfig.scheduleFrequency}`);
      }

      onClose();
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    // Mock PDF export
    console.log('Exporting to PDF with config:', exportConfig);
    
    // In a real implementation, you would:
    // 1. Use a library like jsPDF or Puppeteer
    // 2. Generate HTML template with data
    // 3. Convert to PDF with charts
    // 4. Apply styling and formatting
    
    const blob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportConfig.filename || `${reportType}-report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    // Mock Excel export
    console.log('Exporting to Excel with config:', exportConfig);
    
    // In a real implementation, you would:
    // 1. Use a library like xlsx or exceljs
    // 2. Create workbook with multiple sheets
    // 3. Add data tables and charts
    // 4. Apply formatting and formulas
    
    const csvContent = convertToCSV(reportData);
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportConfig.filename || `${reportType}-report.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = async () => {
    const csvContent = convertToCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportConfig.filename || `${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async () => {
    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportConfig.filename || `${reportType}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPNG = async () => {
    // Mock PNG export of charts
    console.log('Exporting charts to PNG');
    toast.info('Chart export functionality would be implemented here');
  };

  const convertToCSV = (data) => {
    if (!data || typeof data !== 'object') return '';
    
    // Simple CSV conversion for demonstration
    const rows = [];
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        rows.push(headers.join(','));
        data.forEach(item => {
          const values = headers.map(header => item[header] || '');
          rows.push(values.join(','));
        });
      }
    }
    return rows.join('\n');
  };

  const sendEmailReport = async () => {
    console.log('Sending email to:', exportConfig.recipients);
    // Mock email sending
  };

  const scheduleReport = async () => {
    console.log('Scheduling report:', exportConfig.scheduleFrequency);
    // Mock scheduling
  };

  // Step Components
  const FormatStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Export Format
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the format that best suits your needs
      </Typography>

      <Grid container spacing={2}>
        {exportFormats.map((format) => (
          <Grid item xs={12} sm={6} key={format.value}>
            <Card
              sx={{
                cursor: 'pointer',
                border: exportConfig.format === format.value ? 2 : 1,
                borderColor: exportConfig.format === format.value 
                  ? theme.palette.primary.main 
                  : theme.palette.divider,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: 2
                }
              }}
              onClick={() => setExportConfig({ ...exportConfig, format: format.value })}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {format.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {format.label}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {format.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {format.features.map((feature, index) => (
                    <Chip key={index} label={feature} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Content Options
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={exportConfig.includeCharts}
                onChange={(e) => setExportConfig({ 
                  ...exportConfig, 
                  includeCharts: e.target.checked 
                })}
              />
            }
            label="Include Charts and Visualizations"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={exportConfig.includeData}
                onChange={(e) => setExportConfig({ 
                  ...exportConfig, 
                  includeData: e.target.checked 
                })}
              />
            }
            label="Include Raw Data Tables"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={exportConfig.includeSummary}
                onChange={(e) => setExportConfig({ 
                  ...exportConfig, 
                  includeSummary: e.target.checked 
                })}
              />
            }
            label="Include Summary and Insights"
          />
        </FormGroup>
      </Box>
    </Box>
  );

  const OptionsStep = () => (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Export Options & Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Filename"
              value={exportConfig.filename}
              onChange={(e) => setExportConfig({ 
                ...exportConfig, 
                filename: e.target.value 
              })}
              placeholder={`${reportType}-report-${new Date().toISOString().split('T')[0]}`}
              helperText="Leave empty for auto-generated name"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={exportConfig.dateRange}
                onChange={(e) => setExportConfig({ 
                  ...exportConfig, 
                  dateRange: e.target.value 
                })}
                label="Date Range"
              >
                <MenuItem value="current">Current Report Data</MenuItem>
                <MenuItem value="custom">Custom Date Range</MenuItem>
                <MenuItem value="all">All Available Data</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {exportConfig.dateRange === 'custom' && (
            <>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={exportConfig.customStartDate}
                  onChange={(date) => setExportConfig({ 
                    ...exportConfig, 
                    customStartDate: date 
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={exportConfig.customEndDate}
                  onChange={(date) => setExportConfig({ 
                    ...exportConfig, 
                    customEndDate: date 
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Compression</InputLabel>
              <Select
                value={exportConfig.compression}
                onChange={(e) => setExportConfig({ 
                  ...exportConfig, 
                  compression: e.target.value 
                })}
                label="Compression"
              >
                <MenuItem value="none">No Compression</MenuItem>
                <MenuItem value="zip">ZIP Archive</MenuItem>
                <MenuItem value="rar">RAR Archive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password Protection"
              type="password"
              value={exportConfig.password}
              onChange={(e) => setExportConfig({ 
                ...exportConfig, 
                password: e.target.value 
              })}
              helperText="Optional password for file protection"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportConfig.watermark}
                  onChange={(e) => setExportConfig({ 
                    ...exportConfig, 
                    watermark: e.target.checked 
                  })}
                />
              }
              label="Add company watermark to exported files"
            />
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );

  const DeliveryStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Delivery & Scheduling
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email Recipients"
            value={exportConfig.recipients}
            onChange={(e) => setExportConfig({ 
              ...exportConfig, 
              recipients: e.target.value 
            })}
            placeholder="email1@example.com, email2@example.com"
            helperText="Comma-separated email addresses (optional)"
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Schedule Reports</InputLabel>
            <Select
              value={exportConfig.schedule}
              onChange={(e) => setExportConfig({ 
                ...exportConfig, 
                schedule: e.target.value 
              })}
              label="Schedule Reports"
            >
              <MenuItem value="none">One-time Export</MenuItem>
              <MenuItem value="recurring">Recurring Schedule</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {exportConfig.schedule === 'recurring' && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={exportConfig.scheduleFrequency}
                onChange={(e) => setExportConfig({ 
                  ...exportConfig, 
                  scheduleFrequency: e.target.value 
                })}
                label="Frequency"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      {/* Export Summary */}
      <Box sx={{ mt: 4, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Export Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><Assessment /></ListItemIcon>
            <ListItemText 
              primary={`Report Type: ${reportTypes[reportType] || reportType}`}
              secondary={`Format: ${exportConfig.format.toUpperCase()}`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><Settings /></ListItemIcon>
            <ListItemText 
              primary="Content"
              secondary={`Charts: ${exportConfig.includeCharts ? 'Yes' : 'No'}, Data: ${exportConfig.includeData ? 'Yes' : 'No'}`}
            />
          </ListItem>
          {exportConfig.recipients && (
            <ListItem>
              <ListItemIcon><Email /></ListItemIcon>
              <ListItemText 
                primary="Email Delivery"
                secondary={exportConfig.recipients}
              />
            </ListItem>
          )}
          {exportConfig.schedule !== 'none' && (
            <ListItem>
              <ListItemIcon><Schedule /></ListItemIcon>
              <ListItemText 
                primary="Scheduled"
                secondary={`${exportConfig.scheduleFrequency} reports`}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <FormatStep />;
      case 1:
        return <OptionsStep />;
      case 2:
        return <DeliveryStep />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FileDownload sx={{ mr: 1 }} />
          Export Report
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <FileDownload />}
          >
            {loading ? 'Exporting...' : 'Export Report'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportExporter;