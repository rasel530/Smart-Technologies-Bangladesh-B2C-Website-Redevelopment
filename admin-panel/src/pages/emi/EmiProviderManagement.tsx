import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Pagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Switch,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';

interface EmiProvider {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  interestRate: number;
  createdAt: string;
  updatedAt: string;
  emiPlans: EmiPlan[];
}

interface EmiPlan {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

interface ProviderFormData {
  name: string;
  logoUrl: string;
  website: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  interestRate: number;
}

export const EmiProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<EmiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<EmiProvider | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    logoUrl: '',
    website: '',
    isActive: true,
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProviders();
  }, [page, searchQuery]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/v1/admin/emi/providers?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`
        : `/api/v1/admin/emi/providers?page=${page}&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data.providers);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      showSnackbar('Failed to fetch EMI providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    try {
      const response = await fetch('/api/v1/admin/emi/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('EMI provider created successfully', 'success');
        setDialogOpen(false);
        resetForm();
        fetchProviders();
      } else {
        showSnackbar(data.message || 'Failed to create provider', 'error');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      showSnackbar('Failed to create EMI provider', 'error');
    }
  };

  const handleUpdateProvider = async () => {
    if (!selectedProvider) return;

    try {
      const response = await fetch(`/api/v1/admin/emi/providers/${selectedProvider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('EMI provider updated successfully', 'success');
        setDialogOpen(false);
        resetForm();
        fetchProviders();
      } else {
        showSnackbar(data.message || 'Failed to update provider', 'error');
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      showSnackbar('Failed to update EMI provider', 'error');
    }
  };

  const handleDeleteProvider = async () => {
    if (!selectedProvider) return;

    try {
      const response = await fetch(`/api/v1/admin/emi/providers/${selectedProvider.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('EMI provider deleted successfully', 'success');
        setDeleteDialogOpen(false);
        setSelectedProvider(null);
        fetchProviders();
      } else {
        showSnackbar(data.message || 'Failed to delete provider', 'error');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      showSnackbar('Failed to delete EMI provider', 'error');
    }
  };

  const handleToggleStatus = async (provider: EmiProvider) => {
    try {
      const response = await fetch(`/api/v1/admin/emi/providers/${provider.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar(data.message, 'success');
        fetchProviders();
      } else {
        showSnackbar(data.message || 'Failed to toggle status', 'error');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showSnackbar('Failed to toggle provider status', 'error');
    }
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (provider: EmiProvider) => {
    setIsEditing(true);
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      logoUrl: provider.logoUrl || '',
      website: provider.website || '',
      isActive: provider.isActive,
      minAmount: provider.minAmount,
      maxAmount: provider.maxAmount,
      processingFee: provider.processingFee,
      interestRate: provider.interestRate,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logoUrl: '',
      website: '',
      isActive: true,
      minAmount: 5000,
      maxAmount: 500000,
      processingFee: 0,
      interestRate: 0,
    });
    setSelectedProvider(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        EMI Provider Management
      </Typography>

      {/* Search and Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search providers"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 300, flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchProviders}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Provider
        </Button>
      </Box>

      {/* Providers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Provider</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Min Amount</TableCell>
              <TableCell>Max Amount</TableCell>
              <TableCell>Processing Fee</TableCell>
              <TableCell>Interest Rate</TableCell>
              <TableCell>Plans</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No EMI providers found
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {provider.logoUrl && (
                        <img
                          src={provider.logoUrl}
                          alt={provider.name}
                          style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }}
                        />
                      )}
                      <Typography variant="body2">{provider.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {provider.website ? (
                      <Tooltip title={provider.website}>
                        <Button
                          size="small"
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit
                        </Button>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(provider.minAmount)}</TableCell>
                  <TableCell>{formatCurrency(provider.maxAmount)}</TableCell>
                  <TableCell>{formatCurrency(provider.processingFee)}</TableCell>
                  <TableCell>{provider.interestRate}%</TableCell>
                  <TableCell>
                    <Chip label={provider.emiPlans?.length || 0} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={provider.isActive ? 'Active' : 'Inactive'}
                      color={provider.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Toggle Status">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(provider)}
                      >
                        {provider.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(provider)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit EMI Provider' : 'Add EMI Provider'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Provider Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Logo URL"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Amount (BDT)"
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Amount (BDT)"
                type="number"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Processing Fee (BDT)"
                type="number"
                value={formData.processingFee}
                onChange={(e) => setFormData({ ...formData, processingFee: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Default Interest Rate (%)"
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Active</InputLabel>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={isEditing ? handleUpdateProvider : handleCreateProvider}
            variant="contained"
            disabled={!formData.name}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete "{selectedProvider?.name}"? This will also delete all associated EMI plans.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteProvider}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default EmiProviderManagement;
