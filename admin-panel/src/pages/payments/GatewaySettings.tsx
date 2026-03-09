/**
 * Gateway Settings Page
 *
 * This page provides comprehensive payment gateway configuration including
 * listing all gateways, configuration forms, test mode toggles,
 * API credential management, webhook configuration, and connection testing.
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
  Description as DescriptionIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { PaymentGatewayConfig } from '@/components/payments/PaymentGatewayConfig';
import { Button } from '@mui/material';

export const GatewaySettings: React.FC = () => {
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
            Payment Gateway Settings
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
            startIcon={<DescriptionIcon />}
            href="/admin/payments/logs"
          >
            Logs
          </Button>
        </Box>
      </Box>

      {/* Page Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="textSecondary">
          Configure and manage your payment gateway settings. Enable or disable gateways,
          manage API credentials, configure webhooks, and test connections.
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Gateway Configuration Component */}
      <PaymentGatewayConfig />
    </Box>
  );
};

export default GatewaySettings;
