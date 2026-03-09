/**
 * Order History Page
 * 
 * Display order history for authenticated users with filtering, sorting, and pagination.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { OrderStatus, OrderHistoryFilters } from '@/lib/api/orderManagement';

export default function OrderHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const {
    orders,
    pagination,
    isLoadingHistory,
    historyError,
    getOrderHistory,
    clearErrors,
  } = useOrderHistory(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'total' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Load filters from URL params
  useEffect(() => {
    const status = searchParams.get('status') as OrderStatus | null;
    const sort = searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'total' | 'status' | null;
    const order = searchParams.get('sortOrder') as 'asc' | 'desc' | null;
    const search = searchParams.get('search') || '';

    if (status) setStatusFilter(status);
    if (sort) setSortBy(sort);
    if (order) setSortOrder(order);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Apply filters
  useEffect(() => {
    const filters: OrderHistoryFilters = {
      page: pagination?.page || 1,
      limit: 20,
      sortBy,
      sortOrder,
    };

    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }

    if (searchQuery.trim()) {
      // Search is handled by the backend, but we can filter client-side for now
      // In production, this would be passed to the API
    }

    getOrderHistory(filters);
  }, [statusFilter, sortBy, sortOrder, pagination?.page]);

  // Update URL params
  const updateUrlParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/orders?${newParams.toString()}`);
  };

  const handleStatusChange = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    updateUrlParams({ status: status === 'all' ? '' : status });
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      updateUrlParams({ sortBy: newSortBy, sortOrder: newOrder });
    } else {
      setSortBy(newSortBy);
      updateUrlParams({ sortBy: newSortBy, sortOrder });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateUrlParams({ search: value });
  };

  const handlePageChange = (page: number) => {
    if (pagination) {
      getOrderHistory({ ...{ status: statusFilter === 'all' ? undefined : statusFilter, sortBy, sortOrder }, page });
    }
  };

  // Ensure filteredOrders is always an array, even if orders is undefined or not an array
  const filteredOrders = Array.isArray(orders)
    ? searchQuery.trim()
      ? orders.filter(order =>
          order?.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : orders
    : [];

  const statusLabels: Record<OrderStatus, { en: string; bn: string; color: string }> = {
    pending: { en: 'Pending', bn: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    processing: { en: 'Processing', bn: 'প্রক্রিয়াকরণ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    shipped: { en: 'Shipped', bn: 'প্রেরিত', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
    delivered: { en: 'Delivered', bn: 'বিতরণ করা হয়েছে', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    cancelled: { en: 'Cancelled', bn: 'বাতিল', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    refunded: { en: 'Refunded', bn: 'ফেরত', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${numAmount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Order History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your orders
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Orders
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by order number..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="lg:w-48">
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                id="sortBy"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as typeof sortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                  updateUrlParams({ sortBy: newSortBy, sortOrder: newSortOrder });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="createdAt-desc">Date (Newest)</option>
                <option value="createdAt-asc">Date (Oldest)</option>
                <option value="total-desc">Total (Highest)</option>
                <option value="total-asc">Total (Lowest)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {historyError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{historyError}</p>
              <button
                onClick={clearErrors}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : "You haven't placed any orders yet."}
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = statusLabels[order.status];
              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {order.orderNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.en}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            <span className="font-medium">Date:</span> {formatDate(order.created_at)}
                          </span>
                          <span>
                            <span className="font-medium">Items:</span> {order.items?.length || 0}
                          </span>
                          {order.shippedAt && order.status === 'shipped' && (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              <span className="font-medium">Est. Delivery:</span>{' '}
                              {formatDate(new Date(order.shippedAt.getTime() + 3 * 24 * 60 * 60 * 1000))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="px-6 pb-6 pt-0">
                      <div className="flex gap-2 overflow-x-auto">
                        {order.items.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                          >
                            {item.product?.images?.[0]?.originalUrl ? (
                              <img
                                src={item.product.images[0]?.originalUrl}
                                alt={item.product.images[0]?.altTextEn || item.product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <span className="text-2xl">📦</span>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              +{order.items.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded-lg ${
                    pageNum === pagination.page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
