/**
 * Payment Management Page
 *
 * This page provides a comprehensive dashboard for managing payments including
 * overview with key metrics, payment transactions list, quick actions,
 * filters, search, and export functionality.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { PaymentTransactionsList } from '@/components/payments/PaymentTransactionsList';
import { TransactionDetails } from '@/components/payments/TransactionDetails';
import { useDashboardSummary } from '@/hooks/useAdminPayments';
import type { PaymentTransaction } from '@/types/payment';

export const PaymentManagement: React.FC = () => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { summary, isLoading, error, refetch } = useDashboardSummary();

  const handleRowClick = (payment: PaymentTransaction) => {
    setSelectedPayment(payment);
    setDetailsDialogOpen(true);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            href="/admin"
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4">
            Payment Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            href="/admin/payments/analytics"
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            href="/admin/payments/gateways"
          >
            Gateway Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            href="/admin/payments/logs"
          >
            Logs
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography variant="body2" color="error.dark">
            {error}
          </Typography>
        </Paper>
      )}

      {/* Dashboard Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {summary ? formatCurrency(summary.totalRevenue) : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {summary ? summary.totalTransactions.toLocaleString() : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {summary ? `${summary.successRate.toFixed(2)}%` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Pending Payments
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {summary ? summary.pendingPayments.toLocaleString() : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Failed Payments
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {summary ? summary.failedPayments.toLocaleString() : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Refunded Amount
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {summary ? formatCurrency(summary.refundedAmount) : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Average Transaction Value
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {summary ? formatCurrency(summary.totalRevenue / Math.max(summary.totalTransactions, 1)) : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {summary && summary.recentTransactions.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {summary.recentTransactions.slice(0, 5).map((transaction) => (
                <Box
                  key={transaction.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleRowClick(transaction)}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {transaction.transactionId}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {transaction.orderId}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(transaction.amount)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {transaction.status}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No recent transactions
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Payment Transactions List */}
      <PaymentTransactionsList onRowClick={handleRowClick} />

      {/* Transaction Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          Transaction Details
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {selectedPayment && (
            <TransactionDetails
              paymentId={selectedPayment.id}
              onClose={() => {
                setDetailsDialogOpen(false);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement;
