/**
 * SMS Subscription Table Component
 *
 * Admin table for displaying and managing SMS subscriptions.
 */

import React from 'react';
import { SmsSubscription } from '@/types/localPayment';

interface SmsSubscriptionTableProps {
  subscriptions: SmsSubscription[];
  onEdit: (subscription: SmsSubscription) => void;
  onCancel: (subscriptionId: string) => void;
}

const SmsSubscriptionTable: React.FC<SmsSubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onCancel
}) => {
  const handleEdit = (subscription: SmsSubscription) => {
    onEdit(subscription);
  };

  const handleCancel = (subscriptionId: string) => {
    onCancel(subscriptionId);
  };

  if (subscriptions.length === 0) {
    return (
      <div className="sms-subscription-table sms-subscription-table--empty">
        <p>No SMS subscriptions found</p>
      </div>
    );
  }

  return (
    <div className="sms-subscription-table">
      <table className="sms-subscription-table__table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Phone Number</th>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Last Payment</th>
            <th>Next Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id} className="sms-subscription-table__row">
              <td className="sms-subscription-table__cell">
                {subscription.userId}
              </td>
              <td className="sms-subscription-table__cell">
                {subscription.phoneNumber}
              </td>
              <td className="sms-subscription-table__cell">
                {subscription.paymentMethod}
              </td>
              <td className="sms-subscription-table__cell">
                BDT {subscription.amount.toLocaleString()}
              </td>
              <td className="sms-subscription-table__cell">
                <span
                  className={`sms-subscription-table__status ${
                    subscription.status === 'active'
                      ? 'sms-subscription-table__status--active'
                      : 'sms-subscription-table__status--inactive'
                  }`}
                >
                  {subscription.status}
                </span>
              </td>
              <td className="sms-subscription-table__cell">
                {subscription.lastPaymentAt
                  ? new Date(subscription.lastPaymentAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className="sms-subscription-table__cell">
                {subscription.nextPaymentAt
                  ? new Date(subscription.nextPaymentAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className="sms-subscription-table__cell sms-subscription-table__cell--actions">
                <button
                  className="sms-subscription-table__action sms-subscription-table__action--edit"
                  onClick={() => handleEdit(subscription)}
                  title="Edit"
                >
                  ✏️
                </button>
                {subscription.isSubscribed && (
                  <button
                    className="sms-subscription-table__action sms-subscription-table__action--cancel"
                    onClick={() => handleCancel(subscription.id)}
                    title="Cancel Subscription"
                  >
                    🚫
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SmsSubscriptionTable;
