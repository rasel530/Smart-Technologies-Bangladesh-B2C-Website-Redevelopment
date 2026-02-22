import React from 'react';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

interface CodFeeConfigProps {
  additionalFee: number;
  freeAboveAmount: number;
  onChange: (additionalFee: number, freeAboveAmount: number) => void;
  onSave?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const CodFeeConfig: React.FC<CodFeeConfigProps> = ({
  additionalFee,
  freeAboveAmount,
  onChange,
  onSave,
  loading = false,
  error = null
}) => {
  const [localAdditionalFee, setLocalAdditionalFee] = React.useState(additionalFee);
  const [localFreeAboveAmount, setLocalFreeAboveAmount] = React.useState(freeAboveAmount);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setLocalAdditionalFee(additionalFee);
    setLocalFreeAboveAmount(freeAboveAmount);
    setHasChanges(false);
  }, [additionalFee, freeAboveAmount]);

  const handleAdditionalFeeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalAdditionalFee(numValue);
      setHasChanges(true);
    }
  };

  const handleFreeAboveAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalFreeAboveAmount(numValue);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onChange(localAdditionalFee, localFreeAboveAmount);
    if (onSave) {
      onSave();
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalAdditionalFee(additionalFee);
    setLocalFreeAboveAmount(freeAboveAmount);
    setHasChanges(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          COD Fee Configuration
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Additional Fee */}
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Additional COD Fee
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={localAdditionalFee}
            onChange={(e) => handleAdditionalFeeChange(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
              inputProps: { min: 0, step: 10 }
            }}
            helperText="Additional fee charged for COD orders"
            disabled={loading}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Current: {formatCurrency(additionalFee)}
          </Typography>
        </Box>

        {/* Free Above Amount */}
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Free Above Amount
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={localFreeAboveAmount}
            onChange={(e) => handleFreeAboveAmountChange(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
              inputProps: { min: 0, step: 100 }
            }}
            helperText="Orders above this amount get free COD"
            disabled={loading}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Current: {formatCurrency(freeAboveAmount)}
          </Typography>
        </Box>
      </Box>

      {/* Fee Calculation Example */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Fee Calculation Example:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Order amount ≤ {formatCurrency(freeAboveAmount)}: Additional fee of {formatCurrency(localAdditionalFee)} applies
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Order amount above {formatCurrency(freeAboveAmount)}: No additional COD fee
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

export default CodFeeConfig;
