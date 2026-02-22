/**
 * SMS Subscription Management Page
 *
 * Admin page for managing SMS subscriptions for premium features.
 */

import React, { useState, useEffect } from 'react';
import { SmsSubscription } from '@/types/localPayment';
import SmsSubscriptionTable from '@/components/localPayment/SmsSubscriptionTable';

const SmsSubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SmsSubscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<SmsSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement API call to fetch subscriptions
      // const response = await fetch('/api/v1/admin/local-payment/sms-subscriptions');
      // const data = await response.json();
      // setSubscriptions(data.data);
      
      // Placeholder data
      setSubscriptions([]);
    } catch (err) {
      console.error('[SmsSubscriptionManagement] Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subscription: SmsSubscription) => {
    setSelectedSubscription(subscription);
    // TODO: Open edit modal/form
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      // TODO: Implement API call to cancel subscription
      // await fetch(`/api/v1/admin/local-payment/sms-subscriptions/${subscriptionId}`, {
      //   method: 'DELETE'
      // });
      
      await loadSubscriptions();
    } catch (err) {
      console.error('[SmsSubscriptionManagement] Error cancelling subscription:', err);
      setError('Failed to cancel subscription');
    }
  };

  return (
    <div className="sms-subscription-management">
      <div className="sms-subscription-management__header">
        <h1 className="sms-subscription-management__title">
          SMS Subscription Management
        </h1>
      </div>

      {error && (
        <div className="sms-subscription-management__error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isLoading ? (
        <div className="sms-subscription-management__loading">
          Loading...
        </div>
      ) : (
        <SmsSubscriptionTable
          subscriptions={subscriptions}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default SmsSubscriptionManagement;
