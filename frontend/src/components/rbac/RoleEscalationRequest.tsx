'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowUp, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { Role, RoleEscalationRequest as EscalationRequest } from '@/types/rbac';
import { rbacApi } from '@/lib/api/rbac';
import { getRoleDisplayName } from '@/lib/rbac/utils';

interface RoleEscalationRequestProps {
  userId: string;
  currentRole: Role;
  onRequestCreated?: (request: EscalationRequest) => void;
}

/**
 * RoleEscalationRequest Component
 * 
 * Form to request role escalation.
 * Displays current role and available target roles.
 * Shows reason field and request status.
 */
export default function RoleEscalationRequest({
  userId,
  currentRole,
  onRequestCreated,
}: RoleEscalationRequestProps) {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [myRequests, setMyRequests] = useState<EscalationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesResponse, requestsResponse] = await Promise.all([
        rbacApi.roles.list(),
        rbacApi.escalations.getMyRequests(),
      ]);

      setAvailableRoles(rolesResponse.data || []);
      setMyRequests(requestsResponse.data || []);
    } catch (error) {
      console.error('[RoleEscalationRequest] Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the escalation request');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await rbacApi.escalations.create({
        requestedRoleId: selectedRole,
        reason: reason.trim(),
      });

      setSuccess('Escalation request submitted successfully');
      setShowForm(false);
      setSelectedRole('');
      setReason('');

      // Add new request to list
      setMyRequests((prev) => [response.data, ...prev]);

      if (onRequestCreated) {
        onRequestCreated(response.data);
      }
    } catch (error: any) {
      console.error('[RoleEscalationRequest] Error creating request:', error);
      setError(error.message || 'Failed to submit escalation request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await rbacApi.escalations.cancel(requestId);

      setSuccess('Request cancelled successfully');

      // Remove request from list
      setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error: any) {
      console.error('[RoleEscalationRequest] Error cancelling request:', error);
      setError(error.message || 'Failed to cancel request');
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter available roles (only higher level roles)
  const eligibleRoles = availableRoles.filter(
    (role) => role.hierarchy_level > currentRole.hierarchy_level
  );

  // Check if user has pending request
  const hasPendingRequest = myRequests.some((r) => r.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Current Role */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Current Role
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {getRoleDisplayName(currentRole.name)}
            </div>
            <div className="text-sm text-gray-600">
              Level {currentRole.hierarchy_level}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">
              Assigned: {formatDate(currentRole.createdAt)}
            </div>
            <div className="text-sm text-gray-600">
              {currentRole.description}
            </div>
          </div>
        </div>
      </div>

      {/* Request Form */}
      {!hasPendingRequest && eligibleRoles.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ArrowUp className="w-5 h-5 mr-2" />
              Request Role Escalation
            </h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                New Request
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a role</option>
                  {eligibleRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleDisplayName(role.name)} (Level {role.hierarchy_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Escalation
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please explain why you need this role escalation..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* No Eligible Roles */}
      {!hasPendingRequest && eligibleRoles.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No higher roles available for escalation</p>
          <p className="text-sm text-gray-500">
            You currently have the highest role level
          </p>
        </div>
      )}

      {/* Pending Request Notice */}
      {hasPendingRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900 mb-1">
                Pending Escalation Request
              </p>
              <p className="text-sm text-gray-600">
                You have a pending escalation request. Please wait for it to be reviewed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Request History */}
      {myRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Request History
          </h3>

          <div className="space-y-3">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {getRoleDisplayName(request.currentRole.name)} →{' '}
                        {getRoleDisplayName(request.requestedRole.name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {request.currentRole.hierarchy_level} →{' '}
                        Level {request.requestedRole.hierarchy_level}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      request.status
                    )}`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {request.reason}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                    {request.reviewedAt && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {request.reviewNotes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Review Notes:</span>{' '}
                      {request.reviewNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
