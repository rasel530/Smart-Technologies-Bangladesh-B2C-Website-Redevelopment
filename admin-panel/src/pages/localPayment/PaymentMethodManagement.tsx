/**
 * Payment Method Management Page
 *
 * Admin page for managing local payment methods (bKash, Nagad, Rocket, SureCash).
 * Allows creating, editing, and deactivating payment methods.
 */

import React, { useState, useEffect } from 'react';
import { LocalPaymentMethod } from '@/types/localPayment';
import PaymentMethodForm from '@/components/localPayment/PaymentMethodForm';
import PaymentMethodTable from '@/components/localPayment/PaymentMethodTable';

const PaymentMethodManagement: React.FC = () => {
  const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<LocalPaymentMethod | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement API call to fetch payment methods
      // const response = await fetch('/api/v1/admin/local-payment/methods');
      // const data = await response.json();
      // setMethods(data.data);
      
      // Placeholder data
      setMethods([]);
    } catch (err) {
      console.error('[PaymentMethodManagement] Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedMethod(null);
    setIsFormOpen(true);
  };

  const handleEdit = (method: LocalPaymentMethod) => {
    setSelectedMethod(method);
    setIsFormOpen(true);
  };

  const handleDelete = async (methodId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      // TODO: Implement API call to delete payment method
      // await fetch(`/api/v1/admin/local-payment/methods/${methodId}`, {
      //   method: 'DELETE'
      // });
      
      await loadMethods();
    } catch (err) {
      console.error('[PaymentMethodManagement] Error deleting payment method:', err);
      setError('Failed to delete payment method');
    }
  };

  const handleFormSubmit = async (methodData: Partial<LocalPaymentMethod>) => {
    try {
      if (selectedMethod) {
        // Update existing method
        // TODO: Implement API call to update payment method
        // await fetch(`/api/v1/admin/local-payment/methods/${selectedMethod.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(methodData)
        // });
      } else {
        // Create new method
        // TODO: Implement API call to create payment method
        // await fetch('/api/v1/admin/local-payment/methods', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(methodData)
        // });
      }
      
      setIsFormOpen(false);
      await loadMethods();
    } catch (err) {
      console.error('[PaymentMethodManagement] Error saving payment method:', err);
      setError('Failed to save payment method');
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedMethod(null);
  };

  return (
    <div className="payment-method-management">
      <div className="payment-method-management__header">
        <h1 className="payment-method-management__title">
          Payment Method Management
        </h1>
        <button
          className="payment-method-management__create-button"
          onClick={handleCreate}
        >
          + Add Payment Method
        </button>
      </div>

      {error && (
        <div className="payment-method-management__error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isFormOpen && (
        <PaymentMethodForm
          method={selectedMethod}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {isLoading ? (
        <div className="payment-method-management__loading">
          Loading...
        </div>
      ) : (
        <PaymentMethodTable
          methods={methods}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default PaymentMethodManagement;
