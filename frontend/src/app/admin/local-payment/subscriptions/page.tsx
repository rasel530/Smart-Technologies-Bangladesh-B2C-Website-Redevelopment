'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Check, X, MessageSquare, Calendar, DollarSign, User, Phone, Plus, Edit } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { PageWrapper, Badge, ButtonPrimary, ButtonDanger, Select, Input } from '@/components/design-system';
import { apiClient } from '@/lib/api/client';

interface SmsSubscription {
  id: string;
  userId: string;
  phoneNumber: string;
  paymentMethod: string;
  amount: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

function SmsSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SmsSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<SmsSubscription | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<SmsSubscription | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    phoneNumber: '',
    paymentMethod: '',
    amount: '',
    status: 'pending' as 'active' | 'pending' | 'cancelled' | 'expired'
  });

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<SmsSubscription[]>('/admin/local-payment/sms-subscriptions');

      setSubscriptions(response || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    try {
      await apiClient.delete(`/admin/local-payment/sms-subscriptions/${subscriptionToCancel.id}`);
      setShowCancelModal(false);
      setSubscriptionToCancel(null);
      // Refresh the list
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    }
  };

  const handleUpdateStatus = async (subscription: SmsSubscription, newStatus: string) => {
    try {
      await apiClient.put(`/admin/local-payment/sms-subscriptions/${subscription.id}`, {
        status: newStatus,
      });
      // Refresh the list
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription status');
    }
  };

  const handleCreateSubscription = async () => {
    try {
      setError(null);
      await apiClient.post('/admin/local-payment/sms-subscriptions', {
        userId: formData.userId,
        phoneNumber: formData.phoneNumber,
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        status: formData.status,
      });
      setShowCreateModal(false);
      setFormData({
        userId: '',
        phoneNumber: '',
        paymentMethod: '',
        amount: '',
        status: 'pending'
      });
      // Refresh the list
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    }
  };

  const handleEditSubscription = async () => {
    if (!subscriptionToEdit) return;

    try {
      setError(null);
      await apiClient.put(`/admin/local-payment/sms-subscriptions/${subscriptionToEdit.id}`, {
        phoneNumber: formData.phoneNumber,
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        status: formData.status,
      });
      setShowEditModal(false);
      setSubscriptionToEdit(null);
      setFormData({
        userId: '',
        phoneNumber: '',
        paymentMethod: '',
        amount: '',
        status: 'pending'
      });
      // Refresh the list
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
    }
  };

  const openEditModal = (subscription: SmsSubscription) => {
    setSubscriptionToEdit(subscription);
    setFormData({
      userId: subscription.userId,
      phoneNumber: subscription.phoneNumber,
      paymentMethod: subscription.paymentMethod,
      amount: subscription.amount.toString(),
      status: subscription.status,
    });
    setShowEditModal(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.phoneNumber.includes(searchQuery) ||
      sub.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus ? sub.status === filterStatus : true;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="success">Active</Badge>;
      case 'cancelled':
        return <Badge color="danger">Cancelled</Badge>;
      case 'expired':
        return <Badge color="neutral">Expired</Badge>;
      case 'pending':
        return <Badge color="warning">Pending</Badge>;
      default:
        return <Badge color="neutral">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PageWrapper
      title="SMS Subscriptions"
      description="Manage SMS payment subscriptions for premium features"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by phone, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <ButtonPrimary
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Subscription
          </ButtonPrimary>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {subscriptions.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                {subscriptions
                  .filter(s => s.status === 'active')
                  .reduce((sum, s) => sum + Number(s.amount), 0)
                  .toLocaleString()}{' '}
                BDT
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-xl shadow-md">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading subscriptions...</div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No subscriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.user?.firstName} {subscription.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {subscription.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {subscription.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subscription.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.amount.toLocaleString()} BDT
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(subscription.startDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subscription.endDate ? formatDate(subscription.endDate) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(subscription)}
                          className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        {subscription.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription, 'active')}
                            className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        {subscription.status === 'active' && (
                          <button
                            onClick={() => {
                              setSubscriptionToCancel(subscription);
                              setShowCancelModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && subscriptionToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel the subscription for <strong>{subscriptionToCancel.phoneNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSubscriptionToCancel(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <ButtonDanger onClick={handleCancelSubscription}>
                Cancel Subscription
              </ButtonDanger>
            </div>
          </div>
        </div>
      )}

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Subscription
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter payment method"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (BDT)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    userId: '',
                    phoneNumber: '',
                    paymentMethod: '',
                    amount: '',
                    status: 'pending'
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <ButtonPrimary onClick={handleCreateSubscription}>
                Create Subscription
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && subscriptionToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Subscription
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter payment method"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (BDT)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSubscriptionToEdit(null);
                  setFormData({
                    userId: '',
                    phoneNumber: '',
                    paymentMethod: '',
                    amount: '',
                    status: 'pending'
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <ButtonPrimary onClick={handleEditSubscription}>
                Update Subscription
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default withAuth(SmsSubscriptionsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
