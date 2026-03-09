/**
 * Payment Gateway Configuration Component
 *
 * This component displays and manages payment gateway configurations including
 * enabling/disabling gateways, test mode toggles, API credentials management,
 * webhook URLs, and connection testing.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Save as SaveIcon,
  Science as TestIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useGatewaySettings } from '@/hooks/useAdminPayments';
import type { GatewaySettings } from '@/types/payment';
import { PAYMENT_CONSTANTS, GatewayType } from '@/types/payment';

interface PaymentGatewayConfigProps {
  gateway?: GatewayType;
}

export const PaymentGatewayConfig: React.FC<PaymentGatewayConfigProps> = ({
  gateway
}) => {
  const [expandedGateway, setExpandedGateway] = useState<string | false>(gateway || false);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [localSettings, setLocalSettings] = useState<Record<string, Partial<GatewaySettings>>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  const { settings, isLoading, isUpdating, error, refetch, updateSettings, testConnection } = useGatewaySettings();

  const handleToggleCredentials = (gatewayKey: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [gatewayKey]: !prev[gatewayKey]
    }));
  };

  const handleFieldChange = (gatewayKey: string, field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [gatewayKey]: {
        ...(prev[gatewayKey] || {}),
        [field]: value
      }
    }));
    setHasChanges(prev => ({
      ...prev,
      [gatewayKey]: true
    }));
  };

  const handleSaveSettings = async (gatewayKey: string) => {
    const gatewaySettings = settings.find(s => s.gateway === gatewayKey);
    if (!gatewaySettings || !localSettings[gatewayKey]) return;

    const updatedSettings = {
      ...gatewaySettings,
      ...localSettings[gatewayKey]
    };

    const result = await updateSettings(gatewayKey, updatedSettings);

    if (result) {
      setLocalSettings(prev => ({
        ...prev,
        [gatewayKey]: {}
      }));
      setHasChanges(prev => ({
        ...prev,
        [gatewayKey]: false
      }));
    }
  };

  const handleResetSettings = (gatewayKey: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [gatewayKey]: {}
    }));
    setHasChanges(prev => ({
      ...prev,
      [gatewayKey]: false
    }));
  };

  const handleTestConnection = async (gatewayKey: string) => {
    const result = await testConnection(gatewayKey);
    setTestResults(prev => ({
      ...prev,
      [gatewayKey]: result
    }));
  };

  const maskValue = (value: string, show: boolean): string => {
    if (!value) return '';
    if (show) return value;
    return '••••••••••••';
  };

  const getGatewayFields = (gatewayType: GatewayType): Array<{ key: string; label: string; type?: string }> => {
    const fields: Record<GatewayType, Array<{ key: string; label: string; type?: string }>> = {
      [GatewayType.SSLCOMMERZ]: [
        { key: 'storeId', label: 'Store ID' },
        { key: 'storePassword', label: 'Store Password', type: 'password' },
        { key: 'sessionId', label: 'Session ID' }
      ],
      [GatewayType.BKASH]: [
        { key: 'appKey', label: 'App Key' },
        { key: 'appSecret', label: 'App Secret', type: 'password' },
        { key: 'username', label: 'Username' },
        { key: 'password', label: 'Password', type: 'password' }
      ],
      [GatewayType.NAGAD]: [
        { key: 'merchantId', label: 'Merchant ID' },
        { key: 'appKey', label: 'App Key' },
        { key: 'appSecret', label: 'App Secret', type: 'password' }
      ]
    };
    return fields[gatewayType] || [];
  };

  if (isLoading && !settings.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Payment Gateway Configuration
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refetch}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Gateway List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {settings.map((gatewaySetting) => {
          const gatewayKey = gatewaySetting.gateway;
          const isExpanded = expandedGateway === gatewayKey;
          const hasLocalChanges = hasChanges[gatewayKey];
          const testResult = testResults[gatewayKey];
          const localConfig = localSettings[gatewayKey] || {};

          return (
            <Accordion
              key={gatewayKey}
              expanded={isExpanded}
              onChange={(_, expanded) => setExpandedGateway(expanded ? gatewayKey : false)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Typography variant="h6">
                    {PAYMENT_CONSTANTS.GATEWAY_NAMES[gatewayKey]}
                  </Typography>
                  <Chip
                    label={gatewaySetting.isActive ? 'Active' : 'Inactive'}
                    color={gatewaySetting.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  {gatewaySetting.isTestMode && (
                    <Chip
                      label="Test Mode"
                      color="warning"
                      size="small"
                    />
                  )}
                  {hasLocalChanges && (
                    <Chip
                      label="Unsaved Changes"
                      color="info"
                      size="small"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Status Settings */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Status
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localConfig.isActive !== undefined ? localConfig.isActive : gatewaySetting.isActive}
                            onChange={(e) => handleFieldChange(gatewayKey, 'isActive', e.target.checked)}
                            disabled={isUpdating}
                          />
                        }
                        label="Enable Gateway"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localConfig.isTestMode !== undefined ? localConfig.isTestMode : gatewaySetting.isTestMode}
                            onChange={(e) => handleFieldChange(gatewayKey, 'isTestMode', e.target.checked)}
                            disabled={isUpdating}
                          />
                        }
                        label="Test Mode"
                      />
                    </Box>
                  </Box>

                  <Divider />

                  {/* API Credentials */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      API Credentials
                    </Typography>
                    <Grid container spacing={2}>
                      {getGatewayFields(gatewayKey).map((field) => (
                        <Grid item xs={12} md={6} key={field.key}>
                          <TextField
                            fullWidth
                            label={field.label}
                            type={showCredentials[gatewayKey] || field.type !== 'password' ? 'text' : 'password'}
                            value={
                              localConfig.config?.[field.key] !== undefined
                                ? localConfig.config[field.key]
                                : gatewaySetting.config[field.key] || ''
                            }
                            onChange={(e) => handleFieldChange(gatewayKey, 'config', {
                              ...(localConfig.config || {}),
                              [field.key]: e.target.value
                            })}
                            InputProps={{
                              endAdornment: field.type === 'password' && (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => handleToggleCredentials(gatewayKey)}
                                    edge="end"
                                  >
                                    {showCredentials[gatewayKey] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                            disabled={isUpdating}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Webhook URL */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Webhook URL
                    </Typography>
                    <TextField
                      fullWidth
                      value={
                        localConfig.webhookUrl !== undefined
                          ? localConfig.webhookUrl
                          : gatewaySetting.webhookUrl || ''
                      }
                      onChange={(e) => handleFieldChange(gatewayKey, 'webhookUrl', e.target.value)}
                      placeholder="https://yourdomain.com/api/v1/payments/callback/{gateway}"
                      disabled={isUpdating}
                      helperText="This URL will receive payment callbacks from the gateway"
                    />
                  </Box>

                  <Divider />

                  {/* Connection Test */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Connection Test
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<TestIcon />}
                        onClick={() => handleTestConnection(gatewayKey)}
                        disabled={isUpdating}
                      >
                        Test Connection
                      </Button>
                      {testResult && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {testResult.success ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                          <Typography variant="body2" color={testResult.success ? 'success.main' : 'error.main'}>
                            {testResult.message}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Divider />

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {hasLocalChanges && (
                      <Button
                        variant="outlined"
                        onClick={() => handleResetSettings(gatewayKey)}
                        disabled={isUpdating}
                      >
                        Reset
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSettings(gatewayKey)}
                      disabled={!hasLocalChanges || isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>

                  {/* Timestamps */}
                  <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Created: {new Date(gatewaySetting.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Last Updated: {new Date(gatewaySetting.updatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default PaymentGatewayConfig;
