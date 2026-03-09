/**
 * Payment Analytics Component
 *
 * This component displays payment analytics including success rates, average transaction values,
 * failed payment analysis, peak transaction times, revenue charts, payment method distribution,
 * transaction volume over time, and fraud detection statistics.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePaymentAnalytics } from '@/hooks/useAdminPayments';
import type { AnalyticsQueryParams } from '@/types/payment';
import { PAYMENT_CONSTANTS, PaymentMethod, GatewayType } from '@/types/payment';

interface PaymentAnalyticsProps {
  initialParams?: AnalyticsQueryParams;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({
  initialParams = {}
}) => {
  const [params, setParams] = useState<AnalyticsQueryParams>(initialParams);

  const { analytics, isLoading, error, refetch } = usePaymentAnalytics(params);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const handleGatewayChange = (gateway: string) => {
    setParams(prev => ({
      ...prev,
      gateway: (gateway as GatewayType) || undefined
    }));
  };

  if (isLoading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics data available
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Payment Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Gateway</InputLabel>
            <Select
              value={params.gateway || ''}
              label="Gateway"
              onChange={(e) => handleGatewayChange(e.target.value)}
            >
              <MenuItem value="">All Gateways</MenuItem>
              <MenuItem value={GatewayType.SSLCOMMERZ}>SSLCommerz</MenuItem>
              <MenuItem value={GatewayType.BKASH}>bKash</MenuItem>
              <MenuItem value={GatewayType.NAGAD}>Nagad</MenuItem>
            </Select>
          </FormControl>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer'
            }}
            onClick={refetch}
          >
            <RefreshIcon />
            <Typography variant="body2">Refresh</Typography>
          </Box>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Revenue
                </Typography>
                <TrendingUpIcon color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(analytics.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Transactions
                </Typography>
                <TrendingUpIcon color="primary" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {analytics.totalTransactions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Success Rate
                </Typography>
                <CheckCircleIcon color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatPercentage(analytics.successRate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Average Transaction
                </Typography>
                <TrendingUpIcon color="info" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(analytics.averageTransactionValue)}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Failure Rate
                </Typography>
                <ErrorIcon color="error" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatPercentage(analytics.failureRate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Refunded Amount
                </Typography>
                <TrendingDownIcon color="warning" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {formatCurrency(analytics.refundedAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Refund Rate
                </Typography>
                <WarningIcon color="warning" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {formatPercentage(analytics.refundRate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Transaction Volume Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Transaction Volume Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.transactionVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Total Transactions" />
                <Line type="monotone" dataKey="successful" stroke="#00C49F" name="Successful" />
                <Line type="monotone" dataKey="failed" stroke="#FF8042" name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Payment Method Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Payment Method Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.paymentMethodDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }: any) => `${PAYMENT_CONSTANTS.PAYMENT_METHOD_NAMES[method as PaymentMethod]}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.paymentMethodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Gateway Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gateway Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.gatewayStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gateway" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalTransactions" fill="#8884d8" name="Total Transactions" />
                <Bar dataKey="successfulTransactions" fill="#00C49F" name="Successful" />
                <Bar dataKey="failedTransactions" fill="#FF8042" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Failed Payment Analysis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Failed Payment Analysis
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.failedPayments.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={item.percentage}
                            sx={{ width: 60 }}
                          />
                          <Typography variant="body2">
                            {item.percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Peak Transaction Times */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Peak Transaction Times
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Hour</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Avg Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.peakTransactionTimes.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.dayOfWeek}</TableCell>
                      <TableCell>{item.hour}:00</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">{formatCurrency(item.averageAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Fraud Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fraud Detection Statistics
              <SecurityIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Total Flagged
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {analytics.fraudStats.totalFlagged}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Blocked Transactions
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {analytics.fraudStats.blockedTransactions}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Average Fraud Score
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {analytics.fraudStats.averageFraudScore.toFixed(1)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  High Risk Transactions
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {analytics.fraudStats.highRiskTransactions}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Medium Risk Transactions
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  {analytics.fraudStats.mediumRiskTransactions}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Low Risk Transactions
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {analytics.fraudStats.lowRiskTransactions}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentAnalytics;
