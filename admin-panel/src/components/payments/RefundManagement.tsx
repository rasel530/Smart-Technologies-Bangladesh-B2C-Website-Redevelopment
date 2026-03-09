/**
 * Refund Management Component
 *
 * This component provides functionality for processing refunds including full refunds,
 * partial refunds, refund history display, and refund status tracking.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { usePayment } from '@/hooks/useAdminPayments';
import { usePaymentRefund } from '@/hooks/useAdminPayments';
import type { PaymentTransaction, RefundRequest } from '@/types/payment';
import { PAYMENT_CONSTANTS } from '@/types/payment';

interface RefundManagementProps {
  paymentId: string;
  onRefundComplete?: () => void;
}

interface RefundHistory {
  id: string;
  refundId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export const RefundManagement: React.FC<RefundManagementProps> = ({
  paymentId,
  onRefundComplete
}) => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundHistory, setRefundHistory] = useState<RefundHistory[]>([]);

  const { payment, isLoading, error, refetch } = usePayment(paymentId);
  const { isRefunding, error: refundError, success: refundSuccess, processRefund, reset } = usePaymentRefund();

  const handleRefund = async () => {
    if (!payment) return;

    const refundData: RefundRequest = {
      amount: refundType === 'full' ? payment.amount : refundAmount,
      reason: refundReason,
      fullRefund: refundType === 'full'
    };

    const result = await processRefund(payment.id, refundData);

    if (result) {
      // Add to refund history
      const newRefund: RefundHistory = {
        id: Date.now().toString(),
        refundId: result.refundId,
        amount: refundData.amount,
        reason: refundReason,
        status: result.refundStatus as 'pending' | 'completed' | 'failed',
        createdAt: new Date().toISOString()
      };

      setRefundHistory(prev => [newRefund, ...prev]);
      setRefundDialogOpen(false);
      setRefundAmount(0);
      setRefundReason('');
      setRefundType('full');
      refetch();
      onRefundComplete?.();
    }

    setTimeout(() => reset(), 3000);
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

  const getRefundStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      completed: 'success',
      pending: 'warning',
      failed: 'error'
    };
    return colors[status] || 'info';
  };

  const canProcessRefund = payment && (
    payment.status === 'completed' || 
    (payment.status === 'partially_refunded' && payment.refundedAmount && payment.refundedAmount < payment.amount)
  );

  const maxRefundableAmount = payment 
    ? payment.amount - (payment.refundedAmount || 0)
    : 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !payment) {
    return (
      <Alert severity="error">
        {error || 'Payment not found'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Refund Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refetch}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Payment Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Transaction ID
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {payment.transactionId}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Original Amount
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {formatCurrency(payment.amount)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Refunded Amount
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="error">
              {formatCurrency(payment.refundedAmount || 0)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Remaining Amount
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              {formatCurrency(maxRefundableAmount)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Payment Status
            </Typography>
            <Chip
              label={payment.status}
              color={PAYMENT_CONSTANTS.STATUS_COLORS[payment.status] as any}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Payment Method
            </Typography>
            <Typography variant="body1">
              {PAYMENT_CONSTANTS.PAYMENT_METHOD_NAMES[payment.paymentMethod]}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Refund Success Alert */}
      {refundSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Refund processed successfully
        </Alert>
      )}

      {/* Refund Error Alert */}
      {refundError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {refundError}
        </Alert>
      )}

      {/* Process Refund Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Process Refund
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {!canProcessRefund ? (
          <Alert severity="info">
            This payment cannot be refunded. It may have already been fully refunded or is in an invalid state.
          </Alert>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 3 }}>
              This action cannot be undone. Please verify the refund details before proceeding.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Refund Type</InputLabel>
                  <Select
                    value={refundType}
                    label="Refund Type"
                    onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
                    disabled={isRefunding}
                  >
                    <MenuItem value="full">Full Refund</MenuItem>
                    <MenuItem value="partial">Partial Refund</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {refundType === 'partial' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Refund Amount"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                      inputProps: { min: 0, max: maxRefundableAmount }
                    }}
                    helperText={`Maximum refundable amount: ${formatCurrency(maxRefundableAmount)}`}
                    disabled={isRefunding}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Refund Reason"
                  multiline
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter the reason for this refund..."
                  required
                  disabled={isRefunding}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setRefundAmount(0);
                      setRefundReason('');
                      setRefundType('full');
                    }}
                    disabled={isRefunding}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => setRefundDialogOpen(true)}
                    disabled={
                      isRefunding ||
                      (refundType === 'partial' && refundAmount <= 0) ||
                      !refundReason
                    }
                  >
                    {isRefunding ? 'Processing...' : 'Process Refund'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Refund History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Refund History
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {refundHistory.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Refund ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refundHistory.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>{refund.refundId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(refund.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{refund.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={refund.status}
                        color={getRefundStatusColor(refund.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(refund.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
            <InfoIcon color="info" />
            <Typography variant="body2" color="textSecondary">
              No refund history available for this payment
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Refund
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to process a {refundType} refund. This action cannot be undone.
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Refund Amount:
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="error">
              {formatCurrency(refundType === 'full' ? payment.amount : refundAmount)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary">
              Reason:
            </Typography>
            <Typography variant="body1">
              {refundReason}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            variant="contained"
            color="warning"
            disabled={isRefunding}
          >
            {isRefunding ? 'Processing...' : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundManagement;
