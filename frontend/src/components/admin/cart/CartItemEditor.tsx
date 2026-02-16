'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, DollarSign } from 'lucide-react';
import { AdminCartItem } from '@/lib/api/admin/cart';

interface CartItemEditorProps {
  item: AdminCartItem;
  onSave: (data: { quantity?: number; price?: number }) => void;
  onCancel: () => void;
  language?: 'en' | 'bn';
}

const CartItemEditor: React.FC<CartItemEditorProps> = ({
  item,
  onSave,
  onCancel,
  language = 'en'
}) => {
  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [price, setPrice] = useState<number>(item.price);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    en: {
      quantity: 'Quantity',
      price: 'Price',
      save: 'Save',
      cancel: 'Cancel',
      invalidQuantity: 'Quantity must be at least 1',
      invalidPrice: 'Price must be non-negative',
      updateItem: 'Update Cart Item'
    },
    bn: {
      quantity: 'পরিমাণ',
      price: 'দাম',
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      invalidQuantity: 'পরিমাণ অবশ্যই কমপক্ষে 1 হতে হবে',
      invalidPrice: 'দাম অবশ্যই অ-নেতিবাচক হতে হবে',
      updateItem: 'কার্ট আইটেম আপডেট করুন'
    }
  };

  const t = translations[language];

  const handleSave = () => {
    setError(null);

    // Validate quantity
    if (quantity < 1) {
      setError(t.invalidQuantity);
      return;
    }

    // Validate price
    if (price < 0) {
      setError(t.invalidPrice);
      return;
    }

    onSave({ quantity, price });
  };

  const formatPrice = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '৳0.00';
    }
    return `৳${value.toFixed(2)}`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-gray-900">{t.updateItem}</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Quantity Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t.quantity}:
        </label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Price Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t.price}:
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {formatPrice(price)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t.cancel}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {t.save}
        </button>
      </div>
    </div>
  );
};

export default CartItemEditor;
