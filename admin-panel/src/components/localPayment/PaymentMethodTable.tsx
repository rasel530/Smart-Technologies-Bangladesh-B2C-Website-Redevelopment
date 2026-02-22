/**
 * Payment Method Table Component
 *
 * Admin table for displaying and managing local payment methods.
 */

import React from 'react';
import { LocalPaymentMethod } from '@/types/localPayment';

interface PaymentMethodTableProps {
  methods: LocalPaymentMethod[];
  onEdit: (method: LocalPaymentMethod) => void;
  onDelete: (methodId: string) => void;
}

const PaymentMethodTable: React.FC<PaymentMethodTableProps> = ({
  methods,
  onEdit,
  onDelete
}) => {
  const handleEdit = (method: LocalPaymentMethod) => {
    onEdit(method);
  };

  const handleDelete = (methodId: string) => {
    onDelete(methodId);
  };

  if (methods.length === 0) {
    return (
      <div className="payment-method-table payment-method-table--empty">
        <p>No payment methods found</p>
      </div>
    );
  }

  return (
    <div className="payment-method-table">
      <table className="payment-method-table__table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Name</th>
            <th>Code</th>
            <th>Display Name</th>
            <th>Min Amount</th>
            <th>Max Amount</th>
            <th>Fee (%)</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {methods.map((method) => (
            <tr key={method.id} className="payment-method-table__row">
              <td className="payment-method-table__cell">
                {method.logoUrl && (
                  <img
                    src={method.logoUrl}
                    alt={method.displayName}
                    className="payment-method-table__logo"
                  />
                )}
              </td>
              <td className="payment-method-table__cell">{method.name}</td>
              <td className="payment-method-table__cell">{method.code}</td>
              <td className="payment-method-table__cell">{method.displayName}</td>
              <td className="payment-method-table__cell">
                BDT {method.minAmount.toLocaleString()}
              </td>
              <td className="payment-method-table__cell">
                BDT {method.maxAmount.toLocaleString()}
              </td>
              <td className="payment-method-table__cell">
                {method.processingFeePercent}%
              </td>
              <td className="payment-method-table__cell">
                <span
                  className={`payment-method-table__status ${
                    method.isActive
                      ? 'payment-method-table__status--active'
                      : 'payment-method-table__status--inactive'
                  }`}
                >
                  {method.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="payment-method-table__cell payment-method-table__cell--actions">
                <button
                  className="payment-method-table__action payment-method-table__action--edit"
                  onClick={() => handleEdit(method)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="payment-method-table__action payment-method-table__action--delete"
                  onClick={() => handleDelete(method.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentMethodTable;
