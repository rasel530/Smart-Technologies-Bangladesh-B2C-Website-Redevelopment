'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Divider,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

interface DashboardSummary {
  totalProducts: number;
  productsWithLowStock: number;
  productsOutOfStock: number;
  totalReservedStock: number;
  recentlyExpired: number;
  expiredReservationsCount: number;
  atRiskProductCount: number;
}

interface StockDistribution {
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface AtRiskProduct {
  productId: string;
  productName: string;
  productSku: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
}

interface RecentActivity {
  reservationId: string;
  productName: string;
  quantity: number;
  status: string;
  createdAt: string;
}

interface DashboardResponse {
  success: boolean;
  data: {
    summary: DashboardSummary;
    stockDistribution: StockDistribution;
    atRiskProducts: AtRiskProduct[];
    recentActivity: RecentActivity[];
  };
}

interface InventoryDashboardProps {
  onNavigateToInventory?: () => void;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  onNavigateToInventory
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stockDistribution, setStockDistribution] = useState<StockDistribution | null>(null);
  const [atRiskProducts, setAtRiskProducts] = useState<AtRiskProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/admin/carts/inventory-impact/summary');
      const data: DashboardResponse = await response.json();
      
      if (data.success) {
        setSummary(data.data.summary);
        setStockDistribution(data.data.stockDistribution);
        setAtRiskProducts(data.data.atRiskProducts);
        setRecentActivity(data.data.recentActivity);
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Error fetching dashboard: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    fetchDashboard();
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch('/api/v1/admin/carts/inventory-impact/cleanup', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchDashboard();
      } else {
        setError(data.error || 'Failed to cleanup expired reservations');
      }
    } catch (err) {
      setError('Error cleaning up: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'confirmed':
        return <CheckCircleIcon color="success" />;
      case 'released':
        return <ShoppingCartIcon color="info" />;
      case 'expired':
        return <ErrorIcon color="error" />;
      default:
        return <InventoryIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Inventory Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleCleanup}
            startIcon={<ScheduleIcon />}
          >
            Cleanup Expired
          </Button>
          <Button
            variant="contained"
            onClick={onNavigateToInventory}
            startIcon={<InventoryIcon />}
          >
            Full View
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Total Products
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.totalProducts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon sx={{ mr: 1 }} />
                <Typography color="inherit" variant="body2">
                  Out of Stock
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.productsOutOfStock || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography color="inherit" variant="body2">
                  Low Stock
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.productsWithLowStock || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ mr: 1 }} />
                <Typography color="inherit" variant="body2">
                  Total Reserved
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.totalReservedStock || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Distribution */}
      <Grid container spacing={3}>
        {/* At Risk Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              At Risk Products
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Products with low available stock but high reservations
            </Typography>
            
            {atRiskProducts.length === 0 ? (
              <Typography color="textSecondary" sx={{ py: 2 }}>
                No at-risk products
              </Typography>
            ) : (
              <List dense>
                {atRiskProducts.map((product) => (
                  <React.Fragment key={product.productId}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {product.productName}
                            </Typography>
                            <Chip
                              label={`${product.availableStock} available`}
                              size="small"
                              color={product.availableStock === 0 ? 'error' : 'warning'}
                            />
                          </Box>
                        }
                        secondary={`SKU: ${product.productSku} | Reserved: ${product.reservedStock}`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Reservation Activity
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Last 24 hours activity
            </Typography>
            
            {recentActivity.length === 0 ? (
              <Typography color="textSecondary" sx={{ py: 2 }}>
                No recent activity
              </Typography>
            ) : (
              <List dense>
                {recentActivity.map((activity) => (
                  <React.Fragment key={activity.reservationId}>
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getActivityIcon(activity.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {activity.productName}
                            </Typography>
                            <Chip
                              label={`Qty: ${activity.quantity}`}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={new Date(activity.createdAt).toLocaleString()}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Stock Distribution Overview
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body1">
                  <strong>{stockDistribution?.inStock || 0}</strong> products in stock
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                <Typography variant="body1">
                  <strong>{stockDistribution?.lowStock || 0}</strong> products low stock
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon color="error" />
                <Typography variant="body1">
                  <strong>{stockDistribution?.outOfStock || 0}</strong> products out of stock
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Expired Reservations Alert */}
        {summary && summary.recentlyExpired > 0 && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>{summary.recentlyExpired}</strong> reservations expired in the last 24 hours.
                Consider running cleanup to release the stock.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default InventoryDashboard;
