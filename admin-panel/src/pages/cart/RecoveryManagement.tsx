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
  MenuItem,
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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AbandonedCart {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  itemCount: number;
  total: number;
  abandonedAt: string;
  reminderCount: number;
  recoveryAttempts: number;
  preview: Array<{
    productName: string;
    quantity: number;
  }>;
}

interface RecoveryStats {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  totalRevenue: number;
}

export const RecoveryManagement: React.FC = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('recovery');
  const [discountCode, setDiscountCode] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [stats, setStats] = useState<RecoveryStats>({
    totalAbandoned: 0,
    totalRecovered: 0,
    recoveryRate: 0,
    totalRevenue: 0,
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCarts();
    fetchStats();
  }, [page]);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/cart/abandoned?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setCarts(data.data.carts);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching carts:', error);
      showSnackbar('Failed to fetch abandoned carts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/v1/cart/recovery/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalAbandoned: data.data.summary.totalAbandoned,
          totalRecovered: data.data.summary.totalRecovered,
          recoveryRate: data.data.summary.recoveryRate,
          totalRevenue: data.data.summary.recoveredRevenue,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSendRecovery = async () => {
    if (!selectedCart) return;

    try {
      const response = await fetch(`/api/v1/cart/recovery/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartId: selectedCart.id,
          template: emailTemplate,
          discountCode: discountCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar('Recovery email sent successfully', 'success');
        setDialogOpen(false);
        fetchCarts();
      } else {
        showSnackbar(data.error || 'Failed to send recovery email', 'error');
      }
    } catch (error) {
      console.error('Error sending recovery:', error);
      showSnackbar('Failed to send recovery email', 'error');
    }
  };

  const handleBulkRecover = async (cartIds: string[]) => {
    try {
      const response = await fetch(`/api/v1/cart/recovery/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartIds,
          template: 'recovery',
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSnackbar(`Recovery emails sent: ${data.data.successful}`, 'success');
        fetchCarts();
      }
    } catch (error) {
      console.error('Error in bulk recovery:', error);
      showSnackbar('Failed to send bulk recovery emails', 'error');
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysAbandoned = (abandonedAt: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(abandonedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cart Recovery Management
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Abandoned
                </Typography>
                <Typography variant="h4">{stats.totalAbandoned}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recovered
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.totalRecovered}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recovery Rate
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.recoveryRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recovered Revenue
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCarts}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={() => {
              const cartIds = carts.map(c => c.id);
              handleBulkRecover(cartIds);
            }}
            disabled={carts.length === 0}
          >
            Send Bulk Recovery
          </Button>
        </Box>

        {/* Carts Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cart ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Abandoned</TableCell>
                <TableCell>Reminders</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : carts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No abandoned carts found
                  </TableCell>
                </TableRow>
              ) : (
                carts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>{cart.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      {cart.user ? (
                        <Box>
                          <Typography variant="body2">
                            {cart.user.firstName} {cart.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {cart.user.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip label="Guest" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={cart.preview.map(p => `${p.productName} (x${p.quantity})`).join(', ')}>
                        <Chip
                          icon={<CartIcon />}
                          label={`${cart.itemCount} items`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{formatCurrency(cart.total)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(cart.abandonedAt)}
                        </Typography>
                        <Chip
                          label={`${getDaysAbandoned(cart.abandonedAt)} days ago`}
                          size="small"
                          color={getDaysAbandoned(cart.abandonedAt) > 7 ? 'error' : 'default'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cart.reminderCount}
                        color={cart.reminderCount > 0 ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedCart(cart);
                          setDialogOpen(true);
                        }}
                      >
                        <SendIcon />
                      </IconButton>
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

        {/* Send Recovery Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Send Recovery Email</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Email Template</InputLabel>
                <Select
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  label="Email Template"
                >
                  <MenuItem value="recovery">Recovery (Initial)</MenuItem>
                  <MenuItem value="reminder">Reminder (24h)</MenuItem>
                  <MenuItem value="final">Final Reminder (72h)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Discount Code (Optional)"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="e.g., RECOVER10"
                helperText="Add a discount code to incentivize recovery"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendRecovery}
              variant="contained"
              startIcon={<SendIcon />}
            >
              Send Email
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
    </LocalizationProvider>
  );
};

export default RecoveryManagement;
