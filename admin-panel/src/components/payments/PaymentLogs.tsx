/**
 * Payment Logs Component
 *
 * This component provides an audit log viewer for payment events with filtering,
 * searching, pagination, log details modal, security event highlighting,
 * and suspicious activity alerts.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { usePaymentLogs } from '@/hooks/useAdminPayments';
import { useLogExport } from '@/hooks/useAdminPayments';
import type { LogQueryParams, LogEventType, PaymentLog } from '@/types/payment';
import { LogEventType as LogEventTypeEnum } from '@/types/payment';

interface PaymentLogsProps {
  initialParams?: LogQueryParams;
}

export const PaymentLogs: React.FC<PaymentLogsProps> = ({
  initialParams = {}
}) => {
  const [params, setParams] = useState<LogQueryParams>({
    page: 1,
    limit: 20,
    ...initialParams
  });

  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [localFilters, setLocalFilters] = useState<{
    eventType?: LogEventType;
    startDate?: string;
    endDate?: string;
  }>({});

  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [logDetailsOpen, setLogDetailsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { data, logs, isLoading, error, refetch } = usePaymentLogs(params);
  const { exportToCSV, downloadFile, isExporting } = useLogExport();

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

  const handleSearch = (value: string) => {
    setParams(prev => ({
      ...prev,
      transactionId: value || undefined,
      orderId: value || undefined,
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
      eventType: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1
    }));
    setFilterAnchorEl(null);
  };

  const handleViewLogDetails = (log: PaymentLog) => {
    setSelectedLog(log);
    setLogDetailsOpen(true);
  };

  const handleExport = async () => {
    const blob = await exportToCSV(params);
    if (blob) {
      const filename = `payment_logs_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(blob, filename);
    }
    setExportDialogOpen(false);
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

  const getEventLevelColor = (level: string): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
      info: 'info',
      warning: 'warning',
      error: 'error',
      critical: 'error'
    };
    return colors[level] || 'info';
  };

  const getEventTypeIcon = (eventType: LogEventType): React.ReactNode => {
    const icons: Record<LogEventType, React.ReactNode> = {
      [LogEventTypeEnum.PAYMENT_INITIATED]: <InfoIcon />,
      [LogEventTypeEnum.PAYMENT_PROCESSING]: <InfoIcon />,
      [LogEventTypeEnum.PAYMENT_COMPLETED]: <InfoIcon color="success" />,
      [LogEventTypeEnum.PAYMENT_FAILED]: <ErrorIcon color="error" />,
      [LogEventTypeEnum.PAYMENT_REFUNDED]: <WarningIcon color="warning" />,
      [LogEventTypeEnum.PAYMENT_CANCELLED]: <ErrorIcon color="error" />,
      [LogEventTypeEnum.GATEWAY_CALLBACK]: <InfoIcon />,
      [LogEventTypeEnum.FRAUD_DETECTED]: <SecurityIcon color="error" />,
      [LogEventTypeEnum.SECURITY_EVENT]: <SecurityIcon color="error" />,
      [LogEventTypeEnum.ERROR]: <ErrorIcon color="error" />
    };
    return icons[eventType] || <InfoIcon />;
  };

  const columns = [
    { id: 'eventType', label: 'Event Type' },
    { id: 'eventLevel', label: 'Level' },
    { id: 'message', label: 'Message' },
    { id: 'transactionId', label: 'Transaction ID' },
    { id: 'orderId', label: 'Order ID' },
    { id: 'createdAt', label: 'Date' },
    { id: 'actions', label: 'Actions' }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Payment Logs
        </Typography>
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

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by Transaction ID or Order ID..."
          variant="outlined"
          size="small"
          value={params.transactionId || params.orderId || ''}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Suspicious Activity Alert */}
      {logs.some(log => log.isSuspicious) && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          Suspicious activity detected in the logs. Please review security events.
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && !logs.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Filter Menu */}
          <Box
            sx={{
              position: 'absolute',
              zIndex: 1300,
              display: filterAnchorEl ? 'block' : 'none'
            }}
          >
            <Paper sx={{ p: 2, width: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                Filters
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={localFilters.eventType || ''}
                  label="Event Type"
                  onChange={(e) => handleFilterChange('eventType', e.target.value || undefined)}
                >
                  <MenuItem value="">All Event Types</MenuItem>
                  {Object.values(LogEventTypeEnum).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toUpperCase()}
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
            </Paper>
          </Box>

          {/* Export Dialog */}
          <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
            <DialogTitle>Export Logs</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="textSecondary">
                Export payment logs to CSV file
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="contained"
              >
                {isExporting ? 'Exporting...' : 'Export to CSV'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Logs Table */}
          <TableContainer component={Paper}>
            <Table stickyHeader aria-label="payment logs table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.id} sx={{ fontWeight: 'bold' }}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    hover
                    key={log.id}
                    sx={{
                      backgroundColor: log.isSecurityEvent ? 'error.light' : 
                                     log.isSuspicious ? 'warning.light' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getEventTypeIcon(log.eventType)}
                        <Typography variant="body2">
                          {log.eventType.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.eventLevel}
                        color={getEventLevelColor(log.eventLevel)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap>
                          {log.message}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{log.transactionId || '-'}</TableCell>
                    <TableCell>{log.orderId || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(log.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewLogDetails(log)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!logs.length && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No log entries found
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

      {/* Log Details Dialog */}
      <Dialog open={logDetailsOpen} onClose={() => setLogDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Basic Information */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Event Type
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.eventType.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Event Level
                    </Typography>
                    <Chip
                      label={selectedLog.eventLevel}
                      color={getEventLevelColor(selectedLog.eventLevel)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Transaction ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.transactionId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Order ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.orderId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedLog.createdAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Message */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Message
                </Typography>
                <Typography variant="body1">
                  {selectedLog.message}
                </Typography>
              </Box>

              {/* Security Information */}
              {selectedLog.isSecurityEvent && (
                <Alert severity="error" icon={<SecurityIcon />}>
                  This is a security event that requires attention.
                </Alert>
              )}

              {selectedLog.isSuspicious && (
                <Alert severity="warning" icon={<WarningIcon />}>
                  This log entry has been flagged as suspicious activity.
                </Alert>
              )}

              {/* IP Address and User Agent */}
              <Grid container spacing={2}>
                {selectedLog.ipAddress && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      IP Address
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.ipAddress}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.userAgent && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      User Agent
                    </Typography>
                    <Typography variant="body1" noWrap>
                      {selectedLog.userAgent}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Additional Metadata
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentLogs;
