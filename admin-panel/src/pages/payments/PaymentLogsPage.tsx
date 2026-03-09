/**
 * Payment Logs Page
 *
 * This page provides a comprehensive audit log viewer for payment events including
 * filtering, searching, log details modal, security event highlighting, and export functionality.
 */

import React from 'react';
import {
  Box,
  Typography,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { PaymentLogs as PaymentLogsComponent } from '@/components/payments/PaymentLogs';
import { Button } from '@mui/material';

export const PaymentLogsPage: React.FC = () => {
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
            Payment Logs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PaymentsIcon />}
            href="/admin/payments"
          >
            Payments
          </Button>
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
        </Box>
      </Box>

      {/* Page Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="textSecondary">
          View comprehensive audit logs for all payment events. Filter by transaction ID,
          order ID, event type, or date range. Security events and suspicious activities
          are highlighted for your attention.
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Payment Logs Component */}
      <PaymentLogsComponent />
    </Box>
  );
};

export default PaymentLogsPage;
