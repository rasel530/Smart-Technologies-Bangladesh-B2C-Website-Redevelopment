/**
 * Payment Method Form Component
 *
 * Admin form for creating and editing local payment methods.
 */

import React, { useState, useEffect } from 'react';
import { LocalPaymentMethod, LOCAL_PAYMENT_CONSTANTS } from '@/types/localPayment';

interface PaymentMethodFormProps {
  method?: LocalPaymentMethod | null;
  onSubmit: (methodData: Partial<LocalPaymentMethod>) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  code: string;
  displayName: string;
  logoUrl: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingFeePercent: number;
  requiresPhone: boolean;
  requiresPin: boolean;
  description: string;
  supportedNetworks: string[];
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  method,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: method?.name || '',
    code: method?.code || '',
    displayName: method?.displayName || '',
    logoUrl: method?.logoUrl || '',
    isActive: method?.isActive ?? true,
    minAmount: method?.minAmount || 10,
    maxAmount: method?.maxAmount || 200000,
    processingFee: method?.processingFee || 0,
    processingFeePercent: method?.processingFeePercent || 0,
    requiresPhone: method?.requiresPhone ?? true,
    requiresPin: method?.requiresPin ?? false,
    description: method?.description || '',
    supportedNetworks: method?.supportedNetworks || LOCAL_PAYMENT_CONSTANTS.SUPPORTED_NETWORKS
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNetworkToggle = (network: string) => {
    setFormData(prev => ({
      ...prev,
      supportedNetworks: prev.supportedNetworks.includes(network)
        ? prev.supportedNetworks.filter(n => n !== network)
        : [...prev.supportedNetworks, network]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="payment-method-form">
      <div className="payment-method-form__header">
        <h2 className="payment-method-form__title">
          {method ? 'Edit Payment Method' : 'Add New Payment Method'}
        </h2>
        <button className="payment-method-form__close" onClick={onCancel}>
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="payment-method-form__body">
        <div className="payment-method-form__row">
          <div className="payment-method-form__field">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., bKash"
            />
          </div>

          <div className="payment-method-form__field">
            <label htmlFor="code">Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="e.g., bkash"
              disabled={!!method}
            />
          </div>
        </div>

        <div className="payment-method-form__field">
          <label htmlFor="displayName">Display Name *</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            placeholder="e.g., bKash - বিকাশ"
          />
        </div>

        <div className="payment-method-form__field">
          <label htmlFor="logoUrl">Logo URL</label>
          <input
            type="url"
            id="logoUrl"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="payment-method-form__row">
          <div className="payment-method-form__field">
            <label htmlFor="minAmount">Minimum Amount (BDT) *</label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={formData.minAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="payment-method-form__field">
            <label htmlFor="maxAmount">Maximum Amount (BDT) *</label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={formData.maxAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="payment-method-form__row">
          <div className="payment-method-form__field">
            <label htmlFor="processingFee">Processing Fee (BDT)</label>
            <input
              type="number"
              id="processingFee"
              name="processingFee"
              value={formData.processingFee}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="payment-method-form__field">
            <label htmlFor="processingFeePercent">Processing Fee (%)</label>
            <input
              type="number"
              id="processingFeePercent"
              name="processingFeePercent"
              value={formData.processingFeePercent}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>

        <div className="payment-method-form__checkboxes">
          <label className="payment-method-form__checkbox">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>

          <label className="payment-method-form__checkbox">
            <input
              type="checkbox"
              name="requiresPhone"
              checked={formData.requiresPhone}
              onChange={handleChange}
            />
            <span>Requires Phone</span>
          </label>

          <label className="payment-method-form__checkbox">
            <input
              type="checkbox"
              name="requiresPin"
              checked={formData.requiresPin}
              onChange={handleChange}
            />
            <span>Requires PIN</span>
          </label>
        </div>

        <div className="payment-method-form__field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Brief description of the payment method"
          />
        </div>

        <div className="payment-method-form__field">
          <label>Supported Networks</label>
          <div className="payment-method-form__networks">
            {LOCAL_PAYMENT_CONSTANTS.SUPPORTED_NETWORKS.map((network) => (
              <label key={network} className="payment-method-form__network-checkbox">
                <input
                  type="checkbox"
                  checked={formData.supportedNetworks.includes(network)}
                  onChange={() => handleNetworkToggle(network)}
                />
                <span>{network}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="payment-method-form__actions">
          <button type="submit" className="payment-method-form__submit">
            {method ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            className="payment-method-form__cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
