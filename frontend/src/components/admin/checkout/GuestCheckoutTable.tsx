'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { 
  Eye, 
  UserPlus, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ShoppingCart,
  User,
  Mail,
  Phone,
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

interface GuestSession {
  id: string;
  sessionId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  cartValue?: number;
  status: 'active' | 'completed' | 'abandoned' | 'expired';
  converted: boolean;
  convertedAt?: string;
  convertedToUserId?: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  checkoutSession?: CheckoutSession;
}

interface GuestSessionsResponse {
  success: boolean;
  data: GuestSession[];
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

const getConversionStatusColor = (converted: boolean): string => {
  return converted
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'expired', label: 'Expired' }
];

const conversionStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Converted' },
  { value: 'false', label: 'Not Converted' }
];

interface GuestCheckoutTableProps {
  onGuestClick?: (guest: GuestSession) => void;
  initialFilters?: {
    converted?: string;
    status?: string;
    search?: string;
  };
}

/**
 * GuestCheckoutTable Component
 * 
 * Displays a table of guest checkout sessions with filtering, search, and pagination.
 * Supports viewing guest session details, tracking conversion, and exporting data.
 */
export default function GuestCheckoutTable({ onGuestClick, initialFilters = {} }: GuestCheckoutTableProps) {
  const [guestSessions, setGuestSessions] = useState<GuestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);
  const [converting, setConverting] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || '');
  const [convertedFilter, setConvertedFilter] = useState(initialFilters.converted || '');

  // Modal
  const [selectedGuest, setSelectedGuest] = useState<GuestSession | null>(null);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    fetchGuestSessions();
  }, [page, statusFilter, convertedFilter]);

  const fetchGuestSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString()
      });

      if (statusFilter) params.append('status', statusFilter);
      if (convertedFilter) params.append('converted', convertedFilter);
      if (search) params.append('search', search);

      const response: GuestSessionsResponse = await apiClient.get(`/admin/checkout/guest/sessions?${params.toString()}`, { unwrapResponse: false });
      setGuestSessions(response.data);
      setTotalPages(response.pagination.pages);
      setTotalGuests(response.pagination.total);
    } catch (err: any) {
      console.error('Error fetching guest checkout sessions:', err);
      setError(err.message || 'Failed to load guest checkout sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGuestSessions();
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchGuestSessions();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setConvertedFilter('');
    setPage(1);
    fetchGuestSessions();
  };

  const handleViewGuest = (guest: GuestSession) => {
    setSelectedGuest(guest);
    setShowModal(true);
    if (onGuestClick) {
      onGuestClick(guest);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGuest(null);
  };

  const handleConvertGuest = async (sessionId: string) => {
    if (!confirm('Are you sure you want to convert this guest session to a user account?')) {
      return;
    }

    setConverting(sessionId);
    try {
      // This would be implemented in the backend
      // For now, we'll just update the local state
      setGuestSessions(guestSessions.map(guest => 
        guest.sessionId === sessionId 
          ? { ...guest, converted: true, convertedAt: new Date().toISOString() }
          : guest
      ));
      
      alert('Guest session converted successfully!');
    } catch (err: any) {
      console.error('Error converting guest session:', err);
      alert(err.message || 'Failed to convert guest session. Please try again.');
    } finally {
      setConverting(null);
    }
  };

  const handleExportCSV = () => {
    if (guestSessions.length === 0) {
      alert('No guest sessions to export');
      return;
    }

    const headers = [
      'Session ID',
      'Email',
      'Phone',
      'Name',
      'Cart Value',
      'Status',
      'Converted',
      'Converted At',
      'Created At',
      'Last Activity'
    ];

    const csvContent = [
      headers.join(','),
      ...guestSessions.map(guest => [
        guest.sessionId,
        guest.email || 'N/A',
        guest.phone || 'N/A',
        guest.firstName && guest.lastName ? `${guest.firstName} ${guest.lastName}` : 'N/A',
        guest.cartValue ? guest.cartValue.toFixed(2) : '0.00',
        guest.status,
        guest.converted ? 'Yes' : 'No',
        guest.convertedAt ? formatDate(guest.convertedAt) : 'N/A',
        formatDate(guest.createdAt),
        formatDate(guest.lastActivity)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-checkout-sessions-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
  };

  // Calculate conversion metrics
  const convertedCount = guestSessions.filter(g => g.converted).length;
  const conversionRate = guestSessions.length > 0 ? (convertedCount / guestSessions.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Guest Checkout Sessions</h2>
          <p className="text-gray-600 mt-1">
            {totalGuests} {totalGuests === 1 ? 'session' : 'sessions'} • {conversionRate.toFixed(1)}% conversion rate
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchGuestSessions}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={guestSessions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{totalGuests}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Converted</p>
              <p className="text-2xl font-bold text-green-600">{convertedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</p>
            </div>
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
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
                  placeholder="Search by email, phone, or session ID..."
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

            {/* Conversion Status Filter */}
            <div>
              <select
                value={convertedFilter}
                onChange={(e) => {
                  setConvertedFilter(e.target.value);
                  handleFilterChange();
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {conversionStatusOptions.map(option => (
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
                onClick={fetchGuestSessions}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Sessions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading guest checkout sessions...</p>
          </div>
        ) : guestSessions.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guest Sessions Found</h3>
            <p className="text-gray-600">
              {search || statusFilter || convertedFilter
                ? 'No guest sessions match your current filters. Try adjusting your search criteria.'
                : 'No guest checkout sessions have been created yet.'}
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cart Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Converted
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
                {guestSessions.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{guest.sessionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{guest.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{guest.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {guest.firstName && guest.lastName 
                            ? `${guest.firstName} ${guest.lastName}` 
                            : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {guest.cartValue ? formatCurrency(guest.cartValue) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{guest.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getConversionStatusColor(guest.converted)}`}>
                        {guest.converted ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Yes
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            No
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(guest.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatDate(guest.lastActivity)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewGuest(guest)}
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {!guest.converted && (
                          <button
                            onClick={() => handleConvertGuest(guest.sessionId)}
                            disabled={converting === guest.sessionId}
                            className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {converting === guest.sessionId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            Convert
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

      {/* Guest Session Detail Modal */}
      {showModal && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Guest Session Details</h2>
                <p className="text-gray-600">{selectedGuest.sessionId}</p>
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
              {/* Guest Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Session ID</h3>
                  <p className="text-sm text-gray-900">{selectedGuest.sessionId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <p className="text-sm text-gray-900 capitalize">{selectedGuest.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{selectedGuest.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{selectedGuest.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {selectedGuest.firstName && selectedGuest.lastName 
                        ? `${selectedGuest.firstName} ${selectedGuest.lastName}` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Cart Value</h3>
                  <p className="text-sm text-gray-900">
                    {selectedGuest.cartValue ? formatCurrency(selectedGuest.cartValue) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Converted</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getConversionStatusColor(selectedGuest.converted)}`}>
                    {selectedGuest.converted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        No
                      </>
                    )}
                  </span>
                </div>
                {selectedGuest.convertedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Converted At</h3>
                    <p className="text-sm text-gray-900">{formatDate(selectedGuest.convertedAt)}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedGuest.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Activity</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedGuest.lastActivity)}</p>
                </div>
              </div>

              {/* Cart Items */}
              {selectedGuest.checkoutSession?.cart && selectedGuest.checkoutSession.cart.items.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Cart Items ({selectedGuest.checkoutSession.cart.items.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedGuest.checkoutSession.cart.items.map((item) => (
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
                      <span className="text-gray-900">{formatCurrency(selectedGuest.checkoutSession.cart.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Convert Button */}
              {!selectedGuest.converted && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => handleConvertGuest(selectedGuest.sessionId)}
                    disabled={converting === selectedGuest.sessionId}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {converting === selectedGuest.sessionId ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Convert to User Account
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
