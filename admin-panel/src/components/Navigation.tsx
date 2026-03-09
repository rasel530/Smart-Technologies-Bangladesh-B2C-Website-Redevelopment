import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box, Typography } from '@mui/material';
import { Payment, Dashboard, Settings, Description, ShoppingCart, Phone, Money, Analytics } from '@mui/icons-material';

const Navigation: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      category: 'Payment Management',
      items: [
        { text: 'Payments', icon: <Payment />, path: '/admin/payments' },
        { text: 'Analytics', icon: <Analytics />, path: '/admin/payments/analytics' },
        { text: 'Gateways', icon: <Settings />, path: '/admin/payments/gateways' },
        { text: 'Logs', icon: <Description />, path: '/admin/payments/logs' },
      ],
    },
    {
      category: 'Local Payment',
      items: [
        { text: 'Payment Methods', icon: <Money />, path: '/admin/local-payment/methods' },
        { text: 'SMS Subscriptions', icon: <Phone />, path: '/admin/local-payment/sms-subscriptions' },
      ],
    },
    {
      category: 'Cart Recovery',
      items: [
        { text: 'Recovery', icon: <ShoppingCart />, path: '/admin/cart/recovery' },
        { text: 'Settings', icon: <Settings />, path: '/admin/cart/recovery/settings' },
        { text: 'Stats', icon: <Dashboard />, path: '/admin/cart/recovery/stats' },
      ],
    },
  ];

  return (
    <Box sx={{ width: 250, height: '100vh', backgroundColor: '#f5f5f5', overflow: 'auto' }}>
      <Box sx={{ p: 2, backgroundColor: '#1976d2', color: 'white' }}>
        <Typography variant="h6" component="div">
          Admin Panel
        </Typography>
        <Typography variant="caption" component="div">
          Smart Tech B2C
        </Typography>
      </Box>
      {menuItems.map((section, index) => (
        <Box key={index}>
          <Divider />
          <Typography variant="subtitle2" sx={{ px: 2, pt: 2, pb: 1, color: '#666' }}>
            {section.category}
          </Typography>
          <List>
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      '&:hover': {
                        backgroundColor: '#bbdefb',
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
      <Divider />
    </Box>
  );
};

export default Navigation;
