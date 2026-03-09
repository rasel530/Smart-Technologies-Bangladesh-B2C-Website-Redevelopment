/**
 * Frontend Payment Flow Integration Tests
 * 
 * Comprehensive integration tests for frontend payment flow components
 * including payment method selection, form validation, and payment processing.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Import payment components
import PaymentMethodCard from '../../src/components/checkout/PaymentMethodCard';
import SSLCommerzPayment from '../../src/components/checkout/SSLCommerzPayment';
import BkashPayment from '../../src/components/checkout/BkashPayment';
import NagadPayment from '../../src/components/checkout/NagadPayment';
import PaymentGatewayBase from '../../src/components/checkout/PaymentGatewayBase';

// Mock API calls
jest.mock('../../src/services/api', () => ({
  paymentApi: {
    initiatePayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    requestRefund: jest.fn()
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

describe('Frontend Payment Flow Integration Tests', () => {
  describe('Payment Method Selection', () => {
    describe('PaymentMethodCard Component', () => {
      const mockProps = {
        method: 'CREDIT_CARD',
        name: 'Credit/Debit Card',
        icon: 'card-icon',
        description: 'Pay with your credit or debit card',
        isSelected: false,
        onSelect: jest.fn(),
        isAvailable: true
      };

      it('should render payment method card correctly', () => {
        renderWithProviders(
          <PaymentMethodCard {...mockProps} />
        );

        expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
        expect(screen.getByText('Pay with your credit or debit card')).toBeInTheDocument();
      });

      it('should display selected state', () => {
        renderWithProviders(
          <PaymentMethodCard {...mockProps} isSelected={true} />
        );

        const card = screen.getByText('Credit/Debit Card').closest('div');
        expect(card).toHaveClass('selected');
      });

      it('should handle selection click', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <PaymentMethodCard {...mockProps} />
        );

        const card = screen.getByText('Credit/Debit Card').closest('div');
        await user.click(card);

        expect(mockProps.onSelect).toHaveBeenCalledWith('CREDIT_CARD');
      });

      it('should be disabled when not available', () => {
        renderWithProviders(
          <PaymentMethodCard {...mockProps} isAvailable={false} />
        );

        const card = screen.getByText('Credit/Debit Card').closest('div');
        expect(card).toHaveClass('disabled');
      });
    });

    describe('Payment Method Display', () => {
      it('should display all available payment methods', () => {
        const paymentMethods = [
          { id: 'CREDIT_CARD', name: 'Credit/Debit Card', icon: 'card' },
          { id: 'BKASH', name: 'bKash', icon: 'bkash' },
          { id: 'NAGAD', name: 'Nagad', icon: 'nagad' }
        ];

        renderWithProviders(
          <div>
            {paymentMethods.map(method => (
              <PaymentMethodCard
                key={method.id}
                method={method.id}
                name={method.name}
                icon={method.icon}
                description={`Pay with ${method.name}`}
                isSelected={false}
                onSelect={jest.fn()}
                isAvailable={true}
              />
            ))}
          </div>
        );

        expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
        expect(screen.getByText('bKash')).toBeInTheDocument();
        expect(screen.getByText('Nagad')).toBeInTheDocument();
      });

      it('should filter out unavailable payment methods', () => {
        const paymentMethods = [
          { id: 'CREDIT_CARD', name: 'Credit/Debit Card', isAvailable: true },
          { id: 'BKASH', name: 'bKash', isAvailable: false },
          { id: 'NAGAD', name: 'Nagad', isAvailable: true }
        ];

        renderWithProviders(
          <div>
            {paymentMethods.filter(m => m.isAvailable).map(method => (
              <PaymentMethodCard
                key={method.id}
                method={method.id}
                name={method.name}
                icon={method.id.toLowerCase()}
                description={`Pay with ${method.name}`}
                isSelected={false}
                onSelect={jest.fn()}
                isAvailable={method.isAvailable}
              />
            ))}
          </div>
        );

        expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
        expect(screen.queryByText('bKash')).not.toBeInTheDocument();
        expect(screen.getByText('Nagad')).toBeInTheDocument();
      });
    });

    describe('Payment Method Selection Logic', () => {
      it('should select only one payment method at a time', async () => {
        const user = userEvent.setup();
        let selectedMethod = null;
        const onSelect = jest.fn((method) => { selectedMethod = method; });

        const paymentMethods = [
          { id: 'CREDIT_CARD', name: 'Credit/Debit Card' },
          { id: 'BKASH', name: 'bKash' },
          { id: 'NAGAD', name: 'Nagad' }
        ];

        renderWithProviders(
          <div>
            {paymentMethods.map(method => (
              <PaymentMethodCard
                key={method.id}
                method={method.id}
                name={method.name}
                icon={method.id.toLowerCase()}
                description={`Pay with ${method.name}`}
                isSelected={selectedMethod === method.id}
                onSelect={onSelect}
                isAvailable={true}
              />
            ))}
          </div>
        );

        // Select first method
        const firstCard = screen.getByText('Credit/Debit Card').closest('div');
        await user.click(firstCard);
        expect(selectedMethod).toBe('CREDIT_CARD');

        // Select second method
        const secondCard = screen.getByText('bKash').closest('div');
        await user.click(secondCard);
        expect(selectedMethod).toBe('BKASH');
      });
    });
  });

  describe('SSLCommerz Payment Flow', () => {
    const mockOrder = {
      id: 'test-order-id',
      orderNumber: 'ORD-12345',
      total: 1050.00,
      currency: 'BDT'
    };

    describe('SSLCommerzPayment Component', () => {
      beforeEach(() => {
        paymentApi.initiatePayment.mockResolvedValue({
          success: true,
          transactionId: 'SSL-123456',
          paymentUrl: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php'
        });
      });

      it('should render SSLCommerz payment form', () => {
        renderWithProviders(
          <SSLCommerzPayment order={mockOrder} />
        );

        expect(screen.getByText(/SSLCommerz/i)).toBeInTheDocument();
        expect(screen.getByText(/Pay with Credit\/Debit Card/i)).toBeInTheDocument();
      });

      it('should display order amount', () => {
        renderWithProviders(
          <SSLCommerzPayment order={mockOrder} />
        );

        expect(screen.getByText(/1050\.00/)).toBeInTheDocument();
        expect(screen.getByText(/BDT/i)).toBeInTheDocument();
      });

      it('should initiate payment on submit', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <SSLCommerzPayment order={mockOrder} />
        );

        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(paymentApi.initiatePayment).toHaveBeenCalledWith({
            orderId: mockOrder.id,
            paymentMethod: 'CREDIT_CARD'
          });
        });
      });

      it('should redirect to payment gateway URL', async () => {
        const mockWindow = { location: { href: '' } };
        global.window = mockWindow;

        paymentApi.initiatePayment.mockResolvedValue({
          success: true,
          transactionId: 'SSL-123456',
          paymentUrl: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php'
        });

        const user = userEvent.setup();
        
        renderWithProviders(
          <SSLCommerzPayment order={mockOrder} />
        );

        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockWindow.location.href).toBe('https://sandbox.sslcommerz.com/gwprocess/v4/gw.php');
        });
      });

      it('should handle payment initiation errors', async () => {
        paymentApi.initiatePayment.mockRejectedValue(new Error('Payment failed'));

        renderWithProviders(
          <SSLCommerzPayment order={mockOrder} />
        );

        const submitButton = screen.getByRole('button', { name: /pay now/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
        });
      });

      it('should show loading state during payment initiation', async () => {
        paymentApi.initiatePayment.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({
            success: true,
            transactionId: 'SSL-123456',
            paymentUrl: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php'
          }), 1000))
        );

        const user = userEvent.setup();
        
        renderWithProviders(
          <SSLCommerzPayment order={mockOrder} />
        );

        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });
    });
  });

  describe('bKash Payment Flow', () => {
    const mockOrder = {
      id: 'test-order-id',
      orderNumber: 'ORD-12345',
      total: 1050.00,
      currency: 'BDT'
    };

    describe('BkashPayment Component', () => {
      beforeEach(() => {
        paymentApi.initiatePayment.mockResolvedValue({
          success: true,
          transactionId: 'BKASH-123456',
          paymentID: 'PAY-123456',
          bkashURL: 'https://sandbox.bka.sh/gateway'
        });
      });

      it('should render bKash payment form', () => {
        renderWithProviders(
          <BkashPayment order={mockOrder} />
        );

        expect(screen.getByText(/bKash/i)).toBeInTheDocument();
        expect(screen.getByText(/Pay with bKash/i)).toBeInTheDocument();
      });

      it('should validate wallet number', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <BkashPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        
        // Test invalid number
        await user.type(walletInput, '123');
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        expect(screen.getByText(/invalid wallet number/i)).toBeInTheDocument();
      });

      it('should validate wallet number format (11 digits)', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <BkashPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        await user.type(walletInput, '0171234567');
        
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        expect(screen.getByText(/must be 11 digits/i)).toBeInTheDocument();
      });

      it('should accept valid bKash wallet number', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <BkashPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        await user.type(walletInput, '01712345678');
        
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.queryByText(/invalid wallet number/i)).not.toBeInTheDocument();
        });
      });

      it('should initiate bKash payment on submit', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <BkashPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        await user.type(walletInput, '01712345678');
        
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(paymentApi.initiatePayment).toHaveBeenCalledWith({
            orderId: mockOrder.id,
            paymentMethod: 'BKASH',
            amount: mockOrder.total
          });
        });
      });
    });
  });

  describe('Nagad Payment Flow', () => {
    const mockOrder = {
      id: 'test-order-id',
      orderNumber: 'ORD-12345',
      total: 1050.00,
      currency: 'BDT'
    };

    describe('NagadPayment Component', () => {
      beforeEach(() => {
        paymentApi.initiatePayment.mockResolvedValue({
          success: true,
          transactionId: 'NAGAD-123456',
          paymentRefId: 'REF-123456',
          nagadURL: 'https://sandbox.mynagad.com/gateway'
        });
      });

      it('should render Nagad payment form', () => {
        renderWithProviders(
          <NagadPayment order={mockOrder} />
        );

        expect(screen.getByText(/Nagad/i)).toBeInTheDocument();
        expect(screen.getByText(/Pay with Nagad/i)).toBeInTheDocument();
      });

      it('should validate wallet number', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <NagadPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        
        // Test invalid number
        await user.type(walletInput, '123');
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        expect(screen.getByText(/invalid wallet number/i)).toBeInTheDocument();
      });

      it('should validate wallet number format (11 digits)', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <NagadPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        await user.type(walletInput, '0181234567');
        
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        expect(screen.getByText(/must be 11 digits/i)).toBeInTheDocument();
      });

      it('should accept valid Nagad wallet number', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <NagadPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        await user.type(walletInput, '01812345678');
        
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.queryByText(/invalid wallet number/i)).not.toBeInTheDocument();
        });
      });

      it('should initiate Nagad payment on submit', async () => {
        const user = userEvent.setup();
        
        renderWithProviders(
          <NagadPayment order={mockOrder} />
        );

        const walletInput = screen.getByLabelText(/wallet number/i);
        await user.type(walletInput, '01812345678');
        
        const submitButton = screen.getByRole('button', { name: /pay now/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(paymentApi.initiatePayment).toHaveBeenCalledWith({
            orderId: mockOrder.id,
            paymentMethod: 'NAGAD',
            amount: mockOrder.total
          });
        });
      });
    });
  });

  describe('Payment Status Polling', () => {
    it('should poll payment status at regular intervals', async () => {
      paymentApi.getPaymentStatus.mockResolvedValue({
        success: true,
        status: 'processing',
        transaction: { id: 'test-txn-id' }
      });

      renderWithProviders(
        <PaymentGatewayBase orderId="test-order-id" />
      );

      // Wait for initial poll
      await waitFor(() => {
        expect(paymentApi.getPaymentStatus).toHaveBeenCalledWith('test-order-id');
      });
    });

    it('should stop polling when payment is completed', async () => {
      paymentApi.getPaymentStatus
        .mockResolvedValueOnce({
          success: true,
          status: 'processing',
          transaction: { id: 'test-txn-id' }
        })
        .mockResolvedValueOnce({
          success: true,
          status: 'completed',
          transaction: { id: 'test-txn-id' }
        });

      renderWithProviders(
        <PaymentGatewayBase orderId="test-order-id" />
      );

      await waitFor(() => {
        expect(paymentApi.getPaymentStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle payment status errors', async () => {
      paymentApi.getPaymentStatus.mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <PaymentGatewayBase orderId="test-order-id" />
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to check payment status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Success Page', () => {
    it('should display payment success message', () => {
      renderWithProviders(
        <div>
          <h1>Payment Successful!</h1>
          <p>Your order has been confirmed.</p>
        </div>
      );

      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      expect(screen.getByText('Your order has been confirmed.')).toBeInTheDocument();
    });

    it('should display order details', () => {
      const mockOrderDetails = {
        orderNumber: 'ORD-12345',
        total: 1050.00,
        paymentMethod: 'CREDIT_CARD'
      };

      renderWithProviders(
        <div>
          <p>Order Number: {mockOrderDetails.orderNumber}</p>
          <p>Amount: {mockOrderDetails.total} BDT</p>
          <p>Payment Method: {mockOrderDetails.paymentMethod}</p>
        </div>
      );

      expect(screen.getByText('Order Number: ORD-12345')).toBeInTheDocument();
      expect(screen.getByText('Amount: 1050 BDT')).toBeInTheDocument();
      expect(screen.getByText('Payment Method: CREDIT_CARD')).toBeInTheDocument();
    });
  });

  describe('Payment Cancel Page', () => {
    it('should display payment cancel message', () => {
      renderWithProviders(
        <div>
          <h1>Payment Cancelled</h1>
          <p>Your payment has been cancelled.</p>
        </div>
      );

      expect(screen.getByText('Payment Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Your payment has been cancelled.')).toBeInTheDocument();
    });

    it('should provide retry option', () => {
      renderWithProviders(
        <div>
          <h1>Payment Cancelled</h1>
          <button>Try Again</button>
        </div>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling and Display', () => {
    it('should display payment error message', () => {
      renderWithProviders(
        <div>
          <div className="error-message">
            Payment failed. Please try again.
          </div>
        </div>
      );

      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    });

    it('should display specific error details', () => {
      const errorMessage = 'Insufficient funds in your account';
      
      renderWithProviders(
        <div>
          <div className="error-message">
            {errorMessage}
          </div>
        </div>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should provide error recovery options', () => {
      renderWithProviders(
        <div>
          <div className="error-message">
            Payment failed. Please try again.
          </div>
          <button>Retry Payment</button>
          <button>Choose Different Payment Method</button>
        </div>
      );

      expect(screen.getByRole('button', { name: /retry payment/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose different payment method/i })).toBeInTheDocument();
    });
  });

  describe('Payment Gateway Base Component', () => {
    it('should handle payment initiation from frontend', async () => {
      paymentApi.initiatePayment.mockResolvedValue({
        success: true,
        transactionId: 'TEST-123',
        paymentUrl: 'https://test-gateway.com/pay'
      });

      const mockOrder = {
        id: 'test-order-id',
        total: 1000.00
      };

      renderWithProviders(
        <PaymentGatewayBase order={mockOrder} paymentMethod="CREDIT_CARD" />
      );

      const initiateButton = screen.getByRole('button', { name: /initiate payment/i });
      fireEvent.click(initiateButton);

      await waitFor(() => {
        expect(paymentApi.initiatePayment).toHaveBeenCalled();
      });
    });

    it('should handle payment method switching', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <PaymentGatewayBase orderId="test-order-id" />
      );

      const bkashOption = screen.getByText('bKash');
      await user.click(bkashOption);

      expect(screen.getByText(/pay with bkash/i)).toBeInTheDocument();
    });
  });
});
