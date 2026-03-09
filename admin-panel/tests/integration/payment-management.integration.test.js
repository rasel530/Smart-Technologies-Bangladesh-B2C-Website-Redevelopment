/**
 * Admin Panel Payment Management Integration Tests
 * 
 * Comprehensive integration tests for admin panel payment management features
 * including transaction listing, filtering, refund processing, and analytics.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Import admin payment components
import PaymentManagement from '../../src/pages/payments/PaymentManagement';
import PaymentAnalyticsPage from '../../src/pages/payments/PaymentAnalyticsPage';
import PaymentLogsPage from '../../src/pages/payments/PaymentLogsPage';
import GatewaySettings from '../../src/pages/payments/GatewaySettings';

// Mock API calls
jest.mock('../../src/services/api', () => ({
  paymentApi: {
    getAllPayments: jest.fn(),
    getPaymentById: jest.fn(),
    processRefund: jest.fn(),
    getPaymentAnalytics: jest.fn(),
    getGatewaySettings: jest.fn(),
    updateGatewaySettings: jest.fn(),
    getPaymentLogs: jest.fn(),
    exportPayments: jest.fn()
  }
}));

const { paymentApi } = require('../../src/services/api');

// Test utilities
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false
      }
    }
  });
};

const renderWithProviders = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock payment data
const mockPayments = [
  {
    id: 'payment-1',
    orderId: 'order-1',
    orderNumber: 'ORD-001',
    userId: 'user-1',
    userEmail: 'user1@example.com',
    userName: 'John Doe',
    paymentMethod: 'CREDIT_CARD',
    amount: 1050.00,
    currency: 'BDT',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'payment-2',
    orderId: 'order-2',
    orderNumber: 'ORD-002',
    userId: 'user-2',
    userEmail: 'user2@example.com',
    userName: 'Jane Smith',
    paymentMethod: 'BKASH',
    amount: 2500.00,
    currency: 'BDT',
    status: 'completed',
    createdAt: '2024-01-16T14:30:00Z'
  },
  {
    id: 'payment-3',
    orderId: 'order-3',
    orderNumber: 'ORD-003',
    userId: 'user-3',
    userEmail: 'user3@example.com',
    userName: 'Bob Johnson',
    paymentMethod: 'NAGAD',
    amount: 1800.00,
    currency: 'BDT',
    status: 'failed',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 'payment-4',
    orderId: 'order-4',
    orderNumber: 'ORD-004',
    userId: 'user-4',
    userEmail: 'user4@example.com',
    userName: 'Alice Brown',
    paymentMethod: 'CREDIT_CARD',
    amount: 3200.00,
    currency: 'BDT',
    status: 'refunded',
    createdAt: '2024-01-18T16:45:00Z'
  }
];

describe('Admin Panel Payment Management Integration Tests', () => {
  beforeEach(() => {
    paymentApi.getAllPayments.mockResolvedValue({
      success: true,
      data: mockPayments,
      pagination: {
        page: 1,
        limit: 20,
        total: 4,
        totalPages: 1
      }
    });

    paymentApi.getPaymentById.mockResolvedValue({
      success: true,
      data: mockPayments[0]
    });

    paymentApi.getPaymentAnalytics.mockResolvedValue({
      success: true,
      data: {
        totalRevenue: 8550.00,
        totalTransactions: 4,
        successRate: 75.00,
        statusBreakdown: [
          { status: 'completed', count: 2 },
          { status: 'failed', count: 1 },
          { status: 'refunded', count: 1 }
        ],
        gatewayStats: [
          { paymentMethod: 'CREDIT_CARD', totalAmount: 4250.00, transactionCount: 2 },
          { paymentMethod: 'BKASH', totalAmount: 2500.00, transactionCount: 1 },
          { paymentMethod: 'NAGAD', totalAmount: 1800.00, transactionCount: 1 }
        ]
      }
    });

    paymentApi.getGatewaySettings.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'gateway-1',
          gateway: 'sslcommerz',
          isActive: true,
          isTestMode: true
        },
        {
          id: 'gateway-2',
          gateway: 'bkash',
          isActive: true,
          isTestMode: true
        },
        {
          id: 'gateway-3',
          gateway: 'nagad',
          isActive: true,
          isTestMode: true
        }
      ]
    });

    paymentApi.getPaymentLogs.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'log-1',
          transactionId: 'payment-1',
          eventType: 'PAYMENT_INITIATION',
          eventData: {},
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'log-2',
          transactionId: 'payment-1',
          eventType: 'PAYMENT_SUCCESS',
          eventData: {},
          createdAt: '2024-01-15T10:05:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1
      }
    });
  });

  describe('Payment Transactions List', () => {
    it('should load payment transactions list', async () => {
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-002')).toBeInTheDocument();
        expect(screen.getByText('ORD-003')).toBeInTheDocument();
        expect(screen.getByText('ORD-004')).toBeInTheDocument();
      });
    });

    it('should display payment details correctly', async () => {
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('1050.00 BDT')).toBeInTheDocument();
        expect(screen.getByText('CREDIT_CARD')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });

    it('should display pagination controls', async () => {
      paymentApi.getAllPayments.mockResolvedValue({
        success: true,
        data: mockPayments,
        pagination: {
          page: 1,
          limit: 2,
          total: 4,
          totalPages: 2
        }
      });

      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should handle pagination navigation', async () => {
      const user = userEvent.setup();
      
      paymentApi.getAllPayments.mockResolvedValue({
        success: true,
        data: mockPayments,
        pagination: {
          page: 2,
          limit: 2,
          total: 4,
          totalPages: 2
        }
      });

      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeInTheDocument();
      });
    });
  });

  describe('Payment Filtering and Searching', () => {
    it('should filter payments by status', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
      });

      // Select status filter
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOptions(statusFilter, 'completed');

      await waitFor(() => {
        expect(paymentApi.getAllPayments).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'completed' })
        );
      });
    });

    it('should filter payments by payment method', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
      });

      // Select payment method filter
      const methodFilter = screen.getByLabelText(/payment method/i);
      await user.selectOptions(methodFilter, 'CREDIT_CARD');

      await waitFor(() => {
        expect(paymentApi.getAllPayments).toHaveBeenCalledWith(
          expect.objectContaining({ paymentMethod: 'CREDIT_CARD' })
        );
      });
    });

    it('should filter payments by date range', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
      });

      // Select date range
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');

      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(paymentApi.getAllPayments).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
        );
      });
    });

    it('should search payments by order number', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
      });

      // Enter search term
      const searchInput = screen.getByPlaceholderText(/search by order number/i);
      await user.type(searchInput, 'ORD-001');

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction Details Display', () => {
    it('should display transaction details modal', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      // Click on transaction
      const transactionRow = screen.getByText('ORD-001').closest('tr');
      await user.click(transactionRow);

      await waitFor(() => {
        expect(screen.getByText('Transaction Details')).toBeInTheDocument();
        expect(screen.getByText('payment-1')).toBeInTheDocument();
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });
    });

    it('should display payment gateway response', async () => {
      paymentApi.getPaymentById.mockResolvedValue({
        success: true,
        data: {
          ...mockPayments[0],
          gatewayResponse: {
            tran_id: 'SSL-123456',
            card_type: 'VISA',
            amount: '1050.00'
          }
        }
      });

      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const transactionRow = screen.getByText('ORD-001').closest('tr');
      await user.click(transactionRow);

      await waitFor(() => {
        expect(screen.getByText('Gateway Response')).toBeInTheDocument();
        expect(screen.getByText('SSL-123456')).toBeInTheDocument();
      });
    });
  });

  describe('Refund Processing', () => {
    it('should open refund modal', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      // Click refund button
      const refundButton = screen.getByRole('button', { name: /refund/i });
      await user.click(refundButton);

      await waitFor(() => {
        expect(screen.getByText('Process Refund')).toBeInTheDocument();
      });
    });

    it('should validate refund amount', async () => {
      const user = userEvent.setup();
      
      paymentApi.processRefund.mockResolvedValue({
        success: true,
        refundId: 'REFUND-123',
        amount: 1050.00
      });

      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const refundButton = screen.getByRole('button', { name: /refund/i });
      await user.click(refundButton);

      // Enter invalid amount
      const amountInput = screen.getByLabelText(/refund amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '0');

      const confirmButton = screen.getByRole('button', { name: /confirm refund/i });
      await user.click(confirmButton);

      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });

    it('should process full refund successfully', async () => {
      const user = userEvent.setup();
      
      paymentApi.processRefund.mockResolvedValue({
        success: true,
        refundId: 'REFUND-123',
        amount: 1050.00
      });

      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const refundButton = screen.getByRole('button', { name: /refund/i });
      await user.click(refundButton);

      // Enter refund amount
      const amountInput = screen.getByLabelText(/refund amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '1050');

      // Enter refund reason
      const reasonInput = screen.getByLabelText(/refund reason/i);
      await user.type(reasonInput, 'Customer requested full refund');

      const confirmButton = screen.getByRole('button', { name: /confirm refund/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(paymentApi.processRefund).toHaveBeenCalledWith(
          'payment-1',
          1050.00,
          'Customer requested full refund'
        );
        expect(screen.getByText(/refund processed successfully/i)).toBeInTheDocument();
      });
    });

    it('should process partial refund successfully', async () => {
      const user = userEvent.setup();
      
      paymentApi.processRefund.mockResolvedValue({
        success: true,
        refundId: 'REFUND-456',
        amount: 500.00
      });

      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const refundButton = screen.getByRole('button', { name: /refund/i });
      await user.click(refundButton);

      // Enter partial refund amount
      const amountInput = screen.getByLabelText(/refund amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '500');

      const reasonInput = screen.getByLabelText(/refund reason/i);
      await user.type(reasonInput, 'Partial refund for damaged item');

      const confirmButton = screen.getByRole('button', { name: /confirm refund/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(paymentApi.processRefund).toHaveBeenCalledWith(
          'payment-1',
          500.00,
          'Partial refund for damaged item'
        );
      });
    });
  });

  describe('Payment Analytics Data', () => {
    it('should load payment analytics', async () => {
      renderWithProviders(<PaymentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Analytics')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('8,550.00 BDT')).toBeInTheDocument();
        expect(screen.getByText('Total Transactions')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('should display success rate', async () => {
      renderWithProviders(<PaymentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Success Rate')).toBeInTheDocument();
        expect(screen.getByText('75.00%')).toBeInTheDocument();
      });
    });

    it('should display status breakdown', async () => {
      renderWithProviders(<PaymentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Completed: 2')).toBeInTheDocument();
        expect(screen.getByText('Failed: 1')).toBeInTheDocument();
        expect(screen.getByText('Refunded: 1')).toBeInTheDocument();
      });
    });

    it('should display gateway statistics', async () => {
      renderWithProviders(<PaymentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gateway Statistics')).toBeInTheDocument();
        expect(screen.getByText('Credit Card')).toBeInTheDocument();
        expect(screen.getByText('4,250.00 BDT')).toBeInTheDocument();
        expect(screen.getByText('bKash')).toBeInTheDocument();
        expect(screen.getByText('2,500.00 BDT')).toBeInTheDocument();
        expect(screen.getByText('Nagad')).toBeInTheDocument();
        expect(screen.getByText('1,800.00 BDT')).toBeInTheDocument();
      });
    });

    it('should filter analytics by date range', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Analytics')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(paymentApi.getPaymentAnalytics).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
        );
      });
    });

    it('should filter analytics by gateway', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Analytics')).toBeInTheDocument();
      });

      const gatewayFilter = screen.getByLabelText(/gateway/i);
      await user.selectOptions(gatewayFilter, 'sslcommerz');

      await waitFor(() => {
        expect(paymentApi.getPaymentAnalytics).toHaveBeenCalledWith(
          expect.objectContaining({ gateway: 'sslcommerz' })
        );
      });
    });
  });

  describe('Payment Gateway Configuration', () => {
    it('should load gateway settings', async () => {
      renderWithProviders(<GatewaySettings />);

      await waitFor(() => {
        expect(screen.getByText('Payment Gateway Settings')).toBeInTheDocument();
        expect(screen.getByText('SSLCommerz')).toBeInTheDocument();
        expect(screen.getByText('bKash')).toBeInTheDocument();
        expect(screen.getByText('Nagad')).toBeInTheDocument();
      });
    });

    it('should display gateway status', async () => {
      renderWithProviders(<GatewaySettings />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Test Mode')).toBeInTheDocument();
      });
    });

    it('should update gateway settings', async () => {
      const user = userEvent.setup();
      
      paymentApi.updateGatewaySettings.mockResolvedValue({
        success: true,
        data: {
          gateway: 'sslcommerz',
          isActive: true,
          isTestMode: false
        }
      });

      renderWithProviders(<GatewaySettings />);

      await waitFor(() => {
        expect(screen.getByText('SSLCommerz')).toBeInTheDocument();
      });

      // Toggle test mode
      const testModeToggle = screen.getByLabelText(/test mode/i);
      await user.click(testModeToggle);

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(paymentApi.updateGatewaySettings).toHaveBeenCalledWith(
          'sslcommerz',
          expect.objectContaining({ isTestMode: false })
        );
        expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should deactivate gateway', async () => {
      const user = userEvent.setup();
      
      paymentApi.updateGatewaySettings.mockResolvedValue({
        success: true,
        data: {
          gateway: 'bkash',
          isActive: false
        }
      });

      renderWithProviders(<GatewaySettings />);

      await waitFor(() => {
        expect(screen.getByText('bKash')).toBeInTheDocument();
      });

      // Toggle active status
      const activeToggle = screen.getByLabelText(/active/i);
      await user.click(activeToggle);

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(paymentApi.updateGatewaySettings).toHaveBeenCalledWith(
          'bkash',
          expect.objectContaining({ isActive: false })
        );
      });
    });
  });

  describe('Payment Logs Display', () => {
    it('should load payment logs', async () => {
      renderWithProviders(<PaymentLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Logs')).toBeInTheDocument();
        expect(screen.getByText('PAYMENT_INITIATION')).toBeInTheDocument();
        expect(screen.getByText('PAYMENT_SUCCESS')).toBeInTheDocument();
      });
    });

    it('should filter logs by event type', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Logs')).toBeInTheDocument();
      });

      const eventTypeFilter = screen.getByLabelText(/event type/i);
      await user.selectOptions(eventTypeFilter, 'PAYMENT_INITIATION');

      await waitFor(() => {
        expect(paymentApi.getPaymentLogs).toHaveBeenCalledWith(
          expect.objectContaining({ eventType: 'PAYMENT_INITIATION' })
        );
      });
    });

    it('should filter logs by transaction ID', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Logs')).toBeInTheDocument();
      });

      const transactionInput = screen.getByPlaceholderText(/transaction id/i);
      await user.type(transactionInput, 'payment-1');

      await waitFor(() => {
        expect(paymentApi.getPaymentLogs).toHaveBeenCalledWith(
          expect.objectContaining({ transactionId: 'payment-1' })
        );
      });
    });

    it('should display log details', async () => {
      paymentApi.getPaymentLogs.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'log-1',
            transactionId: 'payment-1',
            eventType: 'PAYMENT_INITIATION',
            eventData: {
              amount: 1050.00,
              currency: 'BDT',
              paymentMethod: 'CREDIT_CARD'
            },
            ipAddress: '192.168.1.1',
            createdAt: '2024-01-15T10:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1
        }
      });

      renderWithProviders(<PaymentLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
        expect(screen.getByText('1050.00 BDT')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export payments to CSV', async () => {
      const user = userEvent.setup();
      
      paymentApi.exportPayments.mockResolvedValue({
        success: true,
        data: 'data:text/csv;charset=utf-8,Order,Amount\nORD-001,1050.00\nORD-002,2500.00'
      });

      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(paymentApi.exportPayments).toHaveBeenCalled();
      });
    });

    it('should export filtered payments', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<PaymentManagement />);

      await waitFor(() => {
        expect(screen.getByText('Payment Transactions')).toBeInTheDocument();
      });

      // Apply filter
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOptions(statusFilter, 'completed');

      const exportButton = screen.getByRole('button', { name: /export csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(paymentApi.exportPayments).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'completed' })
        );
      });
    });
  });
});
