'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

interface ProductReservation {
  productId: string;
  productName: string;
  productSku: string;
  totalStock: number;
  lowStockThreshold: number;
  reservedStock: number;
  availableStock: number;
  status: 'normal' | 'low_stock' | 'out_of_stock';
  cartBreakdown: CartBreakdown[];
}

interface CartBreakdown {
  cartId: string;
  cartItemId: string;
  quantity: number;
  reservationStatus: string;
  createdAt: string;
  expiresAt: string;
  cartStatus: string;
  userEmail: string | null;
  userName: string;
}

interface InventoryImpactResponse {
  success: boolean;
  data: {
    products: ProductReservation[];
    summary: {
      totalProducts: number;
      lowStockCount: number;
      outOfStockCount: number;
      totalReservedQuantity: number;
      normalStockCount: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface InventoryImpactProps {
  onViewProduct?: (productId: string) => void;
  onViewCart?: (cartId: string) => void;
}

const InventoryImpact: React.FC<InventoryImpactProps> = ({
  onViewProduct,
  onViewCart
}) => {
  const [products, setProducts] = useState<ProductReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalReservedQuantity: 0,
    normalStockCount: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [cartDetailsOpen, setCartDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductReservation | null>(null);
  const [cartDetails, setCartDetails] = useState<CartBreakdown[]>([]);
  const [cartDetailsLoading, setCartDetailsLoading] = useState(false);

  // Release dialog
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [releasing, setReleasing] = useState(false);

  const fetchInventoryImpact = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (statusFilter !== 'all') {
        params.append('statusFilter', statusFilter);
      }
      
      if (lowStockOnly) {
        params.append('lowStockOnly', 'true');
      }
      
      const response = await fetch(`/api/v1/admin/carts/inventory-impact?${params.toString()}`);
      const data: InventoryImpactResponse = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setSummary(data.data.summary);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
      } else {
        setError(data.error || 'Failed to fetch inventory impact');
      }
    } catch (err) {
      setError('Error fetching inventory impact: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, lowStockOnly]);

  useEffect(() => {
    fetchInventoryImpact();
  }, [fetchInventoryImpact]);

  const handleRefresh = () => {
    fetchInventoryImpact();
  };

  const handleViewCarts = (product: ProductReservation) => {
    setSelectedProduct(product);
    setCartDetails(product.cartBreakdown);
    setCartDetailsOpen(true);
  };

  const handleReleaseReservation = async (cartId: string) => {
    setReleasing(true);
    try {
      const response = await fetch(`/api/v1/admin/carts/inventory-impact/release-by-cart/${cartId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: 'current-admin-id', // Should be from auth context
          reason: releaseReason || 'Manual release from inventory impact'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReleaseDialogOpen(false);
        setReleaseReason('');
        fetchInventoryImpact();
      } else {
        setError(data.error || 'Failed to release reservations');
      }
    } catch (err) {
      setError('Error releasing reservations: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setReleasing(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/admin/carts/inventory-impact/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_impact_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error exporting inventory impact: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return <Chip icon={<ErrorIcon />} label="Out of Stock" color="error" size="small" />;
      case 'low_stock':
        return <Chip icon={<WarningIcon />} label="Low Stock" color="warning" size="small" />;
      default:
        return <Chip icon={<CheckCircleIcon />} label="Normal" color="success" size="small" />;
    }
  };

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productSku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4">
                {summary.totalProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="h4">
                {summary.outOfStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Low Stock
              </Typography>
              <Typography variant="h4">
                {summary.lowStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Normal Stock
              </Typography>
              <Typography variant="h4">
                {summary.normalStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Total Reserved
              </Typography>
              <Typography variant="h4">
                {summary.totalReservedQuantity}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Products</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
                <MenuItem value="normal">Normal Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Low Stock Only</InputLabel>
              <Select
                value={lowStockOnly ? 'true' : 'false'}
                label="Low Stock Only"
                onChange={(e) => setLowStockOnly(e.target.value === 'true')}
              >
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Total Stock</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Carts</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No products found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1">
                          {product.productName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          SKU: {product.productSku}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={product.totalStock === 0 ? 'error' : 'inherit'}
                      >
                        {product.totalStock}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={product.reservedStock > 0 ? 'warning' : 'inherit'}
                      >
                        {product.reservedStock}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={
                          product.availableStock === 0
                            ? 'error'
                            : product.availableStock <= product.lowStockThreshold
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {product.availableStock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(product.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={product.cartBreakdown.length}
                        size="small"
                        color={product.cartBreakdown.length > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Carts">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCarts(product)}
                          disabled={product.cartBreakdown.length === 0}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Cart Details Dialog */}
      <Dialog
        open={cartDetailsOpen}
        onClose={() => setCartDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Cart Reservations for {selectedProduct?.productName}
        </DialogTitle>
        <DialogContent>
          {cartDetailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : cartDetails.length === 0 ? (
            <Typography color="textSecondary" sx={{ py: 2 }}>
              No cart reservations for this product
            </Typography>
          ) : (
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cart ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expires At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartDetails.map((cart, index) => (
                    <TableRow key={`${cart.cartId}-${index}`}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {cart.cartId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cart.userName}
                        </Typography>
                        {cart.userEmail && (
                          <Typography variant="caption" color="textSecondary">
                            {cart.userEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {cart.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cart.reservationStatus}
                          size="small"
                          color={cart.reservationStatus === 'pending' ? 'warning' : 'info'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(cart.expiresAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="warning"
                          onClick={() => {
                            setReleaseDialogOpen(true);
                            // Store cartId for release
                          }}
                        >
                          Release
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCartDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Release Confirmation Dialog */}
      <Dialog
        open={releaseDialogOpen}
        onClose={() => setReleaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Release Cart Reservations</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to release all reservations for this cart? This will make the stock available again.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={releaseReason}
            onChange={(e) => setReleaseReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseDialogOpen(false)} disabled={releasing}>
            Cancel
          </Button>
          <Button
            onClick={() => handleReleaseReservation(cartDetails[0]?.cartId || '')}
            color="warning"
            disabled={releasing}
          >
            {releasing ? 'Releasing...' : 'Release'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryImpact;
