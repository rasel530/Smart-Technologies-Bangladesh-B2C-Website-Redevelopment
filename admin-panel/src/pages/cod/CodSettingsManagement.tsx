import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, Switch, FormControlLabel, TextField } from '@mui/material';
import { Refresh as RefreshIcon, Save as SaveIcon } from '@mui/icons-material';
import { CodSettings, COD_CONSTANTS } from '@/types/cod';
import { CodDivisionSelector } from '@/components/cod/CodDivisionSelector';
import { CodFeeConfig } from '@/components/cod/CodFeeConfig';
import { CodLimitConfig } from '@/components/cod/CodLimitConfig';

export const CodSettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<CodSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<Partial<CodSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/admin/cod/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setSettings(data.data);
        setLocalSettings(data.data);
        setHasChanges(false);
      } else {
        setError('Failed to fetch COD settings');
      }
    } catch (err) {
      console.error('Error fetching COD settings:', err);
      setError('Failed to fetch COD settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings || !localSettings) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/v1/admin/cod/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(localSettings),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setLocalSettings(data.data);
        setHasChanges(false);
        setSaving(false);
        setError(null);
      } else {
        setSaving(false);
        setError(data.message || 'Failed to save COD settings');
      }
    } catch (err) {
      console.error('Error saving COD settings:', err);
      setSaving(false);
      setError('Failed to save COD settings');
    }
  };

  const handleFieldChange = (field: keyof CodSettings, value: any) => {
    setLocalSettings((prev: Partial<CodSettings>) => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          COD Settings Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !settings && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Settings Form */}
      {settings && localSettings && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* General Settings */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* COD Status */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.isEnabled ?? settings.isEnabled}
                      onChange={(e) => handleFieldChange('isEnabled', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Enable COD"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', ml: 4 }}>
                  Current: {settings.isEnabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>

              {/* Delivery Days */}
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Delivery Days
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={localSettings.deliveryDays ?? settings.deliveryDays}
                  onChange={(e) => handleFieldChange('deliveryDays', parseInt(e.target.value))}
                  InputProps={{
                    inputProps: { min: 1, step: 1 }
                  }}
                  helperText="Estimated delivery time"
                  disabled={saving}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Current: {settings.deliveryDays} days
                </Typography>
              </Box>

              {/* Minimum Amount */}
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Minimum Order Amount
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={localSettings.minAmount ?? settings.minAmount}
                  onChange={(e) => handleFieldChange('minAmount', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                    inputProps: { min: 0, step: 100 }
                  }}
                  helperText="Minimum order amount for COD"
                  disabled={saving}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Current: {formatCurrency(settings.minAmount)}
                </Typography>
              </Box>

              {/* Maximum Amount */}
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Maximum Order Amount
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={localSettings.maxAmount ?? settings.maxAmount}
                  onChange={(e) => handleFieldChange('maxAmount', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                    inputProps: { min: 0, step: 1000 }
                  }}
                  helperText="Maximum order amount for COD"
                  disabled={saving}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Current: {formatCurrency(settings.maxAmount)}
                </Typography>
              </Box>
            </Box>

            {/* Verification Settings */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Verification Requirements
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.requirePhoneVerification ?? settings.requirePhoneVerification}
                      onChange={(e) => handleFieldChange('requirePhoneVerification', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Require Phone Verification"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.requireAddressVerification ?? settings.requireAddressVerification}
                      onChange={(e) => handleFieldChange('requireAddressVerification', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Require Address Verification"
                />
              </Box>
            </Box>

            {/* Notes */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={localSettings.notes ?? (settings.notes || '')}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                helperText="Additional notes about COD settings"
                disabled={saving}
              />
            </Box>
          </Paper>

          {/* Fee Configuration */}
          <CodFeeConfig
            additionalFee={settings.additionalFee}
            freeAboveAmount={settings.freeAboveAmount}
            onChange={(additionalFee: number, freeAboveAmount: number) => {
              handleFieldChange('additionalFee', additionalFee);
              handleFieldChange('freeAboveAmount', freeAboveAmount);
            }}
            loading={saving}
            error={error}
          />

          {/* Limit Configuration */}
          <CodLimitConfig
            maxDailyOrders={settings.maxDailyOrders}
            maxWeeklyOrders={settings.maxWeeklyOrders}
            deliveryDays={settings.deliveryDays}
            onChange={(maxDailyOrders: number, maxWeeklyOrders: number, deliveryDays: number) => {
              handleFieldChange('maxDailyOrders', maxDailyOrders);
              handleFieldChange('maxWeeklyOrders', maxWeeklyOrders);
              handleFieldChange('deliveryDays', deliveryDays);
            }}
            loading={saving}
            error={error}
          />

          {/* Division Settings */}
          <CodDivisionSelector
            availableDivisions={settings.availableDivisions || []}
            unavailableDivisions={settings.unavailableDivisions || []}
            onChange={(available: string[], unavailable: string[]) => {
              handleFieldChange('availableDivisions', available);
              handleFieldChange('unavailableDivisions', unavailable);
            }}
          />

          {/* Timestamps */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Timestamps
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {new Date(settings.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(settings.updatedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default CodSettingsManagement;
