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
  Select,
  MenuItem,
  Switch,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';

interface EmiProvider {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
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
  provider: EmiProvider;
}

interface PlanFormData {
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
}

export const EmiPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<EmiPlan[]>([]);
  const [providers, setProviders] = useState<EmiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<EmiPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>({
    providerId: '',
    name: '',
    duration: 12,
    interestRate: 12,
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    downPayment: 0,
    isActive: true,
    displayOrder: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPlans();
    fetchProviders();
  }, [page, searchQuery, providerFilter]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/admin/emi/plans?page=${page}&limit=10`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (providerFilter) {
        url += `&providerId=${providerFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data.plans);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      showSnackbar('Failed to fetch EMI plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/v1/admin/emi/providers?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const response = await fetch('/api/v1/admin/emi/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('EMI plan created successfully', 'success');
        setDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        showSnackbar(data.message || 'Failed to create plan', 'error');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      showSnackbar('Failed to create EMI plan', 'error');
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/v1/admin/emi/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('EMI plan updated successfully', 'success');
        setDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        showSnackbar(data.message || 'Failed to update plan', 'error');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      showSnackbar('Failed to update EMI plan', 'error');
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/v1/admin/emi/plans/${selectedPlan.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('EMI plan deleted successfully', 'success');
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        showSnackbar(data.message || 'Failed to delete plan', 'error');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      showSnackbar('Failed to delete EMI plan', 'error');
    }
  };

  const handleToggleStatus = async (plan: EmiPlan) => {
    try {
      const response = await fetch(`/api/v1/admin/emi/plans/${plan.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar(data.message, 'success');
        fetchPlans();
      } else {
        showSnackbar(data.message || 'Failed to toggle status', 'error');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showSnackbar('Failed to toggle plan status', 'error');
    }
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (plan: EmiPlan) => {
    setIsEditing(true);
    setSelectedPlan(plan);
    setFormData({
      providerId: plan.providerId,
      name: plan.name,
      duration: plan.duration,
      interestRate: plan.interestRate,
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      processingFee: plan.processingFee,
      downPayment: plan.downPayment,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      providerId: '',
      name: '',
      duration: 12,
      interestRate: 12,
      minAmount: 5000,
      maxAmount: 500000,
      processingFee: 0,
      downPayment: 0,
      isActive: true,
      displayOrder: 0,
    });
    setSelectedPlan(null);
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

  const getInterestRateColor = (rate: number) => {
    if (rate === 0) return 'success';
    if (rate < 5) return 'success';
    if (rate < 10) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        EMI Plan Management
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search plans"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 250, flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Provider</InputLabel>
          <Select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            label="Filter by Provider"
          >
            <MenuItem value="">All Providers</MenuItem>
            {providers.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                {provider.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPlans}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Plan
        </Button>
      </Box>

      {/* Plans Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plan</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Interest Rate</TableCell>
              <TableCell>Min Amount</TableCell>
              <TableCell>Max Amount</TableCell>
              <TableCell>Processing Fee</TableCell>
              <TableCell>Down Payment</TableCell>
              <TableCell>Display Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No EMI plans found
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {plan.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {plan.provider.logoUrl && (
                        <img
                          src={plan.provider.logoUrl}
                          alt={plan.provider.name}
                          style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }}
                        />
                      )}
                      <Typography variant="body2">{plan.provider.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{plan.duration} months</TableCell>
                  <TableCell>
                    <Chip
                      label={`${plan.interestRate}%`}
                      color={getInterestRateColor(plan.interestRate) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(plan.minAmount)}</TableCell>
                  <TableCell>{formatCurrency(plan.maxAmount)}</TableCell>
                  <TableCell>{formatCurrency(plan.processingFee)}</TableCell>
                  <TableCell>{formatCurrency(plan.downPayment)}</TableCell>
                  <TableCell>{plan.displayOrder}</TableCell>
                  <TableCell>
                    <Chip
                      label={plan.isActive ? 'Active' : 'Inactive'}
                      color={plan.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Toggle Status">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(plan)}
                      >
                        {plan.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(plan)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedPlan(plan);
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
        <DialogTitle>{isEditing ? 'Edit EMI Plan' : 'Add EMI Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Duration (months)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Interest Rate (%)"
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                required
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
                label="Down Payment (BDT)"
                type="number"
                value={formData.downPayment}
                onChange={(e) => setFormData({ ...formData, downPayment: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
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
            onClick={isEditing ? handleUpdatePlan : handleCreatePlan}
            variant="contained"
            disabled={!formData.name || !formData.providerId}
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
            Are you sure you want to delete "{selectedPlan?.name}"?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeletePlan}
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

export default EmiPlanManagement;
