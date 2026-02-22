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
  Chip,
  Pagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';

interface SyncRecord {
  id: string;
  userId: string;
  userEmail: string;
  deviceId: string;
  lastSyncAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  pendingChanges: number;
  dataSize: number;
  errorMessage: string | null;
  networkType: string;
  deviceType: string;
}

export const OfflineSyncManagement: React.FC = () => {
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SyncRecord | null>(null);
  const [syncing, setSyncing] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSyncRecords();
  }, [page, statusFilter, searchQuery]);

  const fetchSyncRecords = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockRecords: SyncRecord[] = [
        {
          id: 'sync-001',
          userId: 'user-001',
          userEmail: 'user1@example.com',
          deviceId: 'device-001',
          lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          syncStatus: 'synced',
          pendingChanges: 0,
          dataSize: 1024,
          errorMessage: null,
          networkType: 'wifi',
          deviceType: 'mobile',
        },
        {
          id: 'sync-002',
          userId: 'user-002',
          userEmail: 'user2@example.com',
          deviceId: 'device-002',
          lastSyncAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          syncStatus: 'pending',
          pendingChanges: 5,
          dataSize: 2048,
          errorMessage: null,
          networkType: '4g',
          deviceType: 'mobile',
        },
        {
          id: 'sync-003',
          userId: 'user-003',
          userEmail: 'user3@example.com',
          deviceId: 'device-003',
          lastSyncAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          syncStatus: 'failed',
          pendingChanges: 3,
          dataSize: 512,
          errorMessage: 'Network timeout during sync',
          networkType: '3g',
          deviceType: 'tablet',
        },
        {
          id: 'sync-004',
          userId: 'user-004',
          userEmail: 'user4@example.com',
          deviceId: 'device-004',
          lastSyncAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          syncStatus: 'synced',
          pendingChanges: 0,
          dataSize: 4096,
          errorMessage: null,
          networkType: 'wifi',
          deviceType: 'mobile',
        },
        {
          id: 'sync-005',
          userId: 'user-005',
          userEmail: 'user5@example.com',
          deviceId: 'device-005',
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          syncStatus: 'pending',
          pendingChanges: 8,
          dataSize: 1536,
          errorMessage: null,
          networkType: '4g',
          deviceType: 'mobile',
        },
      ];

      // Apply filters
      let filteredRecords = mockRecords;
      if (statusFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.syncStatus === statusFilter);
      }
      if (searchQuery) {
        filteredRecords = filteredRecords.filter(record =>
          record.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.deviceId.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setSyncRecords(filteredRecords);
      setTotalPages(Math.ceil(filteredRecords.length / 10));
    } catch (error) {
      console.error('Error fetching sync records:', error);
      showSnackbar('Failed to fetch sync records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async (record: SyncRecord) => {
    try {
      setSyncing(true);
      setSelectedRecord(record);

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      showSnackbar(`Sync initiated for ${record.userEmail}`, 'success');
      fetchSyncRecords();
    } catch (error) {
      console.error('Error initiating sync:', error);
      showSnackbar('Failed to initiate sync', 'error');
    } finally {
      setSyncing(false);
      setSyncDialogOpen(false);
      setSelectedRecord(null);
    }
  };

  const openSyncDialog = (record: SyncRecord) => {
    setSelectedRecord(record);
    setSyncDialogOpen(true);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDataSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Offline Sync Management
      </Typography>

      {/* Filters and Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search by email or device ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 300, flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="synced">Synced</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchSyncRecords}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Sync Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>User Email</TableCell>
              <TableCell>Device ID</TableCell>
              <TableCell>Device Type</TableCell>
              <TableCell>Network</TableCell>
              <TableCell>Last Sync</TableCell>
              <TableCell>Pending Changes</TableCell>
              <TableCell>Data Size</TableCell>
              <TableCell>Error</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : syncRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No sync records found
                </TableCell>
              </TableRow>
            ) : (
              syncRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(record.syncStatus)}
                      <Chip
                        label={record.syncStatus}
                        color={getStatusColor(record.syncStatus) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{record.userEmail}</TableCell>
                  <TableCell>{record.deviceId}</TableCell>
                  <TableCell>
                    <Chip label={record.deviceType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={record.networkType.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{formatDate(record.lastSyncAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.pendingChanges}
                      color={record.pendingChanges > 0 ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDataSize(record.dataSize)}</TableCell>
                  <TableCell>
                    {record.errorMessage ? (
                      <Tooltip title={record.errorMessage}>
                        <Chip label="Error" color="error" size="small" />
                      </Tooltip>
                    ) : (
                      <Typography color="textSecondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.syncStatus !== 'synced' && (
                      <Tooltip title="Force Sync">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SyncIcon />}
                          onClick={() => openSyncDialog(record)}
                        >
                          Sync
                        </Button>
                      </Tooltip>
                    )}
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

      {/* Sync Confirmation Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Manual Sync</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Are you sure you want to manually sync data for {selectedRecord?.userEmail}?
          </Alert>
          {selectedRecord && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Device ID:</strong> {selectedRecord.deviceId}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Pending Changes:</strong> {selectedRecord.pendingChanges}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Data Size:</strong> {formatDataSize(selectedRecord.dataSize)}
              </Typography>
              {selectedRecord.errorMessage && (
                <Typography variant="body2" color="error">
                  <strong>Last Error:</strong> {selectedRecord.errorMessage}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)} disabled={syncing}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedRecord && handleManualSync(selectedRecord)}
            variant="contained"
            startIcon={<CloudSyncIcon />}
            disabled={syncing}
          >
            {syncing ? <CircularProgress size={20} /> : 'Start Sync'}
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

export default OfflineSyncManagement;
