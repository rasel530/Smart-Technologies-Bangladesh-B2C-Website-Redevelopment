'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { 
  Eye, 
  Mail, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock
} from 'lucide-react';

// Types
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    price: number;
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

interface CheckoutAbandonment {
  id: number;
  sessionId: string;
  step: 'cart' | 'shipping' | 'billing' | 'payment' | 'review' | 'confirmation';
  reason: string;
  cartValue: number;
  recovered: boolean;
  recoveryAttempts: number;
  lastRecoveryAttempt?: string;
  abandonedAt: string;
  session?: CheckoutSession;
}

interface CheckoutAbandonmentsResponse {
  success: boolean;
  data: CheckoutAbandonment[];
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
  if (typeof step !== 'string' || !step) {
    return 'Unknown';
  }
  return step.charAt(0).toUpperCase() + step.slice(1);
};

const getRecoveryStatusColor = (recovered: boolean): string => {
  return recovered
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
};

const stepOptions = [
  { value: '', label: 'All Steps' },
  { value: 'cart', label: 'Cart' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'billing', label: 'Billing' },
  { value: 'payment', label: 'Payment' },
  { value: 'review', label: 'Review' },
  { value: 'confirmation', label: 'Confirmation' }
];

const recoveryStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Recovered' },
  { value: 'false', label: 'Not Recovered' }
];

interface CheckoutAbandonmentTableProps {
  onAbandonmentClick?: (abandonment: CheckoutAbandonment) => void;
  initialFilters?: {
    step?: string;
    reason?: string;
    recovered?: string;
    search?: string;
  };
}

/**
 * CheckoutAbandonmentTable Component
 * 
 * Displays a table of abandoned checkout sessions with filtering, search, and pagination.
 * Supports viewing abandonment details, sending recovery emails, and exporting data.
 */
