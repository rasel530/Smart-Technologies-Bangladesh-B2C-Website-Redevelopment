import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Container } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';

// Import Payment Pages
import PaymentManagement from './pages/payments/PaymentManagement';
import PaymentAnalyticsPage from './pages/payments/PaymentAnalyticsPage';
import GatewaySettings from './pages/payments/GatewaySettings';
import PaymentLogsPage from './pages/payments/PaymentLogsPage';

// Import Local Payment Pages
import PaymentMethodManagement from './pages/localPayment/PaymentMethodManagement';
import SmsSubscriptionManagement from './pages/localPayment/SmsSubscriptionManagement';

// Import Other Pages
import RecoveryStats from './pages/cart/RecoveryStats';
import RecoveryManagement from './pages/cart/RecoveryManagement';
import RecoverySettings from './pages/cart/RecoverySettings';
import CodSettingsManagement from './pages/cod/CodSettingsManagement';
import EmiPlanManagement from './pages/emi/EmiPlanManagement';
import EmiProviderManagement from './pages/emi/EmiProviderManagement';
import MobileAnalyticsDashboard from './pages/mobile/MobileAnalyticsDashboard';
import MobilePerformanceReport from './pages/mobile/MobilePerformanceReport';
import OfflineSyncManagement from './pages/mobile/OfflineSyncManagement';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Layout component with sidebar
const Layout = () => (
  <Box sx={{ display: 'flex' }}>
    <Navigation />
    <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#fafafa' }}>
      <Container maxWidth="xl">
        <Outlet />
      </Container>
    </Box>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/admin/payments" replace />} />

          {/* Main Layout Route */}
          <Route element={<Layout />}>
            {/* Payment Management Routes */}
            <Route path="/admin/payments" element={<PaymentManagement />} />
            <Route path="/admin/payments/analytics" element={<PaymentAnalyticsPage />} />
            <Route path="/admin/payments/gateways" element={<GatewaySettings />} />
            <Route path="/admin/payments/logs" element={<PaymentLogsPage />} />

            {/* Local Payment Routes */}
            <Route path="/admin/local-payment/methods" element={<PaymentMethodManagement />} />
            <Route path="/admin/local-payment/sms-subscriptions" element={<SmsSubscriptionManagement />} />

            {/* Cart Recovery Routes */}
            <Route path="/admin/cart/recovery" element={<RecoveryManagement />} />
            <Route path="/admin/cart/recovery/settings" element={<RecoverySettings />} />
            <Route path="/admin/cart/recovery/stats" element={<RecoveryStats />} />

            {/* COD Management Routes */}
            <Route path="/admin/cod" element={<CodSettingsManagement />} />

            {/* EMI Management Routes */}
            <Route path="/admin/emi/plans" element={<EmiPlanManagement />} />
            <Route path="/admin/emi/providers" element={<EmiProviderManagement />} />

            {/* Mobile Management Routes */}
            <Route path="/admin/mobile" element={<MobileAnalyticsDashboard />} />
            <Route path="/admin/mobile/performance" element={<MobilePerformanceReport />} />
            <Route path="/admin/mobile/sync" element={<OfflineSyncManagement />} />
          </Route>

          {/* Catch all - redirect to payments */}
          <Route path="*" element={<Navigate to="/admin/payments" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
