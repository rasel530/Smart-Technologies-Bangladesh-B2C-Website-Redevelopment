/**
 * Admin Tracking Issues Page
 * 
 * Display orders with tracking issues and provide management actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTracking } from '@/hooks/useAdminTracking';
import { TrackingIssue } from '@/lib/api/orderTracking';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminTrackingIssuesPage() {
  const {
    isLoading,
    error,
    trackingIssues,
    courierServices,
    getTrackingIssues,
    getCourierServices,
    investigateIssues,
    resolveIssues,
    clearError,
  } = useAdminTracking();

  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    courierServiceId: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showIssueDetails, setShowIssueDetails] = useState<TrackingIssue | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadIssues();
    loadCourierServices();
  }, []);

  const loadCourierServices = async () => {
    await getCourierServices();
  };

  const loadIssues = async () => {
    const apiFilters: any = {};
    if (filters.status) apiFilters.status = filters.status;
    if (filters.startDate) apiFilters.startDate = filters.startDate;
    if (filters.endDate) apiFilters.endDate = filters.endDate;
    if (filters.courierServiceId) apiFilters.courierServiceId = filters.courierServiceId;

    await getTrackingIssues(apiFilters);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadIssues();
  };

  const handleClearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', courierServiceId: '' });
    setSearchQuery('');
    loadIssues();
  };

  const handleSelectIssue = (issueId: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIssues.size === filteredIssues.length) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(filteredIssues.map((issue) => issue.orderId)));
    }
  };

  const handleBulkInvestigate = async () => {
    if (selectedIssues.size === 0) return;
    setIsProcessing(true);
    try {
      const orderIds = Array.from(selectedIssues);
      const result = await investigateIssues({ orderIds });

      if (result) {
        alert(`Successfully investigated ${result.investigatedCount} orders${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`);
        setSelectedIssues(new Set());
        await loadIssues();
      } else {
        alert('Failed to investigate issues. Please try again.');
      }
    } catch (error) {
      console.error('Error investigating issues:', error);
      alert('Failed to investigate issues. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkResolve = async () => {
    if (selectedIssues.size === 0) return;
    setIsProcessing(true);
    try {
      const orderIds = Array.from(selectedIssues);
      const result = await resolveIssues({ orderIds });

      if (result) {
        alert(`Successfully resolved ${result.resolvedCount} orders${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`);
        setSelectedIssues(new Set());
        await loadIssues();
      } else {
        alert('Failed to resolve issues. Please try again.');
      }
    } catch (error) {
      console.error('Error resolving issues:', error);
      alert('Failed to resolve issues. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewIssue = (issue: TrackingIssue) => {
    setShowIssueDetails(issue);
  };

  const handleContactCourier = async (issue: TrackingIssue) => {
    if (!issue.trackingNumber || !issue.courierService) {
      alert('No tracking information available for this order');
      return;
    }
    
    // Open courier tracking URL if available
    const courier = courierServices.find(c => c.name === issue.courierService);
    if (courier?.trackingUrl && issue.trackingNumber) {
      const trackingUrl = courier.trackingUrl.replace('{tracking_number}', issue.trackingNumber);
      window.open(trackingUrl, '_blank');
    } else {
      alert(`Contacting courier for order ${issue.orderNumber}...\n\nTracking Number: ${issue.trackingNumber}\nCourier: ${issue.courierService}`);
    }
  };

  const handleInvestigateIssue = async (issue: TrackingIssue) => {
    setIsProcessing(true);
    try {
      const result = await investigateIssues({ orderIds: [issue.orderId] });

      if (result) {
        alert(`Order ${issue.orderNumber} marked as under investigation`);
        setShowIssueDetails(null);
        await loadIssues();
      } else {
        alert('Failed to investigate issue. Please try again.');
      }
    } catch (error) {
      console.error('Error investigating issue:', error);
      alert('Failed to investigate issue. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveIssue = async (issue: TrackingIssue) => {
    setIsProcessing(true);
    try {
      const result = await resolveIssues({ orderIds: [issue.orderId] });

      if (result) {
        alert(`Order ${issue.orderNumber} marked as resolved`);
        setShowIssueDetails(null);
        await loadIssues();
      } else {
        alert('Failed to resolve issue. Please try again.');
      }
    } catch (error) {
      console.error('Error resolving issue:', error);
      alert('Failed to resolve issue. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Order ID', 'Order Number', 'Status', 'Created At', 'Tracking Number', 'Courier', 'Issue'].join(','),
      ...filteredIssues.map((issue) =>
        [
          issue.orderId,
          issue.orderNumber,
          issue.status,
          new Date(issue.createdAt).toISOString(),
          issue.trackingNumber || '',
          issue.courierService || '',
          issue.issue,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-issues-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredIssues = trackingIssues.filter((issue) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      issue.orderNumber.toLowerCase().includes(query) ||
      issue.trackingNumber?.toLowerCase().includes(query) ||
      issue.issue.toLowerCase().includes(query)
    );
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getIssueSeverity = (issue: string): 'high' | 'medium' | 'low' => {
    const issueLower = issue.toLowerCase();
    if (issueLower.includes('too long') || issueLower.includes('lost')) {
      return 'high';
    }
    if (issueLower.includes('no tracking')) {
      return 'medium';
    }
    return 'low';
  };

  const severityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Tracking Issues">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Tracking Issues
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor and resolve order tracking problems
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {trackingIssues.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">High Severity</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {trackingIssues.filter((i) => getIssueSeverity(i.issue) === 'high').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Medium Severity</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  {trackingIssues.filter((i) => getIssueSeverity(i.issue) === 'medium').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">🟡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Type
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Issues</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Courier Service
              </label>
              <select
                value={filters.courierServiceId}
                onChange={(e) => handleFilterChange('courierServiceId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Couriers</option>
                {courierServices.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order ID, tracking number, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIssues.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedIssues.size} issue{selectedIssues.size > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkInvestigate}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Investigate Selected'}
                </button>
                <button
                  onClick={handleBulkResolve}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Resolve Selected'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Issues List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIssues.size === filteredIssues.length && filteredIssues.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Courier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No tracking issues found
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => {
                    const severity = getIssueSeverity(issue.issue);
                    return (
                      <tr key={issue.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIssues.has(issue.orderId)}
                            onChange={() => handleSelectIssue(issue.orderId)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                          {issue.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {issue.trackingNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {issue.courierService || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {issue.issue}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[severity]}`}>
                            {severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {formatDate(issue.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewIssue(issue)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isProcessing}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleContactCourier(issue)}
                              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isProcessing}
                            >
                              Contact
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Issue Details Modal */}
      {showIssueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Issue Details
              </h2>
              <button
                onClick={() => setShowIssueDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {showIssueDetails.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {showIssueDetails.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Number</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {showIssueDetails.trackingNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Courier Service</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {showIssueDetails.courierService || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Issue</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {showIssueDetails.issue}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(showIssueDetails.createdAt)}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex gap-3">
              <button
                onClick={() => handleInvestigateIssue(showIssueDetails)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Investigate'}
              </button>
              <button
                onClick={() => handleResolveIssue(showIssueDetails)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Resolve'}
              </button>
              <button
                onClick={() => setShowIssueDetails(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
