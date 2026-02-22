'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Clock, 
  Tag, 
  Package, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { cartRecoveryApi } from '@/lib/api/cartRecovery';

interface CartItem {
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
}

interface CartData {
  id: string;
  status: string;
  items: CartItem[];
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

interface CartRecoveryPageProps {
  cartData: CartData;
  token: string;
}

export function CartRecoveryPage({ cartData, token }: CartRecoveryPageProps) {
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState(false);
  const [isRecovered, setIsRecovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecoverCart = async () => {
    try {
      setIsRecovering(true);
      setError(null);

      const response = await cartRecoveryApi.recoverCart(token);

      if (response.success) {
        setIsRecovered(true);
        // Redirect to cart page after a short delay
        setTimeout(() => {
          router.push('/cart');
        }, 2000);
      } else {
        setError(response.error || 'Failed to recover cart');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsRecovering(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysSinceAbandoned = Math.floor(
    (new Date().getTime() - new Date(cartData.abandonedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isRecovered) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cart Recovered Successfully!
          </h1>
          <p className="text-gray-600">
            Your cart has been restored. Redirecting to checkout...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            আপনার কার্ট পুনরুদ্ধার করা হয়েছে। চেকআউট পেজে নিয়ে যাওয়া হচ্ছে...
          </p>
        </div>
        <Link href="/cart">
          <Button size="lg" className="bg-[#006a4e] hover:bg-[#005a3e]">
            Go to Cart Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Cart is Waiting!
        </h1>
        <p className="text-gray-600">
          We've saved your items. Complete your purchase now!
        </p>
        <p className="text-sm text-[#006a4e] mt-1">
          আমরা আপনার আইটেমগুলো সংরক্ষণ করে রেখেছি। এখনই কেনাকাটা সম্পূর্ণ করুন!
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart Items ({cartData.items.length})
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysSinceAbandoned} days ago
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartData.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-white rounded-md overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {item.productNameBn}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-1">
                        {item.variant.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </span>
                      <span className="font-semibold text-[#006a4e]">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Urgency Message */}
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Limited Time:</strong> Items in your cart are reserved for a limited time. 
              Don't miss out!
              <p className="text-xs mt-1 text-amber-700">
                আপনার কার্টের আইটেমগুলো সীমিত সময়ের জন্য সংরক্ষিত আছে।
              </p>
            </AlertDescription>
          </Alert>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Code */}
              {cartData.discountCode && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      Special Offer Applied!
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono text-purple-700">
                      {cartData.discountCode}
                    </code>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Save {formatPrice(cartData.discountAmount || 0)} on this order!
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(cartData.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(cartData.totals.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(cartData.totals.tax)}</span>
                </div>
                {cartData.totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(cartData.totals.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#006a4e]">{formatPrice(cartData.totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Expiry Info */}
              <div className="text-xs text-gray-500 text-center">
                <p>This recovery link expires on:</p>
                <p className="font-medium">{formatDate(cartData.expiryDate)}</p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleRecoverCart}
                disabled={isRecovering}
                size="lg"
                className="w-full bg-gradient-to-r from-[#006a4e] to-[#007bff] hover:opacity-90"
              >
                {isRecovering ? (
                  <>Processing...</>
                ) : (
                  <>
                    Complete Purchase
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By clicking, you'll restore your cart and proceed to checkout
              </p>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Need help? <Link href="/contact" className="text-[#006a4e] hover:underline">Contact Support</Link></p>
            <p className="mt-1 text-xs">সাহায্য প্রয়োজন? <Link href="/contact" className="text-[#006a4e] hover:underline">সাপোর্টে যোগাযোগ করুন</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
