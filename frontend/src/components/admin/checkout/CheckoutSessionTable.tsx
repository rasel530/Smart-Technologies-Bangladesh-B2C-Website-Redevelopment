'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ShoppingCart,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

// Types
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number; // Database field is 'price', not 'unitPrice'
  subtotal: number; // Database field is 'subtotal', not 'totalPrice'
  product: {
    id: string;
    name: string;
    regularPrice: number; // Backend returns regularPrice, not price
    images: string[];
  };
}

interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutSession {
  id: string;
  sessionId: string;
  userId?: string;
  userType: 'guest' | 'authenticated';
  email?: string;
  currentStep: 'cart' | 'shipping' | 'billing' | 'payment' | 'review' | 'confirmation';
  status: 'active' | 'completed' | 'abandoned' | 'expired';
  cartValue?: number;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  completedAt?: string;
  cart?: Cart;
  shippingAddress?: any;
  billingAddress?: any;
  abandonment?: any;
  guestSession?: any;
}

interface CheckoutSessionsResponse {
  success: boolean;
  data: CheckoutSession[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatStep = (step: string): string => {
  return step.charAt(0).toUpperCase() + step.slice(1);
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'abandoned':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <Clock className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'abandoned':
      return <AlertCircle className="w-4 h-4" />;
    case 'expired':
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'expired', label: 'Expired' }
];

const userTypeOptions = [
  { value: '', label: 'All User Types' },
  { value: 'guest', label: 'Guest' },
  { value: 'authenticated', label: 'Authenticated' }
];

const stepOptions = [
  { value: '', label: 'All Steps' },
  { value: 'cart', label: 'Cart' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'billing', label: 'Billing' },
  { value: 'payment', label: 'Payment' },
  { value: 'review', label: 'Review' },
  { value: 'confirmation', label: 'Confirmation' }
];

interface CheckoutSessionTableProps {
  onSessionClick?: (session: CheckoutSession) => void;
  initialFilters?: {
    status?: string;
    userType?: string;
    step?: string;
    search?: string;
  };
}

/**
 * CheckoutSessionTable Component
 * 
 * Displays a table of checkout sessions with filtering, search, and pagination.
 * Supports viewing session details, cancelling sessions, and exporting data.
 */
export default function CheckoutSessionTable({ onSessionClick, initialFilters = {} }: CheckoutSessionTableProps) {
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || '');
  const [userTypeFilter, setUserTypeFilter] = useState(initialFilters.userType || '');
  const [stepFilter, setStepFilter] = useState(initialFilters.step || '');

  // Modal
  const [selectedSession, setSelectedSession] = useState<CheckoutSession | null>(null);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    fetchSessions();
  }, [page, statusFilter, userTypeFilter, stepFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString()
      });

      if (statusFilter) params.append('status', statusFilter);
      if (userTypeFilter) params.append('userType', userTypeFilter);
      if (stepFilter) params.append('step', stepFilter);
      if (search) params.append('search', search);

      const response: CheckoutSessionsResponse = await apiClient.get(
        `/admin/checkout/sessions?${params.toString()}`,
        { unwrapResponse: false }  // Return full response with pagination metadata
      );
      setSessions(response.data);
      setTotalPages(response.pagination.pages);
      setTotalSessions(response.pagination.total);
    } catch (err: any) {
      console.error('Error fetching checkout sessions:', err);
      setError(err.message || 'Failed to load checkout sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchSessions();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setUserTypeFilter('');
    setStepFilter('');
    setPage(1);
    fetchSessions();
  };

  const handleViewSession = (session: CheckoutSession) => {
    setSelectedSession(session);
    setShowModal(true);
    if (onSessionClick) {
      onSessionClick(session);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this checkout session?')) {
      return;
    }

    setCancelling(sessionId);
    try {
      console.log('Cancelling checkout session:', sessionId);
      const result = await apiClient.delete(
        `/admin/checkout/sessions/${sessionId}`,
        { unwrapResponse: false, timeout: 30000 } // 30 second timeout to prevent hanging
      );
      console.log('Cancel result:', result);
      
      // Update local state
      setSessions(sessions.map(session => 
        session.sessionId === sessionId 
          ? { ...session, status: 'abandoned' as const }
          : session
      ));
      
      alert('Checkout session cancelled successfully!');
    } catch (err: any) {
      console.error('Error cancelling checkout session:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      console.error('Error name:', err?.name);
      console.error('Error message:', err?.message);
      alert(err?.message || err?.toString() || 'Failed to cancel checkout session. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const handleExportCSV = () => {
    if (!sessions || sessions.length === 0) {
      alert('No sessions to export');
      return;
    }

    const headers = [
      'Session ID',
      'User Type',
      'Email',
      'Current Step',
      'Status',
      'Cart Value',
      'Device Type',
      'Created At',
      'Last Activity'
    ];

    const csvContent = [
      headers.join(','),
      ...sessions.map(session => [
        session.sessionId,
        session.userType,
        session.email || 'N/A',
        session.currentStep,
        session.status,
        session.cartValue ? session.cartValue.toFixed(2) : '0.00',
        session.deviceType || 'N/A',
        formatDate(session.createdAt),
        formatDate(session.lastActivity)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkout-sessions-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Checkout Sessions</h2>
          <p className="text-gray-600 mt-1">
            {totalSessions} {totalSessions === 1 ? 'session' : 'sessions'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!sessions || sessions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by session ID or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleFilterChange();
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User Type Filter */}
            <div>
              <select
                value={userTypeFilter}
                onChange={(e) => {
                  setUserTypeFilter(e.target.value);
                  handleFilterChange();
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {userTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Step Filter */}
            <div>
              <select
                value={stepFilter}
                onChange={(e) => {
                  setStepFilter(e.target.value);
                  handleFilterChange();
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {stepOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>

            {/* Search Button */}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={fetchSessions}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading checkout sessions...</p>
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checkout Sessions Found</h3>
            <p className="text-gray-600">
              {search || statusFilter || userTypeFilter || stepFilter
                ? 'No sessions match your current filters. Try adjusting your search criteria.'
                : 'No checkout sessions have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cart Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.sessionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 capitalize">{session.userType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{session.email || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatStep(session.currentStep)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {session.cartValue ? formatCurrency(session.cartValue) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatDate(session.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatDate(session.lastActivity)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewSession(session)}
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {session.status === 'active' && (
                          <button
                            onClick={() => handleCancelSession(session.sessionId)}
                            disabled={cancelling === session.sessionId}
                            className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelling === session.sessionId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Cancel
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Session Detail Modal */}
      {showModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Checkout Session Details</h2>
                <p className="text-gray-600">{selectedSession.sessionId}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Session ID</h3>
                  <p className="text-sm text-gray-900">{selectedSession.sessionId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(selectedSession.status)}`}>
                    {getStatusIcon(selectedSession.status)}
                    {selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">User Type</h3>
                  <p className="text-sm text-gray-900 capitalize">{selectedSession.userType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Current Step</h3>
                  <p className="text-sm text-gray-900">{formatStep(selectedSession.currentStep)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedSession.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Activity</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedSession.lastActivity)}</p>
                </div>
                {selectedSession.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-sm text-gray-900">{selectedSession.email}</p>
                  </div>
                )}
                {selectedSession.deviceType && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Device Type</h3>
                    <p className="text-sm text-gray-900 capitalize">{selectedSession.deviceType}</p>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              {selectedSession.cart && selectedSession.cart.items.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Cart Items ({selectedSession.cart.items.length})
                  </h3>
                  <div className="space-y-3">
                      {selectedSession.cart.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(selectedSession.cart.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
