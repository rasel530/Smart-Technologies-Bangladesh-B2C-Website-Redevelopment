import React from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

interface CodLimitConfigProps {
  maxDailyOrders: number;
  maxWeeklyOrders: number;
  deliveryDays: number;
  onChange: (maxDailyOrders: number, maxWeeklyOrders: number, deliveryDays: number) => void;
  onSave?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const CodLimitConfig: React.FC<CodLimitConfigProps> = ({
  maxDailyOrders,
  maxWeeklyOrders,
  deliveryDays,
  onChange,
  onSave,
  loading = false,
  error = null
}) => {
  const [localMaxDailyOrders, setLocalMaxDailyOrders] = React.useState(maxDailyOrders);
  const [localMaxWeeklyOrders, setLocalMaxWeeklyOrders] = React.useState(maxWeeklyOrders);
  const [localDeliveryDays, setLocalDeliveryDays] = React.useState(deliveryDays);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setLocalMaxDailyOrders(maxDailyOrders);
    setLocalMaxWeeklyOrders(maxWeeklyOrders);
    setLocalDeliveryDays(deliveryDays);
    setHasChanges(false);
  }, [maxDailyOrders, maxWeeklyOrders, deliveryDays]);

  const handleMaxDailyOrdersChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setLocalMaxDailyOrders(numValue);
      setHasChanges(true);
    }
  };

  const handleMaxWeeklyOrdersChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setLocalMaxWeeklyOrders(numValue);
      setHasChanges(true);
    }
  };

  const handleDeliveryDaysChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setLocalDeliveryDays(numValue);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onChange(localMaxDailyOrders, localMaxWeeklyOrders, localDeliveryDays);
    if (onSave) {
      onSave();
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalMaxDailyOrders(maxDailyOrders);
    setLocalMaxWeeklyOrders(maxWeeklyOrders);
    setLocalDeliveryDays(deliveryDays);
    setHasChanges(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          COD Limit Configuration
        </Typography>
        {hasChanges && (
          <Alert severity="info" sx={{ py: 0, px: 2 }}>
            Unsaved changes
          </Alert>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
        {/* Max Daily Orders */}
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Maximum Daily Orders
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={localMaxDailyOrders}
            onChange={(e) => handleMaxDailyOrdersChange(e.target.value)}
            InputProps={{
              inputProps: { min: 1, step: 1 }
            }}
            helperText="Maximum COD orders per user per day"
            disabled={loading}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Current: {maxDailyOrders} orders/day
          </Typography>
        </Box>

        {/* Max Weekly Orders */}
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Maximum Weekly Orders
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={localMaxWeeklyOrders}
            onChange={(e) => handleMaxWeeklyOrdersChange(e.target.value)}
            InputProps={{
              inputProps: { min: 1, step: 1 }
            }}
            helperText="Maximum COD orders per user per week"
            disabled={loading}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Current: {maxWeeklyOrders} orders/week
          </Typography>
        </Box>

        {/* Delivery Days */}
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Estimated Delivery Days
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={localDeliveryDays}
            onChange={(e) => handleDeliveryDaysChange(e.target.value)}
            InputProps={{
              inputProps: { min: 1, step: 1 }
            }}
            helperText="Estimated delivery time for COD orders"
            disabled={loading}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Current: {deliveryDays} days
          </Typography>
        </Box>
      </Box>

      {/* Limit Information */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Order Limits Information:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Daily limit applies from 12:00 AM to 11:59 PM (local time)
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Weekly limit applies from Monday to Sunday
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Limits are reset automatically at the start of each period
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Users will be notified when approaching limits
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {hasChanges && (
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CodLimitConfig;
