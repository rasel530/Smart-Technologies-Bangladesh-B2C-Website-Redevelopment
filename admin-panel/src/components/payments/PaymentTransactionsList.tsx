/**
 * Payment Transactions List Component
 *
 * This component displays a table view of all payment transactions with filtering,
 * searching, sorting, pagination, and export functionality.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { usePaymentExport } from '@/hooks/useAdminPayments';
import type { PaymentTransaction, PaymentQueryParams, PaymentStatus } from '@/types/payment';
import { PAYMENT_CONSTANTS, PaymentMethod } from '@/types/payment';

interface PaymentTransactionsListProps {
  onRowClick?: (payment: PaymentTransaction) => void;
  initialParams?: Partial<PaymentQueryParams>;
}

export const PaymentTransactionsList: React.FC<PaymentTransactionsListProps> = ({
  onRowClick,
  initialParams = {}
}) => {
  const [params, setParams] = useState<PaymentQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialParams
  });

  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [localFilters, setLocalFilters] = useState<{
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, payments, isLoading, error, refetch } = useAdminPayments(params);
  const { exportToCSV, exportToExcel, downloadFile, isExporting } = usePaymentExport();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleSort = (column: string) => {
    const isAsc = params.sortBy === column && params.sortOrder === 'asc';
    setParams(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: isAsc ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (value: string) => {
    setParams(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setParams(prev => ({
      ...prev,
      ...localFilters,
      page: 1
    }));
    setFilterAnchorEl(null);
  };

  const clearFilters = () => {
    setLocalFilters({});
    setParams(prev => ({
      ...prev,
      status: undefined,
      paymentMethod: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1
    }));
    setFilterAnchorEl(null);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setParams(prev => ({
      ...prev,
      page: newPage + 1
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setParams(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    const blob = format === 'csv' 
      ? await exportToCSV(params)
      : await exportToExcel(params);
    
    if (blob) {
      const filename = `payments_${new Date().toISOString().split('T')[0]}.${format}`;
      downloadFile(blob, filename);
    }
    setExportDialogOpen(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskCardNumber = (cardNumber?: string): string => {
    if (!cardNumber) return '-';
    return `•••• ${cardNumber}`;
  };

  const getStatusColor = (status: PaymentStatus): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    return PAYMENT_CONSTANTS.STATUS_COLORS[status] as any;
  };

  const getPaymentMethodIcon = (method: PaymentMethod): string => {
    const icons: Record<PaymentMethod, string> = {
      [PaymentMethod.SSLCOMMERZ]: '💳',
      [PaymentMethod.BKASH]: '📱',
      [PaymentMethod.NAGAD]: '📱',
      [PaymentMethod.COD]: '💵'
    };
    return icons[method] || '💳';
  };

  const columns = [
    { id: 'transactionId', label: 'Transaction ID', sortable: true },
    { id: 'orderId', label: 'Order ID', sortable: true },
    { id: 'customerName', label: 'Customer', sortable: true },
    { id: 'amount', label: 'Amount', sortable: true },
    { id: 'paymentMethod', label: 'Method', sortable: true },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'createdAt', label: 'Date', sortable: true },
    { id: 'actions', label: 'Actions', sortable: false }
  ];

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 300 }}>
          <TextField
            placeholder="Search by Order ID, Transaction ID, or Customer..."
            variant="outlined"
            size="small"
            fullWidth
            value={params.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Filters">
            <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={() => setExportDialogOpen(true)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={refetch} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && !payments.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Filter Menu */}
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            PaperProps={{ sx: { width: 300, p: 2 } }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Filters
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={localFilters.status || ''}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.values(PAYMENT_CONSTANTS.STATUS_COLORS).map((color, index) => (
                  <MenuItem key={index} value={Object.keys(PAYMENT_CONSTANTS.STATUS_COLORS)[index]}>
                    {Object.keys(PAYMENT_CONSTANTS.STATUS_COLORS)[index]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={localFilters.paymentMethod || ''}
                label="Payment Method"
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
              >
                <MenuItem value="">All Methods</MenuItem>
                {Object.values(PAYMENT_CONSTANTS.PAYMENT_METHOD_NAMES).map((name, index) => (
                  <MenuItem key={index} value={Object.keys(PAYMENT_CONSTANTS.PAYMENT_METHOD_NAMES)[index]}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={clearFilters}
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={applyFilters}
              >
                Apply
              </Button>
            </Box>
          </Menu>

          {/* Export Dialog */}
          <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
            <DialogTitle>Export Payments</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="textSecondary">
                Choose the format for exporting payment data
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                variant="contained"
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </Button>
              <Button
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                variant="contained"
              >
                {isExporting ? 'Exporting...' : 'Export as Excel'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Table */}
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="payment transactions table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      sortDirection={params.sortBy === column.id ? params.sortOrder : false}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {column.sortable ? (
                        <TableSortLabel
                          active={params.sortBy === column.id}
                          direction={params.sortBy === column.id ? params.sortOrder : 'asc'}
                          onClick={() => handleSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow
                    hover
                    key={payment.id}
                    onClick={() => onRowClick?.(payment)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    <TableCell>{payment.transactionId}</TableCell>
                    <TableCell>{payment.orderId}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {payment.customerName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {payment.customerEmail || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{getPaymentMethodIcon(payment.paymentMethod)}</Typography>
                        <Typography variant="body2">
                          {PAYMENT_CONSTANTS.PAYMENT_METHOD_NAMES[payment.paymentMethod]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick?.(payment);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!payments.length && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No payment transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {data && data.pagination && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={data.pagination.total}
              rowsPerPage={params.limit || 20}
              page={(params.page || 1) - 1}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </>
      )}
    </Paper>
  );
};

export default PaymentTransactionsList;
