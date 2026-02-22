import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkCheckIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
}

interface DevicePerformance {
  deviceType: string;
  averageLoadTime: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  totalRequests: number;
  averageDataTransfer: number;
}

interface NetworkPerformance {
  networkType: string;
  averageLatency: number;
  averageThroughput: number;
  packetLoss: number;
  connectionStability: number;
  totalConnections: number;
}

export const MobilePerformanceReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [devicePerformance, setDevicePerformance] = useState<DevicePerformance[]>([]);
  const [networkPerformance, setNetworkPerformance] = useState<NetworkPerformance[]>([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - replace with actual API call
      const mockMetrics: PerformanceMetric[] = [
        {
          metric: 'Average Page Load Time',
          value: 2.3,
          unit: 'seconds',
          trend: 'down',
          trendValue: -0.2,
          threshold: 3.0,
          status: 'good',
        },
        {
          metric: 'Average API Response Time',
          value: 0.8,
          unit: 'seconds',
          trend: 'down',
          trendValue: -0.1,
          threshold: 1.0,
          status: 'good',
        },
        {
          metric: 'Error Rate',
          value: 1.2,
          unit: '%',
          trend: 'down',
          trendValue: -0.3,
          threshold: 2.0,
          status: 'good',
        },
        {
          metric: 'Success Rate',
          value: 98.8,
          unit: '%',
          trend: 'up',
          trendValue: 0.5,
          threshold: 95.0,
          status: 'good',
        },
        {
          metric: 'Average Data Transfer',
          value: 1.5,
          unit: 'MB',
          trend: 'up',
          trendValue: 0.2,
          threshold: 2.0,
          status: 'good',
        },
        {
          metric: 'Memory Usage',
          value: 65.0,
          unit: '%',
          trend: 'up',
          trendValue: 2.0,
          threshold: 80.0,
          status: 'warning',
        },
      ];

      const mockDevicePerformance: DevicePerformance[] = [
        {
          deviceType: 'Mobile',
          averageLoadTime: 2.1,
          averageResponseTime: 0.7,
          errorRate: 1.0,
          successRate: 99.0,
          totalRequests: 45230,
          averageDataTransfer: 1.2,
        },
        {
          deviceType: 'Tablet',
          averageLoadTime: 2.5,
          averageResponseTime: 0.9,
          errorRate: 1.5,
          successRate: 98.5,
          totalRequests: 12450,
          averageDataTransfer: 1.8,
        },
        {
          deviceType: 'Desktop',
          averageLoadTime: 1.8,
          averageResponseTime: 0.6,
          errorRate: 0.8,
          successRate: 99.2,
          totalRequests: 8760,
          averageDataTransfer: 2.1,
        },
      ];

      const mockNetworkPerformance: NetworkPerformance[] = [
        {
          networkType: 'WiFi',
          averageLatency: 25,
          averageThroughput: 15.2,
          packetLoss: 0.1,
          connectionStability: 99.5,
          totalConnections: 6540,
        },
        {
          networkType: '4G',
          averageLatency: 45,
          averageThroughput: 8.5,
          packetLoss: 0.3,
          connectionStability: 98.2,
          totalConnections: 5230,
        },
        {
          networkType: '3G',
          averageLatency: 120,
          averageThroughput: 2.3,
          packetLoss: 0.8,
          connectionStability: 95.5,
          totalConnections: 2890,
        },
        {
          networkType: '2G',
          averageLatency: 350,
          averageThroughput: 0.5,
          packetLoss: 2.1,
          connectionStability: 90.2,
          totalConnections: 760,
        },
      ];

      setPerformanceMetrics(mockMetrics);
      setDevicePerformance(mockDevicePerformance);
      setNetworkPerformance(mockNetworkPerformance);
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-BD').format(num);
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
        <Typography variant="h4">Mobile Performance Report</Typography>
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
            onClick={fetchPerformanceData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Performance Metrics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Key Performance Metrics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {performanceMetrics.map((metric) => (
            <Box key={metric.metric} sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      {metric.metric}
                    </Typography>
                    <Chip
                      label={metric.status}
                      color={getStatusColor(metric.status) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4">
                      {metric.value.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {metric.unit}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {getTrendIcon(metric.trend)}
                    <Typography variant="body2" color={metric.trend === 'up' ? 'success.main' : 'error.main'}>
                      {metric.trendValue > 0 ? '+' : ''}{metric.trendValue.toFixed(1)}{metric.unit}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      vs previous period
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Threshold: {metric.threshold} {metric.unit}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((metric.value / metric.threshold) * 100, 100)}
                      color={getStatusColor(metric.status) as any}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Device Performance Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Device Performance Breakdown
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device Type</TableCell>
                <TableCell align="right">Avg Load Time</TableCell>
                <TableCell align="right">Avg Response Time</TableCell>
                <TableCell align="right">Error Rate</TableCell>
                <TableCell align="right">Success Rate</TableCell>
                <TableCell align="right">Total Requests</TableCell>
                <TableCell align="right">Avg Data Transfer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devicePerformance.map((device) => (
                <TableRow key={device.deviceType}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MemoryIcon />
                      {device.deviceType}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{device.averageLoadTime.toFixed(2)}s</TableCell>
                  <TableCell align="right">{device.averageResponseTime.toFixed(2)}s</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${device.errorRate.toFixed(1)}%`}
                      color={device.errorRate < 1 ? 'success' : device.errorRate < 2 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${device.successRate.toFixed(1)}%`}
                      color={device.successRate > 98 ? 'success' : device.successRate > 95 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{formatNumber(device.totalRequests)}</TableCell>
                  <TableCell align="right">{device.averageDataTransfer.toFixed(2)} MB</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Network Performance Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Network Performance Breakdown
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Network Type</TableCell>
                <TableCell align="right">Avg Latency</TableCell>
                <TableCell align="right">Avg Throughput</TableCell>
                <TableCell align="right">Packet Loss</TableCell>
                <TableCell align="right">Connection Stability</TableCell>
                <TableCell align="right">Total Connections</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {networkPerformance.map((network) => (
                <TableRow key={network.networkType}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NetworkCheckIcon />
                      {network.networkType}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{network.averageLatency}ms</TableCell>
                  <TableCell align="right">{network.averageThroughput.toFixed(1)} Mbps</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${network.packetLoss.toFixed(1)}%`}
                      color={network.packetLoss < 0.5 ? 'success' : network.packetLoss < 1.5 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${network.connectionStability.toFixed(1)}%`}
                      color={network.connectionStability > 98 ? 'success' : network.connectionStability > 95 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{formatNumber(network.totalConnections)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Performance Summary */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Overall Performance Score
                  </Typography>
                  <Typography variant="h4">92.5</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MemoryIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Requests
                  </Typography>
                  <Typography variant="h4">{formatNumber(66440)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Data Transferred
                  </Typography>
                  <Typography variant="h4">99.6 GB</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default MobilePerformanceReport;
