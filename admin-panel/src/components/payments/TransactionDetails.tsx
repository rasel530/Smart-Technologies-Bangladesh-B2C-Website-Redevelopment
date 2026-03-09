/**
 * Transaction Details Component
 *
 * This component displays detailed information about a payment transaction including
 * order details, customer information, payment method details, transaction timeline,
 * gateway response, callback data, refund actions, and security events.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { usePayment } from '@/hooks/useAdminPayments';
import { usePaymentRefund } from '@/hooks/useAdminPayments';
import { useTransactionTimeline } from '@/hooks/useAdminPayments';
import { useSecurityEvents } from '@/hooks/useAdminPayments';
import type { PaymentTransaction, RefundRequest } from '@/types/payment';
import { PaymentStatus, PAYMENT_CONSTANTS } from '@/types/payment';

interface TransactionDetailsProps {
  paymentId: string;
  onClose?: () => void;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  paymentId,
  onClose
}) => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isFullRefund, setIsFullRefund] = useState<boolean>(true);

  const { payment, isLoading, error, refetch } = usePayment(paymentId);
  const { timeline, isLoading: timelineLoading } = useTransactionTimeline(paymentId);
  const { events, isLoading: eventsLoading } = useSecurityEvents(paymentId);
  const { isRefunding, error: refundError, success: refundSuccess, processRefund, reset } = usePaymentRefund();

  const handleRefund = async () => {
    if (!payment) return;

    const refundData: RefundRequest = {
      amount: isFullRefund ? payment.amount : refundAmount,
      reason: refundReason,
      fullRefund: isFullRefund
    };

    const result = await processRefund(payment.id, refundData);

    if (result) {
      setRefundDialogOpen(false);
      setRefundAmount(0);
      setRefundReason('');
      setIsFullRefund(true);
      refetch();
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

  const maskSensitiveData = (data: string, showLast: number = 4): string => {
    if (!data) return 'N/A';
    if (data.length <= showLast) return data;
    return `${'*'.repeat(data.length - showLast)}${data.slice(-showLast)}`;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    return PAYMENT_CONSTANTS.STATUS_COLORS[status as keyof typeof PAYMENT_CONSTANTS.STATUS_COLORS] as any;
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    const colors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info'
    };
    return colors[severity] || 'info';
  };

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
        <Box>
          <Typography variant="h4" gutterBottom>
            Transaction Details
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {payment.transactionId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={refetch}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Close">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

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

      {/* Status Badge */}
      <Box sx={{ mb: 3 }}>
        <Chip
          label={payment.status.toUpperCase()}
          color={getStatusColor(payment.status)}
          size="medium"
          sx={{ fontSize: '1rem', px: 2, py: 1 }}
        />
      </Box>

      {/* Main Information */}
      <Grid container spacing={3}>
        {/* Transaction Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Transaction Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">Amount</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(payment.amount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">Currency</Typography>
                <Typography variant="body1">{payment.currency}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                <Typography variant="body1">
                  {PAYMENT_CONSTANTS.PAYMENT_METHOD_NAMES[payment.paymentMethod]}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">Gateway</Typography>
                <Typography variant="body1">
                  {PAYMENT_CONSTANTS.GATEWAY_NAMES[payment.gatewayType]}
                </Typography>
              </Box>
              {payment.refundedAmount && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Refunded Amount</Typography>
                  <Typography variant="body1" color="error">
                    {formatCurrency(payment.refundedAmount)}
                  </Typography>
                </Box>
              )}
              {payment.fraudScore !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Fraud Score</Typography>
                  <Chip
                    label={payment.fraudScore}
                    size="small"
                    color={payment.fraudScore > 60 ? 'error' : payment.fraudScore > 30 ? 'warning' : 'success'}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{payment.customerName || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1">{payment.customerEmail || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Phone</Typography>
                <Typography variant="body1">
                  {payment.customerPhone ? maskSensitiveData(payment.customerPhone, 3) : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">IP Address</Typography>
                <Typography variant="body1">{payment.ipAddress || 'N/A'}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Order Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Order Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Order ID</Typography>
                <Typography variant="body1">{payment.orderId}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Transaction ID</Typography>
                <Typography variant="body1">{payment.transactionId}</Typography>
              </Box>
              {payment.gatewayTransactionId && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Gateway Transaction ID</Typography>
                  <Typography variant="body1">{payment.gatewayTransactionId}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="textSecondary">Created At</Typography>
                <Typography variant="body1">{formatDate(payment.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Last Updated</Typography>
                <Typography variant="body1">{formatDate(payment.updatedAt)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Payment Method Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Payment Method Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {payment.cardLastFour && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Card Number</Typography>
                  <Typography variant="body1">
                    {maskSensitiveData(payment.cardLastFour, 4)}
                  </Typography>
                </Box>
              )}
              {payment.cardBrand && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Card Brand</Typography>
                  <Typography variant="body1">{payment.cardBrand}</Typography>
                </Box>
              )}
              {payment.refundReason && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Refund Reason</Typography>
                  <Typography variant="body1">{payment.refundReason}</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Refund Actions */}
        {payment.status === PaymentStatus.COMPLETED && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Refund Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => {
                    setIsFullRefund(true);
                    setRefundDialogOpen(true);
                  }}
                >
                  Process Full Refund
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsFullRefund(false);
                    setRefundDialogOpen(true);
                  }}
                >
                  Process Partial Refund
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Transaction Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Transaction Timeline
                  {timelineLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {timeline && timeline.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timeline.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <Chip
                                label={entry.status}
                                color={getStatusColor(entry.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{entry.message}</TableCell>
                            <TableCell>{formatDate(entry.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No timeline events available
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* Security Events */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SecurityIcon />
                  <Typography variant="h6">
                    Security Events
                    {eventsLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                  </Typography>
                  {events && events.length > 0 && (
                    <Chip label={events.length} color="error" size="small" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {events && events.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {events.map((event) => (
                      <Alert
                        key={event.id}
                        severity={getSeverityColor(event.severity)}
                        icon={event.severity === 'critical' || event.severity === 'high' ? <WarningIcon /> : <InfoIcon />}
                      >
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            {event.eventType}
                          </Typography>
                          <Typography variant="body2">
                            {event.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                            {formatDate(event.createdAt)}
                          </Typography>
                        </Box>
                      </Alert>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2" color="textSecondary">
                      No security events detected
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* Gateway Response */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Gateway Response
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {payment.gatewayResponse ? (
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(payment.gatewayResponse, null, 2)}
                    </pre>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No gateway response data available
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* Callback Data */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Callback Data
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {payment.callbackData ? (
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(payment.callbackData, null, 2)}
                    </pre>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No callback data available
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* Metadata */}
        {payment.metadata && Object.keys(payment.metadata).length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Additional Metadata
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(payment.metadata, null, 2)}
                    </pre>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isFullRefund ? 'Process Full Refund' : 'Process Partial Refund'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. Please verify the refund details before proceeding.
          </Alert>
          
          {!isFullRefund && (
            <TextField
              fullWidth
              label="Refund Amount"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                inputProps: { min: 0, max: payment.amount }
              }}
              helperText={`Maximum refundable amount: ${formatCurrency(payment.amount)}`}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label="Refund Reason"
            multiline
            rows={3}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Enter the reason for this refund..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRefund}
            variant="contained"
            color="warning"
            disabled={isRefunding || (!isFullRefund && refundAmount <= 0) || !refundReason}
          >
            {isRefunding ? 'Processing...' : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionDetails;
