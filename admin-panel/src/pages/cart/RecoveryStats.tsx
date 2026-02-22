import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  useTheme,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Email,
  Mouse,
  ShoppingCart,
  Refresh,
  DateRange,
  GetApp,
  Info,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Types
interface RecoveryStats {
  summary: {
    totalAbandoned: number;
    totalRecovered: number;
    totalPending: number;
    recoveryRate: number;
    totalRecoveredRevenue: number;
    averageOrderValue: number;
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    openRate: number;
    clickRate: number;
  };
  dailyStats: {
    date: string;
    abandoned: number;
    recovered: number;
    revenue: number;
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
  }[];
  templateStats: {
    template: string;
    sent: number;
    opened: number;
    clicked: number;
    recovered: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    recoveryRate: number;
  }[];
  discountStats: {
    discountAmount: number;
    used: number;
    recovered: number;
    revenue: number;
    conversionRate: number;
  }[];
  hourlyStats: {
    hour: number;
    sent: number;
    opened: number;
    clicked: number;
    recovered: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const RecoveryStats: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<string>('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/cart/recovery/stats?days=${dateRange}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching recovery stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setDateRange(event.target.value);
  };

  const handleExport = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Date', 'Abandoned', 'Recovered', 'Revenue', 'Emails Sent', 'Emails Opened', 'Emails Clicked'].join(','),
      ...stats.dailyStats.map(day => 
        [day.date, day.abandoned, day.recovered, day.revenue, day.emailsSent, day.emailsOpened, day.emailsClicked].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
    color: string;
  }> = ({ title, value, subtitle, icon, trend, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1}>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend >= 0 ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: trend >= 0 ? 'success.main' : 'error.main', ml: 0.5 }}
                >
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { color: color, fontSize: 28 },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box p={3}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Cart Recovery Statistics
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select value={dateRange} onChange={handleDateRangeChange} label="Date Range">
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh className={refreshing ? 'spin' : ''} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExport}
            disabled={!stats}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {stats && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Recovery Rate"
                value={formatPercentage(stats.summary.recoveryRate)}
                subtitle={`${stats.summary.totalRecovered} of ${stats.summary.totalAbandoned} carts`}
                icon={<ShoppingCart />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Recovered Revenue"
                value={formatCurrency(stats.summary.totalRecoveredRevenue)}
                subtitle={`Avg. Order: ${formatCurrency(stats.summary.averageOrderValue)}`}
                icon={<AttachMoney />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Email Open Rate"
                value={formatPercentage(stats.summary.openRate)}
                subtitle={`${stats.summary.emailsOpened} of ${stats.summary.emailsSent} opened`}
                icon={<Email />}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Click Rate"
                value={formatPercentage(stats.summary.clickRate)}
                subtitle={`${stats.summary.emailsClicked} clicks total`}
                icon={<MousePointer />}
                color={theme.palette.warning.main}
              />
            </Grid>
          </Grid>

          {/* Charts Row 1 */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recovery Trend
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                        />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value: number) => [value, '']}
                          labelFormatter={(label) =>
                            new Date(label).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          }
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="abandoned"
                          stackId="1"
                          stroke={theme.palette.error.main}
                          fill={theme.palette.error.light}
                          name="Abandoned"
                        />
                        <Area
                          type="monotone"
                          dataKey="recovered"
                          stackId="1"
                          stroke={theme.palette.success.main}
                          fill={theme.palette.success.light}
                          name="Recovered"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Email Performance
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Opened', value: stats.summary.emailsOpened },
                            { name: 'Sent Only', value: stats.summary.emailsSent - stats.summary.emailsOpened },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill={theme.palette.success.main} />
                          <Cell fill={theme.palette.grey[300]} />
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box display="flex" justifyContent="space-around" mt={2}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="success.main">
                        {formatPercentage(stats.summary.openRate)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Open Rate
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary.main">
                        {formatPercentage(stats.summary.clickRate)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Click Rate
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Row 2 */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue from Recovery
                  </Typography>
                  <Box height={250}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                        />
                        <YAxis tickFormatter={(value) => `৳${value / 1000}k`} />
                        <RechartsTooltip
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        />
                        <Bar
                          dataKey="revenue"
                          fill={theme.palette.success.main}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Best Send Times (Hourly Performance)
                  </Typography>
                  <Box height={250}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.hourlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                        <YAxis />
                        <RechartsTooltip
                          labelFormatter={(h) => `${h}:00 - ${h}:59`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="opened"
                          stroke={theme.palette.info.main}
                          strokeWidth={2}
                          name="Opens"
                        />
                        <Line
                          type="monotone"
                          dataKey="clicked"
                          stroke={theme.palette.success.main}
                          strokeWidth={2}
                          name="Clicks"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Template Performance Table */}
          <Card mb={4}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Template</TableCell>
                      <TableCell align="right">Sent</TableCell>
                      <TableCell align="right">Opened</TableCell>
                      <TableCell align="right">Clicked</TableCell>
                      <TableCell align="right">Recovered</TableCell>
                      <TableCell align="right">Open Rate</TableCell>
                      <TableCell align="right">Recovery Rate</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.templateStats.map((template) => (
                      <TableRow key={template.template}>
                        <TableCell>
                          <Chip
                            label={template.template}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{template.sent}</TableCell>
                        <TableCell align="right">{template.opened}</TableCell>
                        <TableCell align="right">{template.clicked}</TableCell>
                        <TableCell align="right">{template.recovered}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(template.openRate)}
                            color={template.openRate > 20 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(template.recoveryRate)}
                            color={template.recoveryRate > 5 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(template.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Discount Performance */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Discount Code Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Discount</TableCell>
                      <TableCell align="right">Codes Used</TableCell>
                      <TableCell align="right">Carts Recovered</TableCell>
                      <TableCell align="right">Conversion Rate</TableCell>
                      <TableCell align="right">Revenue Generated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.discountStats.map((discount) => (
                      <TableRow key={discount.discountAmount}>
                        <TableCell>
                          <Chip
                            label={`${discount.discountAmount}% OFF`}
                            color="secondary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{discount.used}</TableCell>
                        <TableCell align="right">{discount.recovered}</TableCell>
                        <TableCell align="right">
                          {formatPercentage(discount.conversionRate)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(discount.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default RecoveryStats;
