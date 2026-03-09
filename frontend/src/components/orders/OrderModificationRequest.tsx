/**
 * OrderModificationRequest Component
 * 
 * Modal/dialog for requesting order modification with various modification types.
 */

'use client';

import React, { useState } from 'react';
import { ModificationType, CreateModificationRequest } from '@/lib/api/orderManagement';
import { useOrderManagement } from '@/hooks/useOrderManagement';

interface OrderModificationRequestProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: 'en' | 'bn';
  orderItems?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const OrderModificationRequest: React.FC<OrderModificationRequestProps> = ({
  orderId,
  isOpen,
  onClose,
  onSuccess,
  language = 'en',
  orderItems = [],
}) => {
  const { requestModification, isLoading, error, clearError } = useOrderManagement();

  const [modificationType, setModificationType] = useState<ModificationType>('item_add');
  const [reason, setReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    postalCode: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setModificationType('item_add');
    setReason('');
    setSelectedItems(new Set());
    setQuantities({});
    setNewAddress({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      postalCode: '',
    });
    setValidationErrors({});
    clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!reason.trim()) {
      errors.reason = language === 'bn' ? 'কারণ প্রদান করা আবশ্যক' : 'Reason is required';
    }

    if (modificationType === 'item_add' || modificationType === 'item_remove' || modificationType === 'quantity_change') {
      if (selectedItems.size === 0) {
        errors.items = language === 'bn' ? 'অন্তত একটি আইটেম নির্বাচন করুন' : 'Please select at least one item';
      }
    }

    if (modificationType === 'quantity_change') {
      selectedItems.forEach(itemId => {
        const qty = quantities[itemId];
        if (!qty || qty < 1) {
          errors[`quantity_${itemId}`] = language === 'bn' ? 'পরিমাণ অবশ্যই 1 বা তার বেশি হতে হবে' : 'Quantity must be at least 1';
        }
      });
    }

    if (modificationType === 'address_change') {
      if (!newAddress.fullName.trim()) errors.fullName = language === 'bn' ? 'নাম প্রদান করা আবশ্যক' : 'Name is required';
      if (!newAddress.phone.trim()) errors.phone = language === 'bn' ? 'ফোন নম্বর প্রদান করা আবশ্যক' : 'Phone number is required';
      if (!newAddress.addressLine1.trim()) errors.addressLine1 = language === 'bn' ? 'ঠিকানা প্রদান করা আবশ্যক' : 'Address is required';
      if (!newAddress.city.trim()) errors.city = language === 'bn' ? 'শহর প্রদান করা আবশ্যক' : 'City is required';
      if (!newAddress.district.trim()) errors.district = language === 'bn' ? 'জেলা প্রদান করা আবশ্যক' : 'District is required';
      if (!newAddress.postalCode.trim()) errors.postalCode = language === 'bn' ? 'পোস্টাল কোড প্রদান করা আবশ্যক' : 'Postal code is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const changes: Record<string, any> = {};

    // Handle item_remove: backend expects changes.itemIds (array of OrderItem IDs)
    if (modificationType === 'item_remove') {
      changes.itemIds = Array.from(selectedItems);
    }
    // Handle quantity_change: backend expects changes.items with orderItemId and newQuantity
    else if (modificationType === 'quantity_change') {
      changes.items = Array.from(selectedItems).map(itemId => ({
        orderItemId: itemId,
        newQuantity: quantities[itemId] || orderItems.find(i => i.id === itemId)?.quantity,
      }));
    }
    // Handle item_add: keep existing structure (already works)
    else if (modificationType === 'item_add') {
      changes.items = Array.from(selectedItems).map(itemId => {
        const item = orderItems.find(i => i.id === itemId);
        return {
          productId: item?.productId,
          quantity: quantities[itemId] || item?.quantity,
          price: item?.price,
        };
      });
    }
    // Handle address_change: keep existing structure (already works)
    else if (modificationType === 'address_change') {
      changes.address = newAddress;
    }

    const requestData: CreateModificationRequest = {
      type: modificationType,
      reason,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    };

    const result = await requestModification(orderId, requestData);

    if (result) {
      handleClose();
      onSuccess?.();
    }
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      delete quantities[itemId];
    } else {
      newSelected.add(itemId);
      const item = orderItems.find(i => i.id === itemId);
      if (item) {
        quantities[itemId] = item.quantity;
      }
    }
    setSelectedItems(newSelected);
    setQuantities({ ...quantities });
  };

  const handleQuantityChange = (itemId: string, value: number) => {
    setQuantities({ ...quantities, [itemId]: value });
  };

  // Helper to check if a modification type is supported (has UI implementation)
  const isSupportedModificationType = (type: ModificationType): boolean => {
    const supportedTypes: ModificationType[] = ['item_add', 'item_remove', 'quantity_change', 'address_change'];
    return supportedTypes.includes(type);
  };

  const modificationTypeLabels: Record<ModificationType, { en: string; bn: string }> = {
    item_add: { en: 'Add Item', bn: 'আইটেম যোগ করুন' },
    item_remove: { en: 'Remove Item', bn: 'আইটেম সরান' },
    quantity_change: { en: 'Change Quantity', bn: 'পরিমাণ পরিবর্তন করুন' },
    price_change: { en: 'Change Price', bn: 'মূল্য পরিবর্তন করুন' },
    address_change: { en: 'Change Address', bn: 'ঠিকানা পরিবর্তন করুন' },
    shipping_method_change: { en: 'Change Shipping Method', bn: 'শিপিং পদ্ধতি পরিবর্তন করুন' },
    payment_method_change: { en: 'Change Payment Method', bn: 'পেমেন্ট পদ্ধতি পরিবর্তন করুন' },
    custom: { en: 'Custom Request', bn: 'কাস্টম অনুরোধ' },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {language === 'bn' ? 'অর্ডার পরিবর্তনের অনুরোধ' : 'Order Modification Request'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Modification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'bn' ? 'পরিবর্তনের ধরন:' : 'Modification Type:'}
            </label>
            <select
              value={modificationType}
              onChange={(e) => setModificationType(e.target.value as ModificationType)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Object.entries(modificationTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {language === 'bn' ? label.bn : label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Warning for unsupported modification types */}
          {!isSupportedModificationType(modificationType) && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {language === 'bn'
                  ? 'এই পরিবর্তনের ধরনটি বর্তমানে সমর্থিত নয়। অনুগ্রহ করে একটি সমর্থিত বিকল্প নির্বাচন করুন।'
                  : 'This modification type is currently not supported. Please select a supported option.'}
              </p>
            </div>
          )}

          {/* Item Selection (for item-related modifications) */}
          {(modificationType === 'item_add' || modificationType === 'item_remove' || modificationType === 'quantity_change') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'bn' ? 'আইটেম নির্বাচন করুন:' : 'Select Items:'}
              </label>
              {validationErrors.items && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">{validationErrors.items}</p>
              )}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg ${
                      selectedItems.has(item.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                        className="mt-1 w-4 h-4 text-blue-500 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.productName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {language === 'bn' ? 'মূল্য:' : 'Price:'} ৳{item.price} | {language === 'bn' ? 'পরিমাণ:' : 'Quantity:'} {item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Quantity input for quantity_change */}
                    {modificationType === 'quantity_change' && selectedItems.has(item.id) && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {language === 'bn' ? 'নতুন পরিমাণ:' : 'New Quantity:'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantities[item.id] || item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        {validationErrors[`quantity_${item.id}`] && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {validationErrors[`quantity_${item.id}`]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Address Form (for address_change) */}
          {modificationType === 'address_change' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'bn' ? 'নতুন ঠিকানা:' : 'New Address:'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'পুরো নাম:' : 'Full Name:'}
                  </label>
                  <input
                    type="text"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'ফোন নম্বর:' : 'Phone Number:'}
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'ঠিকানা লাইন ১:' : 'Address Line 1:'}
                  </label>
                  <input
                    type="text"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {validationErrors.addressLine1 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.addressLine1}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'ঠিকানা লাইন ২ (ঐচ্ছিক):' : 'Address Line 2 (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'শহর:' : 'City:'}
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {validationErrors.city && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'জেলা:' : 'District:'}
                  </label>
                  <input
                    type="text"
                    value={newAddress.district}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {validationErrors.district && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.district}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'bn' ? 'পোস্টাল কোড:' : 'Postal Code:'}
                  </label>
                  <input
                    type="text"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {validationErrors.postalCode && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'bn' ? 'কারণ:' : 'Reason:'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'bn' ? 'পরিবর্তনের কারণ ব্যাখ্যা করুন...' : 'Explain the reason for modification...'}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              rows={4}
            />
            {validationErrors.reason && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.reason}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isSupportedModificationType(modificationType)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? language === 'bn'
                ? 'জমা দেওয়া হচ্ছে...'
                : 'Submitting...'
              : language === 'bn'
              ? 'জমা দিন'
              : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderModificationRequest;
