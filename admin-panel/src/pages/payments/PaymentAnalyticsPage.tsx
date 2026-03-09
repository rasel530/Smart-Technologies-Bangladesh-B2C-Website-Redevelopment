/**
 * Payment Analytics Page
 *
 * This page provides a comprehensive analytics dashboard for payments including
 * charts, graphs, key metrics display, date range selector, and export reports.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  Payments as PaymentsIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { PaymentAnalytics as PaymentAnalyticsComponent } from '@/components/payments/PaymentAnalytics';
import type { AnalyticsQueryParams } from '@/types/payment';

export const PaymentAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting analytics report...');
  };

  const handleClearFilters = () => {
    setDateRange({});
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
            Payment Analytics
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

      {/* Page Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="textSecondary">
          View comprehensive payment analytics including transaction volumes, success rates,
          revenue trends, payment method distribution, and fraud detection statistics.
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Date Range Filter */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Date Range Filter
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.startDate || ''}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.endDate || ''}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
              >
                Clear
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                fullWidth
              >
                Export Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Analytics Dashboard */}
      <PaymentAnalyticsComponent initialParams={dateRange} />
    </Box>
  );
};

export default PaymentAnalyticsPage;
