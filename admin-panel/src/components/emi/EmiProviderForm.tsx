import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Switch,
  Typography,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface EmiProviderFormProps {
  formData: {
    name: string;
    logoUrl: string;
    website: string;
    isActive: boolean;
    minAmount: number;
    maxAmount: number;
    processingFee: number;
    interestRate: number;
  };
  onChange: (field: string, value: any) => void;
  isEditing?: boolean;
}

export const EmiProviderForm: React.FC<EmiProviderFormProps> = ({
  formData,
  onChange,
  isEditing = false,
}) => {
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to a server
      // and get back the URL. For now, we'll just set a placeholder.
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    onChange('logoUrl', '');
  };

  return (
    <Box>
      {/* Logo Upload */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar
          src={formData.logoUrl || undefined}
          alt={formData.name}
          sx={{ width: 80, height: 80 }}
          variant="square"
        >
          {formData.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="logo-upload"
            type="file"
            onChange={handleLogoUpload}
          />
          <label htmlFor="logo-upload">
            <IconButton component="span" color="primary">
              <CloudUploadIcon />
            </IconButton>
          </label>
          {formData.logoUrl && (
            <IconButton onClick={handleLogoRemove} color="error">
              <DeleteIcon />
            </IconButton>
          )}
          <Typography variant="caption" display="block" color="textSecondary">
            Upload provider logo
          </Typography>
        </Box>
      </Box>

      {/* Provider Name */}
      <TextField
        fullWidth
        label="Provider Name"
        value={formData.name}
        onChange={(e) => onChange('name', e.target.value)}
        required
        error={!formData.name}
        helperText={!formData.name ? 'Provider name is required' : ''}
        sx={{ mb: 2 }}
      />

      {/* Website */}
      <TextField
        fullWidth
        label="Website"
        value={formData.website}
        onChange={(e) => onChange('website', e.target.value)}
        placeholder="https://example.com"
        type="url"
        sx={{ mb: 2 }}
      />

      {/* Amount and Fee Row */}
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

      {/* Fee and Interest Rate Row */}
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
          label="Default Interest Rate (%)"
          type="number"
          value={formData.interestRate}
          onChange={(e) => onChange('interestRate', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, max: 30, step: 0.5 }}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>

      {/* Active Status */}
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
  );
};

export default EmiProviderForm;
