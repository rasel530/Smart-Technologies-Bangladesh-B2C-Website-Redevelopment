'use client';

import React from 'react';
import { Eye, Plus, Minus, ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import type { CartEvent } from '@/lib/api/cartAnalytics';

interface CartEventsTableProps {
  events: CartEvent[];
  language?: 'en' | 'bn';
}

const CartEventsTable: React.FC<CartEventsTableProps> = ({ events, language = 'en' }) => {
  const translations = {
    en: {
      eventType: 'Event',
      product: 'Product',
      quantity: 'Qty',
      price: 'Price',
      time: 'Time',
      noEvents: 'No events to display',
      view: 'Cart View',
      add: 'Add to Cart',
      remove: 'Remove from Cart',
      checkoutInitiated: 'Checkout Started',
      checkoutCompleted: 'Order Completed'
    },
    bn: {
      eventType: 'ইভেন্ট',
      product: 'পণ্য',
      quantity: 'পরিমাণ',
      price: 'মূল্য',
      time: 'সময়',
      noEvents: 'প্রদর্শন করতে কোন ইভেন্ট নেই',
      view: 'কার্ট দেখা',
      add: 'কার্টে যোগ',
      remove: 'কার্ট থেকে সরান',
      checkoutInitiated: 'চেকআউট শুরু',
      checkoutCompleted: 'অর্ডার সম্পন্ন'
    }
  };

  const t = translations[language];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'view':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'add':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'remove':
        return <Minus className="w-4 h-4 text-red-500" />;
      case 'checkout_initiated':
        return <ShoppingCart className="w-4 h-4 text-yellow-500" />;
      case 'checkout_completed':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'view':
        return t.view;
      case 'add':
        return t.add;
      case 'remove':
        return t.remove;
      case 'checkout_initiated':
        return t.checkoutInitiated;
      case 'checkout_completed':
        return t.checkoutCompleted;
      default:
        return eventType;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">{t.noEvents}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
              {t.eventType}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
              {t.product}
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
              {t.quantity}
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
              {t.price}
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
              {t.time}
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr 
              key={event.id} 
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.eventType)}
                  <span className="text-sm font-medium">{getEventLabel(event.eventType)}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600">
                  {event.productId ? 
                    `${event.productId.slice(0, 8)}...` : 
                    '-'
                  }
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-sm">
                  {event.quantity || '-'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-sm">
                  {event.price ? `৳${event.price.toFixed(2)}` : '-'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-xs text-gray-500">
                  {formatTime(event.timestamp)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CartEventsTable;
