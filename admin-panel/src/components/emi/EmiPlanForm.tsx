import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Typography,
} from '@mui/material';

interface EmiProvider {
  id: string;
  name: string;
  isActive: boolean;
}

interface EmiPlanFormProps {
  formData: {
    providerId: string;
    name: string;
    duration: number;
    interestRate: number;
    minAmount: number;
    maxAmount: number;
    processingFee: number;
    downPayment: number;
    isActive: boolean;
    displayOrder: number;
  };
  providers: EmiProvider[];
  onChange: (field: string, value: any) => void;
  isEditing?: boolean;
}

export const EmiPlanForm: React.FC<EmiPlanFormProps> = ({
  formData,
  providers,
  onChange,
  isEditing = false,
}) => {
  return (
    <Box>
      {/* Provider Selection */}
      <FormControl fullWidth required sx={{ mb: 2 }}>
        <InputLabel>Provider</InputLabel>
        <Select
          value={formData.providerId}
          onChange={(e) => onChange('providerId', e.target.value)}
          label="Provider"
          disabled={isEditing}
        >
          {providers.map((provider) => (
            <MenuItem key={provider.id} value={provider.id}>
              {provider.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Plan Name */}
      <TextField
        fullWidth
        label="Plan Name"
        value={formData.name}
        onChange={(e) => onChange('name', e.target.value)}
        required
        error={!formData.name}
        helperText={!formData.name ? 'Plan name is required' : ''}
        sx={{ mb: 2 }}
      />

      {/* Duration and Interest Rate Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Duration (months)"
          type="number"
          value={formData.duration}
          onChange={(e) => onChange('duration', parseInt(e.target.value) || 0)}
          required
          inputProps={{ min: 1, max: 60 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Interest Rate (%)"
          type="number"
          value={formData.interestRate}
          onChange={(e) => onChange('interestRate', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ min: 0, max: 30, step: 0.5 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>

      {/* Min and Max Amount Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Min Amount (BDT)"
          type="number"
          value={formData.minAmount}
          onChange={(e) => onChange('minAmount', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ min: 0, step: 1000 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Max Amount (BDT)"
          type="number"
          value={formData.maxAmount}
          onChange={(e) => onChange('maxAmount', parseFloat(e.target.value) || 0)}
          required
          inputProps={{ min: 0, step: 1000 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>

      {/* Processing Fee and Down Payment Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Processing Fee (BDT)"
          type="number"
          value={formData.processingFee}
          onChange={(e) => onChange('processingFee', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, step: 100 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Down Payment (BDT)"
          type="number"
          value={formData.downPayment}
          onChange={(e) => onChange('downPayment', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, step: 100 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>

      {/* Display Order and Active Status Row */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Display Order"
          type="number"
          value={formData.displayOrder}
          onChange={(e) => onChange('displayOrder', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={formData.isActive}
              onChange={(e) => onChange('isActive', e.target.checked)}
            />
            <Typography variant="body2">Active</Typography>
          </Box>
        </FormControl>
      </Box>
    </Box>
  );
};

export default EmiPlanForm;
