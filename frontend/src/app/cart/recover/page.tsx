'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CartRecoveryPage } from '@/components/cart/CartRecoveryPage';
import { InvalidTokenPage } from '@/components/cart/InvalidTokenPage';
import { AlreadyRecoveredPage } from '@/components/cart/AlreadyRecoveredPage';
import { Skeleton } from '@/components/ui/skeleton';
import { cartRecoveryApi } from '@/lib/api/cartRecovery';

interface CartData {
  id: string;
  status: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productNameBn: string;
    sku: string;
    quantity: number;
    price: number;
    subtotal: number;
    image: string | null;
    variant: {
      id: string;
      name: string;
    } | null;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  discountCode: string | null;
  discountAmount: number | null;
  abandonedAt: string;
  recoveryAttempts: number;
  expiryDate: string;
}

export default function CartRecoverPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No recovery token provided');
      setErrorCode('NO_TOKEN');
      setIsLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setIsLoading(true);
      const response = await cartRecoveryApi.validateToken(token!);
      
      if (response.success) {
        setCartData(response.data);
      } else {
        setError(response.error || 'Invalid recovery token');
        setErrorCode(response.errorCode || 'INVALID_TOKEN');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate recovery token');
      setErrorCode('VALIDATION_ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    if (errorCode === 'ALREADY_CONVERTED' || errorCode === 'ALREADY_ACTIVE') {
      return <AlreadyRecoveredPage message={error} />;
    }
    return <InvalidTokenPage error={error} errorCode={errorCode} />;
  }

  if (!cartData) {
    return <InvalidTokenPage error="Cart data not found" />;
  }

  return <CartRecoveryPage cartData={cartData} token={token!} />;
}
