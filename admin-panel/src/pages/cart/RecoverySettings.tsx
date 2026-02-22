import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Info as InfoIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';

interface RecoverySettingsData {
  enabled: boolean;
  firstReminderHours: number;
  secondReminderHours: number;
  finalReminderHours: number;
  discountEnabled: boolean;
  firstDiscountPercent: number;
  secondDiscountPercent: number;
  finalDiscountPercent: number;
  minCartValue: number;
  maxRemindersPerCart: number;
  emailTemplate: string;
  senderName: string;
  senderEmail: string;
}

const defaultSettings: RecoverySettingsData = {
  enabled: true,
  firstReminderHours: 24,
  secondReminderHours: 72,
  finalReminderHours: 168,
  discountEnabled: true,
  firstDiscountPercent: 5,
  secondDiscountPercent: 10,
  finalDiscountPercent: 15,
  minCartValue: 500,
  maxRemindersPerCart: 3,
  emailTemplate: 'bilingual',
  senderName: 'Smart Technologies Bangladesh',
  senderEmail: 'noreply@smarttechnologiesbd.com',
};

export const RecoverySettings: React.FC = () => {
  const [settings, setSettings] = useState<RecoverySettingsData>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // In a real implementation, fetch from API
      // For now, use default settings
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // In a real implementation, save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSnackbar('Settings saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    showSnackbar('Settings reset to defaults', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (field: keyof RecoverySettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cart Recovery Settings
      </Typography>

      {/* Enable/Disable */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Enable Cart Recovery</Typography>
            <Typography variant="body2" color="textSecondary">
              Turn on automatic cart recovery emails
            </Typography>
          </Box>
          <Switch
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
          />
        </Box>
      </Paper>

      {/* Reminder Intervals */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Reminder Schedule
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure when recovery emails are sent after cart abandonment
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>
              First Reminder
              <Tooltip title="First recovery email sent after cart abandonment">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={settings.firstReminderHours}
              onChange={(e, value) => handleChange('firstReminderHours', value)}
              min={1}
              max={48}
              step={1}
              marks={[
                { value: 1, label: '1h' },
                { value: 24, label: '24h' },
                { value: 48, label: '48h' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}h`}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              {settings.firstReminderHours} hours after abandonment
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography gutterBottom>
              Second Reminder
              <Tooltip title="Second recovery email with higher discount">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={settings.secondReminderHours}
              onChange={(e, value) => handleChange('secondReminderHours', value)}
              min={24}
              max={96}
              step={4}
              marks={[
                { value: 24, label: '24h' },
                { value: 48, label: '48h' },
                { value: 72, label: '72h' },
                { value: 96, label: '96h' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}h`}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              {settings.secondReminderHours} hours after abandonment
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography gutterBottom>
              Final Reminder
              <Tooltip title="Final recovery email with maximum discount">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={settings.finalReminderHours}
              onChange={(e, value) => handleChange('finalReminderHours', value)}
              min={72}
              max={336}
              step={12}
              marks={[
                { value: 72, label: '3d' },
                { value: 168, label: '7d' },
                { value: 336, label: '14d' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v / 24)}d`}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              {Math.round(settings.finalReminderHours / 24)} days after abandonment
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Discount Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Discount Codes</Typography>
          <Switch
            checked={settings.discountEnabled}
            onChange={(e) => handleChange('discountEnabled', e.target.checked)}
          />
        </Box>

        {settings.discountEnabled && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="First Discount %"
                type="number"
                value={settings.firstDiscountPercent}
                onChange={(e) => handleChange('firstDiscountPercent', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
                helperText="Applied on first reminder"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Second Discount %"
                type="number"
                value={settings.secondDiscountPercent}
                onChange={(e) => handleChange('secondDiscountPercent', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
                helperText="Applied on second reminder"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Final Discount %"
                type="number"
                value={settings.finalDiscountPercent}
                onChange={(e) => handleChange('finalDiscountPercent', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
                helperText="Applied on final reminder"
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* General Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Cart Value (BDT)"
              type="number"
              value={settings.minCartValue}
              onChange={(e) => handleChange('minCartValue', parseInt(e.target.value))}
              helperText="Only recover carts with value above this amount"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Reminders Per Cart"
              type="number"
              value={settings.maxRemindersPerCart}
              onChange={(e) => handleChange('maxRemindersPerCart', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 5 }}
              helperText="Maximum number of recovery emails per cart"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Email Template</InputLabel>
              <Select
                value={settings.emailTemplate}
                onChange={(e) => handleChange('emailTemplate', e.target.value)}
                label="Email Template"
              >
                <MenuItem value="bilingual">Bilingual (EN/BN)</MenuItem>
                <MenuItem value="english">English Only</MenuItem>
                <MenuItem value="bangla">Bangla Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sender Name"
              value={settings.senderName}
              onChange={(e) => handleChange('senderName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sender Email"
              type="email"
              value={settings.senderEmail}
              onChange={(e) => handleChange('senderEmail', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          size="large"
        >
          Reset to Defaults
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RecoverySettings;
