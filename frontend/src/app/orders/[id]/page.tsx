/**
 * Order Details Page
 * 
 * Display complete order details with status timeline, tracking, notes, and actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { OrderStatus } from '@/lib/api/orderManagement';
import { orderConfirmationApi } from '@/lib/api/orderConfirmation';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';
import OrderNotes from '@/components/orders/OrderNotes';
import OrderModificationRequest from '@/components/orders/OrderModificationRequest';
import OrderCancellationRequest from '@/components/orders/OrderCancellationRequest';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { orderDetails, orderTracking, isLoadingDetails, isLoadingTracking, detailsError, trackingError, getOrderDetails, getOrderTracking, clearErrors } = useOrderHistory();
  const { getOrderStatusHistory, getOrderModifications, getOrderCancellations, getOrderFulfillments, getOrderNotes } = useOrderManagement();

  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [modifications, setModifications] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const [showModificationModal, setShowModificationModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tracking' | 'notes'>('overview');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    await getOrderDetails(orderId);
    await getOrderTracking(orderId);
    
    const [historyData, modsData, cancelsData, fulfillsData, notesData] = await Promise.all([
      getOrderStatusHistory(orderId),
      getOrderModifications(orderId),
      getOrderCancellations(orderId),
      getOrderFulfillments(orderId),
      getOrderNotes(orderId),
    ]);

    if (historyData) setStatusHistory(historyData);
    if (modsData) setModifications(modsData);
    if (cancelsData) setCancellations(cancelsData);
    if (fulfillsData) setFulfillments(fulfillsData);
    if (notesData) setNotes(notesData);
  };

  const handleGenerateInvoice = async () => {
    try {
      setIsGeneratingInvoice(true);
      setInvoiceError(null);

      // Step 1: Generate invoice (returns JSON with invoice details)
      const response = await orderConfirmationApi.generateInvoice(orderId);
      console.log('[Invoice Generation] Response:', response);
      
      // Step 2: Download PDF using invoice ID from response
      // Backend returns invoiceId in the response, not id
      const pdfBlob = await orderConfirmationApi.downloadInvoice(orderId, response.invoiceId);

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${response.invoiceNumber || orderDetails?.orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      // Safe removal with null check to prevent error during logout
      if (document.body && a.parentNode === document.body) {
        document.body.removeChild(a);
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      setInvoiceError(error.message || 'Failed to generate invoice. Please try again.');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const statusLabels: Record<OrderStatus, { en: string; bn: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    processing: { en: 'Processing', bn: 'প্রক্রিয়াকরণ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    shipped: { en: 'Shipped', bn: 'প্রেরিত', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    delivered: { en: 'Delivered', bn: 'বিতরণ করা হয়েছে', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    refunded: { en: 'Refunded', bn: 'ফেরত', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '৳0.00';
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '৳0.00';
    return `৳${numAmount.toFixed(2)}`;
  };

  const canCancel = orderDetails?.status && orderDetails.status !== 'cancelled' && orderDetails.status !== 'delivered' && orderDetails.status !== 'refunded';
  const canModify = orderDetails?.status && (orderDetails.status === 'pending' || orderDetails.status === 'confirmed');

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusLabels[orderDetails.status] || {
    en: orderDetails.status,
    bn: orderDetails.status,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/orders')}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
              >
                ← Back to Orders
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {orderDetails.orderNumber}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.en}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Placed on {formatDate(orderDetails.created_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canModify && (
                <button
                  onClick={() => setShowModificationModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Request Modification
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancellationModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Share Order
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={isGeneratingInvoice}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingInvoice ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {['overview', 'timeline', 'tracking', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error Messages */}
        {(detailsError || trackingError || invoiceError) && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{detailsError || trackingError || invoiceError}</p>
              <button
                onClick={() => {
                  clearErrors();
                  setInvoiceError(null);
                }}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Order Items
                </h2>
                {orderDetails.items && orderDetails.items.length > 0 ? (
                  <div className="space-y-4">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product?.images?.[0]?.originalUrl ? (
                            <img
                              src={item.product.images[0]?.originalUrl}
                              alt={item.product.images[0]?.altTextEn || item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-3xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {item.product?.name || 'Product'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {item.product?.sku || 'N/A'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No items in this order</p>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(orderDetails.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax</span>
                    <span>{formatCurrency(orderDetails.tax)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span>{formatCurrency(orderDetails.shippingCost)}</span>
                  </div>
                  {orderDetails.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(orderDetails.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
                    <span>Total</span>
                    <span>{formatCurrency(orderDetails.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Customer Information
                </h2>
                {orderDetails.user ? (
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-gray-100">
                      <span className="font-medium">Name:</span> {orderDetails.user.firstName} {orderDetails.user.lastName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Email:</span> {orderDetails.user.email}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Guest order</p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Shipping Address
                </h2>
                {orderDetails.address ? (
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">{orderDetails.address.fullName}</p>
                    <p>{orderDetails.address.phone}</p>
                    <p>{orderDetails.address.address}</p>
                    {orderDetails.address.addressLine2 && <p>{orderDetails.address.addressLine2}</p>}
                    <p>{orderDetails.address.city}, {orderDetails.address.district}</p>
                    <p>{orderDetails.address.postalCode}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No address information</p>
                )}
              </div>

              {/* Payment Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Payment Information
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-gray-100">
                    <span className="font-medium">Method:</span> {orderDetails.paymentMethod}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Status:</span> {orderDetails.paymentStatus}
                  </p>
                </div>
              </div>

              {/* Tracking Info */}
              {fulfillments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Tracking Information
                  </h2>
                  {fulfillments.map((fulfillment) => (
                    <div key={fulfillment.id} className="space-y-2">
                      {fulfillment.trackingNumber && (
                        <p className="text-gray-900 dark:text-gray-100">
                          <span className="font-medium">Tracking Number:</span>{' '}
                          <a
                            href={fulfillment.courierService?.trackingUrl?.replace('{trackingNumber}', fulfillment.trackingNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {fulfillment.trackingNumber}
                          </a>
                        </p>
                      )}
                      {fulfillment.estimatedDelivery && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Estimated Delivery:</span>{' '}
                          {formatDate(fulfillment.estimatedDelivery)}
                        </p>
                      )}
                      {fulfillment.courierService && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Courier:</span> {fulfillment.courierService.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <OrderStatusTimeline
              statusHistory={statusHistory}
              currentStatus={orderDetails.status}
            />
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Order Tracking
            </h2>
            {isLoadingTracking ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : orderTracking && orderTracking.timeline && orderTracking.timeline.length > 0 ? (
              <div className="space-y-4">
                {orderTracking.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-lg">📦</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.timestamp)}</p>
                      {event.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tracking information available</p>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <OrderNotes
              orderId={orderId}
              readOnly={false}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderModificationRequest
        orderId={orderId}
        isOpen={showModificationModal}
        onClose={() => setShowModificationModal(false)}
        onSuccess={() => {
          setShowModificationModal(false);
          loadOrderData();
        }}
        orderItems={orderDetails.items?.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Product',
          quantity: item.quantity,
          price: item.price,
        }))}
      />

      <OrderCancellationRequest
        orderId={orderId}
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onSuccess={() => {
          setShowCancellationModal(false);
          loadOrderData();
        }}
        orderStatus={orderDetails.status}
        orderTotal={orderDetails.total}
      />

      {/* Share Order Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Share Order
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Share this order with others using the link below:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/orders/shared/${orderId}`}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/orders/shared/${orderId}`);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Copy
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/orders/shared/${orderId}`;
                    if (navigator.share) {
                      navigator.share({
                        title: `Order ${orderDetails.orderNumber}`,
                        url: shareUrl,
                      });
                    } else {
                      window.open(`mailto:?subject=Order ${orderDetails.orderNumber}&body=Check out my order: ${shareUrl}`, '_blank');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Share via Email
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
