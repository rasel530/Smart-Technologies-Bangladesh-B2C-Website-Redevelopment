'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Shield
} from 'lucide-react';
import { RoleEscalationRequest } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';

/**
 * Role Escalation Requests Page
 * 
 * Admin page for managing role escalation requests.
 * Lists pending requests, allows approving/rejecting requests,
 * and viewing request history.
 */
export default function RoleEscalationRequestsPage() {
  const [requests, setRequests] = useState<RoleEscalationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  // Review form state
  const [selectedRequest, setSelectedRequest] = useState<RoleEscalationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await rbacApi.escalations.list(
        statusFilter !== 'all' ? statusFilter : undefined
      );

      setRequests(response.data || []);
    } catch (error: any) {
      console.error('[RoleEscalationRequests] Error fetching requests:', error);
      setError(error.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setReviewing(true);
      setError('');
      setSuccess('');

      await rbacApi.escalations.approve(selectedRequest.id, {
        reviewNotes: reviewNotes.trim() || undefined,
      });

      setSuccess('Request approved successfully');
      setSelectedRequest(null);
      setReviewNotes('');
      
      fetchRequests();
    } catch (error: any) {
      console.error('[RoleEscalationRequests] Error approving request:', error);
      setError(error.message || 'Failed to approve request');
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setReviewing(true);
      setError('');
      setSuccess('');

      await rbacApi.escalations.reject(selectedRequest.id, {
        reviewNotes: reviewNotes.trim() || undefined,
      });

      setSuccess('Request rejected successfully');
      setSelectedRequest(null);
      setReviewNotes('');
      
      fetchRequests();
    } catch (error: any) {
      console.error('[RoleEscalationRequests] Error rejecting request:', error);
      setError(error.message || 'Failed to reject request');
    } finally {
      setReviewing(false);
    }
  };

  const toggleExpand = (requestId: string) => {
    setExpandedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleDisplayName(request.currentRole.name)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getRoleDisplayName(request.requestedRole.name)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ArrowUp className="w-8 h-8 mr-3" />
            Role Escalation Requests
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage role escalation requests
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Link>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Pending Requests Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">
                {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-sm text-gray-600">
                Please review and respond to pending requests
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white border rounded-lg p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests by user, role, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          {filteredRequests.length} requests
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No requests found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No escalation requests available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-medium text-gray-900 mb-1">
                        {getRoleDisplayName(request.currentRole.name)} →{' '}
                        {getRoleDisplayName(request.requestedRole.name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {request.currentRole.hierarchy_level} →{' '}
                        Level {request.requestedRole.hierarchy_level}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        request.status
                      )}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    <button
                      onClick={() => toggleExpand(request.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <User className="w-4 h-4" />
                  <span>User ID: {request.userId}</span>
                </div>

                {/* Reason */}
                <div className="mb-3">
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Requested: {formatDate(request.createdAt)}</span>
                  </div>
                  {request.reviewedAt && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedRequests.has(request.id) && (
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    {/* Review Info */}
                    {request.status !== 'pending' && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Review Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Reviewed By:</span>{' '}
                            <span className="text-gray-900">{request.reviewedBy || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reviewed At:</span>{' '}
                            <span className="text-gray-900">
                              {request.reviewedAt ? formatDate(request.reviewedAt) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        {request.reviewNotes && (
                          <div className="mt-3">
                            <span className="text-gray-500">Review Notes:</span>{' '}
                            <p className="text-gray-900 bg-gray-50 rounded-lg p-3 mt-1">
                              {request.reviewNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons for Pending Requests */}
                    {request.status === 'pending' && !selectedRequest && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Review Request
                        </button>
                      </div>
                    )}

                    {/* Review Form */}
                    {selectedRequest?.id === request.id && request.status === 'pending' && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Review Request</h4>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-2">
                              Review Notes (Optional)
                            </label>
                            <textarea
                              id="reviewNotes"
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Add notes explaining your decision..."
                            />
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={handleApprove}
                              disabled={reviewing}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                            >
                              {reviewing ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleReject}
                              disabled={reviewing}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                            >
                              {reviewing ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(null);
                                setReviewNotes('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {requests.filter((r) => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
