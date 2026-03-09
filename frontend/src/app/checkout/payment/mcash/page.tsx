/**
 * MCash Payment Page
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Page for MCash mobile wallet payment processing
 * Note: MCash is mapped to SSLCommerz gateway in backend
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SSLCommerzPayment } from '@/components/checkout/SSLCommerzPayment';

/**
 * MCash Payment Page
 */
export default function MCashPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [orderId, setOrderId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID and amount from URL params or session storage
    const orderIdParam = searchParams.get('orderId');
    const amountParam = searchParams.get('amount');
    
    if (orderIdParam && amountParam) {
      setOrderId(orderIdParam);
      setAmount(parseFloat(amountParam));
      setIsLoading(false);
    } else {
      // Try to get from session storage
      const storedOrderId = sessionStorage.getItem('payment_orderId');
      const storedAmount = sessionStorage.getItem('payment_amount');
      
      if (storedOrderId && storedAmount) {
        setOrderId(storedOrderId);
        setAmount(parseFloat(storedAmount));
        setIsLoading(false);
      } else {
        setError('Missing order information. Please start checkout again.');
        setIsLoading(false);
      }
    }
  }, [searchParams]);

  const handlePaymentSuccess = (transactionId: string) => {
    // Store transaction ID
    sessionStorage.setItem('payment_transactionId', transactionId);
    
    // Redirect to success page
    router.push(`/checkout/payment/success?orderId=${orderId}&transactionId=${transactionId}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Redirect to error page or show error message
    router.push(`/checkout/payment/cancel?orderId=${orderId}&error=${encodeURIComponent(error)}`);
  };

  const handleCancel = () => {
    // Redirect back to payment method selection
    router.push('/checkout/payment');
  };

  if (isLoading) {
    return (
      <div className="payment-page-loading">
        <div className="loading-spinner" role="status" aria-live="polite">
          <div className="spinner"></div>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page-error">
        <div className="error-container" role="alert" aria-live="assertive">
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/checkout/payment')}>
            Back to Payment Methods
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page-container">
      <div className="payment-page-header">
        <h1>MCash Payment</h1>
        <p>Complete your payment using your MCash mobile wallet</p>
      </div>
      
      <SSLCommerzPayment
        orderId={orderId}
        amount={amount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onCancel={handleCancel}
      />
    </div>
  );
}