export default function CheckoutAbandonmentTable({ onAbandonmentClick, initialFilters = {} }: CheckoutAbandonmentTableProps) {
  const [abandonments, setAbandonments] = useState<CheckoutAbandonment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAbandonments, setTotalAbandonments] = useState(0);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  
  // Filters
  const [search, setSearch] = useState(initialFilters.search || '');
  const [stepFilter, setStepFilter] = useState(initialFilters.step || '');
  const [recoveredFilter, setRecoveredFilter] = useState(initialFilters.recovered || '');

  // Modal
  const [selectedAbandonment, setSelectedAbandonment] = useState<CheckoutAbandonment | null>(null);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    fetchAbandonments();
  }, [page, stepFilter, recoveredFilter]);

  const fetchAbandonments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString()
      });

      if (stepFilter) params.append('step', stepFilter);
      if (recoveredFilter) params.append('recovered', recoveredFilter);
      if (search) params.append('reason', search);

      const response: CheckoutAbandonmentsResponse = await apiClient.get(`/admin/checkout/abandonment?${params.toString()}`, { unwrapResponse: false });
      setAbandonments(response.data);
      setTotalPages(response.pagination.pages);
      setTotalAbandonments(response.pagination.total);
    } catch (err: any) {
      console.error('Error fetching abandoned checkouts:', err);
      setError(err.message || 'Failed to load abandoned checkouts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAbandonments();
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchAbandonments();
  };

  const clearFilters = () => {
    setSearch('');
    setStepFilter('');
    setRecoveredFilter('');
    setPage(1);
    fetchAbandonments();
  };

  const handleViewAbandonment = (abandonment: CheckoutAbandonment) => {
    setSelectedAbandonment(abandonment);
    setShowModal(true);
    if (onAbandonmentClick) {
      onAbandonmentClick(abandonment);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAbandonment(null);
  };

  const handleSendRecoveryEmail = async (abandonmentId: number) => {
    if (!confirm('Are you sure you want to send a recovery email for this abandoned checkout?')) {
      return;
    }

    setSendingEmail(abandonmentId);
    try {
      await apiClient.post(`/admin/checkout/abandonment/${abandonmentId}/recover`);
      
      // Update local state
      setAbandonments(abandonments?.map(abandonment => 
        abandonment.id === abandonmentId 
          ? { ...abandonment, recoveryAttempts: abandonment.recoveryAttempts + 1, lastRecoveryAttempt: new Date().toISOString() }
          : abandonment
      ));
      
      alert('Recovery email sent successfully!');
    } catch (err: any) {
      console.error('Error sending recovery email:', err);
      alert(err.message || 'Failed to send recovery email. Please try again.');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleExportCSV = () => {
    if (!abandonments || abandonments.length === 0) {
      alert('No abandonments to export');
      return;
    }

    const headers = [
      'ID',
      'Session ID',
      'User Type',
      'Email',
      'Abandonment Step',
      'Reason',
      'Cart Value',
      'Recovered',
      'Recovery Attempts',
      'Last Recovery Attempt',
      'Abandoned At'
    ];

    const csvContent = [
      headers.join(','),
      ...abandonments?.map(abandonment => [
        abandonment.id,
        abandonment.sessionId,
        abandonment.session?.userType || 'N/A',
        abandonment.session?.email || 'N/A',
        abandonment.step,
        abandonment.reason,
        abandonment.cartValue.toFixed(2),
        abandonment.recovered ? 'Yes' : 'No',
        abandonment.recoveryAttempts,
        abandonment.lastRecoveryAttempt ? formatDate(abandonment.lastRecoveryAttempt) : 'N/A',
        formatDate(abandonment.abandonedAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkout-abandonments-export-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h2 className="text-xl font-bold text-gray-900">Abandoned Checkouts</h2>
          <p className="text-gray-600 mt-1">
            {totalAbandonments} {totalAbandonments === 1 ? 'abandonment' : 'abandonments'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAbandonments}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={abandonments?.length === 0}
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
                  placeholder="Search by reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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

            {/* Recovery Status Filter */}
            <div>
              <select
                value={recoveredFilter}
                onChange={(e) => {
                  setRecoveredFilter(e.target.value);
                  handleFilterChange();
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {recoveryStatusOptions.map(option => (
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
                onClick={fetchAbandonments}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abandonments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading abandoned checkouts...</p>
          </div>
        ) : abandonments?.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Abandoned Checkouts Found</h3>
            <p className="text-gray-600">
              {search || stepFilter || recoveredFilter
                ? 'No abandonments match your current filters. Try adjusting your search criteria.'
                : 'No checkouts have been abandoned yet.'}
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
                    Abandonment Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cart Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recovery Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recovery Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abandoned At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abandonments?.map((abandonment) => (
                  <tr key={abandonment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{abandonment.sessionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {abandonment.session?.userType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{abandonment.session?.email || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatStep(abandonment.step)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 max-w-xs truncate block">{abandonment.reason}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(abandonment.cartValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getRecoveryStatusColor(abandonment.recovered)}`}>
                        {abandonment.recovered ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Recovered
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Not Recovered
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{abandonment.recoveryAttempts}</span>
                        {abandonment.lastRecoveryAttempt && (
                          <span className="text-xs text-gray-500">
                            ({formatDate(abandonment.lastRecoveryAttempt)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(abandonment.abandonedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAbandonment(abandonment)}
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {!abandonment.recovered && (
                          <button
                            onClick={() => handleSendRecoveryEmail(abandonment.id)}
                            disabled={sendingEmail === abandonment.id}
                            className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingEmail === abandonment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            Recover
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

      {/* Abandonment Detail Modal */}
      {showModal && selectedAbandonment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Abandoned Checkout Details</h2>
                <p className="text-gray-600">{selectedAbandonment.sessionId}</p>
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
              {/* Abandonment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Session ID</h3>
                  <p className="text-sm text-gray-900">{selectedAbandonment.sessionId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Abandonment Step</h3>
                  <p className="text-sm text-gray-900">{formatStep(selectedAbandonment.step)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Reason</h3>
                  <p className="text-sm text-gray-900">{selectedAbandonment.reason}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Cart Value</h3>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedAbandonment.cartValue)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Recovery Status</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getRecoveryStatusColor(selectedAbandonment.recovered)}`}>
                    {selectedAbandonment.recovered ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Recovered
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Not Recovered
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Recovery Attempts</h3>
                  <p className="text-sm text-gray-900">{selectedAbandonment.recoveryAttempts}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Abandoned At</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedAbandonment.abandonedAt)}</p>
                </div>
                {selectedAbandonment.lastRecoveryAttempt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Last Recovery Attempt</h3>
                    <p className="text-sm text-gray-900">{formatDate(selectedAbandonment.lastRecoveryAttempt)}</p>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              {selectedAbandonment.session?.cart && selectedAbandonment.session.cart.items.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Cart Items ({selectedAbandonment.session.cart.items.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedAbandonment.session.cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(selectedAbandonment.session.cart.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Recovery Email Button */}
              {!selectedAbandonment.recovered && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => handleSendRecoveryEmail(selectedAbandonment.id)}
                    disabled={sendingEmail === selectedAbandonment.id}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sendingEmail === selectedAbandonment.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Recovery Email
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
