import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Smartphone as SmartphoneIcon,
  Wifi as WifiIcon,
  SignalCellular4G as SignalCellular4GIcon,
  SignalCellular3G as SignalCellular3GIcon,
  SignalCellular1Bar as SignalCellular1BarIcon,
} from '@mui/icons-material';

interface MobileAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  averageSessionDuration: number;
  totalSessions: number;
  bounceRate: number;
  conversionRate: number;
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  networkBreakdown: {
    wifi: number;
    '4g': number;
    '3g': number;
    '2g': number;
  };
  performanceMetrics: {
    averageLoadTime: number;
    averageResponseTime: number;
    errorRate: number;
  };
  timeSeriesData: {
    date: string;
    users: number;
    sessions: number;
  }[];
}

export const MobileAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<MobileAnalyticsData | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - replace with actual API call
      const mockData: MobileAnalyticsData = {
        totalUsers: 15420,
        activeUsers: 8750,
        offlineUsers: 1230,
        averageSessionDuration: 345, // seconds
        totalSessions: 45680,
        bounceRate: 32.5,
        conversionRate: 4.8,
        deviceBreakdown: {
          mobile: 12350,
          tablet: 2100,
          desktop: 970,
        },
        networkBreakdown: {
          wifi: 6540,
          '4g': 5230,
          '3g': 2890,
          '2g': 760,
        },
        performanceMetrics: {
          averageLoadTime: 2.3,
          averageResponseTime: 0.8,
          errorRate: 1.2,
        },
        timeSeriesData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          users: Math.floor(Math.random() * 2000) + 1000,
          sessions: Math.floor(Math.random() * 3000) + 2000,
        })).reverse(),
      };

      setAnalyticsData(mockData);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getNetworkIcon = (type: string) => {
    switch (type) {
      case 'wifi':
        return <WifiIcon />;
      case '4g':
        return <SignalCellular4GIcon />;
      case '3g':
        return <SignalCellular3GIcon />;
      case '2g':
        return <SignalCellular1BarIcon />;
      default:
        return <SmartphoneIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Mobile Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4">{formatNumber(analyticsData?.totalUsers || 0)}</Typography>
                </Box>
                <SmartphoneIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Users
                  </Typography>
                  <Typography variant="h4">{formatNumber(analyticsData?.activeUsers || 0)}</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Session
                  </Typography>
                  <Typography variant="h4">
                    {formatDuration(analyticsData?.averageSessionDuration || 0)}
                  </Typography>
                </Box>
                <SmartphoneIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4">
                    {formatPercentage(analyticsData?.conversionRate || 0)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Device and Network Breakdown */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Device Breakdown
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device Type</TableCell>
                    <TableCell align="right">Users</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData && (
                    <>
                      <TableRow>
                        <TableCell>Mobile</TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.deviceBreakdown.mobile)}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.deviceBreakdown.mobile / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tablet</TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.deviceBreakdown.tablet)}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.deviceBreakdown.tablet / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Desktop</TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.deviceBreakdown.desktop)}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.deviceBreakdown.desktop / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Breakdown
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Network Type</TableCell>
                    <TableCell align="right">Users</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData && (
                    <>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getNetworkIcon('wifi')} WiFi
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.networkBreakdown.wifi)}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.networkBreakdown.wifi / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getNetworkIcon('4g')} 4G
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.networkBreakdown['4g'])}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.networkBreakdown['4g'] / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getNetworkIcon('3g')} 3G
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.networkBreakdown['3g'])}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.networkBreakdown['3g'] / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getNetworkIcon('2g')} 2G
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(analyticsData.networkBreakdown['2g'])}</TableCell>
                        <TableCell align="right">
                          {formatPercentage((analyticsData.networkBreakdown['2g'] / analyticsData.totalUsers) * 100)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Performance Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Load Time
                </Typography>
                <Typography variant="h5">
                  {analyticsData?.performanceMetrics.averageLoadTime.toFixed(2)}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Response Time
                </Typography>
                <Typography variant="h5">
                  {analyticsData?.performanceMetrics.averageResponseTime.toFixed(2)}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Error Rate
                </Typography>
                <Typography variant="h5">
                  {formatPercentage(analyticsData?.performanceMetrics.errorRate || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Time Series Data */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          User Activity Over Time
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Users</TableCell>
                <TableCell align="right">Sessions</TableCell>
                <TableCell align="right">Avg Sessions/User</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData?.timeSeriesData.map((data) => (
                <TableRow key={data.date}>
                  <TableCell>{new Date(data.date).toLocaleDateString('en-BD')}</TableCell>
                  <TableCell align="right">{formatNumber(data.users)}</TableCell>
                  <TableCell align="right">{formatNumber(data.sessions)}</TableCell>
                  <TableCell align="right">
                    {(data.sessions / data.users).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default MobileAnalyticsDashboard;
