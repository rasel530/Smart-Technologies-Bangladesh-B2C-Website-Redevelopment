'use client';

import React, { useState, useEffect } from 'react';

interface SecurityAudit {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  affectedUserId?: string;
  affectedTransactionId?: string;
  ipAddress?: string;
  userAgent?: string;
  eventData?: any;
  performedBy?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export default function SecurityAuditPage() {
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    startDate: '',
    endDate: '',
    affectedUserId: '',
    affectedTransactionId: '',
    isResolved: '',
    page: 1,
    limit: 20
  });
  const [selectedAudit, setSelectedAudit] = useState<SecurityAudit | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    bySeverity: { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 },
    byType: {}
  });

  useEffect(() => {
    fetchSecurityAudits();
    fetchStatistics();
  }, [filters]);

  const fetchSecurityAudits = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.eventType) queryParams.append('eventType', filters.eventType);
      if (filters.severity) queryParams.append('severity', filters.severity);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.affectedUserId) queryParams.append('affectedUserId', filters.affectedUserId);
      if (filters.affectedTransactionId) queryParams.append('affectedTransactionId', filters.affectedTransactionId);
      if (filters.isResolved !== '') queryParams.append('isResolved', filters.isResolved);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/v1/admin/payments/security-audit?${queryParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security audits');
      }

      const data = await response.json();
      setAudits(data.data || []);
    } catch (error) {
      console.error('Error fetching security audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/v1/admin/payments/security-audit/statistics', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStatistics(data.data || statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const resolveSecurityEvent = async (id: string, resolutionNotes: string) => {
    try {
      const response = await fetch(`/api/v1/admin/payments/security-audit/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolutionNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve security event');
      }

      await fetchSecurityAudits();
      setSelectedAudit(null);
    } catch (error) {
      console.error('Error resolving security event:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Event Type', 'Severity', 'Description', 'Affected User ID', 'Affected Transaction ID', 'IP Address', 'Created At', 'Resolved At'];
    const rows = audits.map(audit => [
      audit.id,
      audit.eventType,
      audit.severity,
      audit.description,
      audit.affectedUserId || 'N/A',
      audit.affectedTransactionId || 'N/A',
      audit.ipAddress || 'N/A',
      audit.createdAt,
      audit.resolvedAt || 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return 'bg-blue-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'ERROR':
        return 'bg-orange-500';
      case 'CRITICAL':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Audit Logs</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Events</h3>
          <div className="text-3xl font-bold">{statistics.total}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Info Events</h3>
          <div className="text-3xl font-bold text-blue-600">{statistics.bySeverity.INFO}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Warning Events</h3>
          <div className="text-3xl font-bold text-yellow-600">{statistics.bySeverity.WARNING}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Error Events</h3>
          <div className="text-3xl font-bold text-orange-600">{statistics.bySeverity.ERROR}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Critical Events</h3>
          <div className="text-3xl font-bold text-red-600">{statistics.bySeverity.CRITICAL}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value, page: 1, limit: filters.limit })}
            >
              <option value="">All</option>
              <option value="FRAUD_DETECTED">Fraud Detected</option>
              <option value="HIGH_RISK_TRANSACTION">High Risk Transaction</option>
              <option value="SUSPICIOUS_BEHAVIOR">Suspicious Behavior</option>
              <option value="ANOMALOUS_PATTERN">Anomalous Pattern</option>
              <option value="BLOCKED_TRANSACTION">Blocked Transaction</option>
              <option value="UNBLOCKED_USER">Unblocked User</option>
              <option value="SECURITY_BREACH_ATTEMPT">Security Breach Attempt</option>
              <option value="AUTHENTICATION_FAILURE">Authentication Failure</option>
              <option value="AUTHORIZATION_FAILURE">Authorization Failure</option>
              <option value="DATA_ACCESS_VIOLATION">Data Access Violation</option>
              <option value="PAYMENT_GATEWAY_ISSUE">Payment Gateway Issue</option>
              <option value="WEBHOOK_SIGNATURE_INVALID">Webhook Signature Invalid</option>
              <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
              <option value="SUSPICIOUS_IP">Suspicious IP</option>
              <option value="SUSPICIOUS_DEVICE">Suspicious Device</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Severity</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1, limit: filters.limit })}
            >
              <option value="">All</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1, limit: filters.limit })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1, limit: filters.limit })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Affected User ID</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={filters.affectedUserId}
              onChange={(e) => setFilters({ ...filters, affectedUserId: e.target.value, page: 1, limit: filters.limit })}
              placeholder="Enter user ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Affected Transaction ID</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={filters.affectedTransactionId}
              onChange={(e) => setFilters({ ...filters, affectedTransactionId: e.target.value, page: 1, limit: filters.limit })}
              placeholder="Enter transaction ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.isResolved}
              onChange={(e) => setFilters({ ...filters, isResolved: e.target.value, page: 1, limit: filters.limit })}
            >
              <option value="">All</option>
              <option value="true">Resolved</option>
              <option value="false">Unresolved</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: 1, limit: filters.limit })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={() => setFilters({ eventType: '', severity: '', startDate: '', endDate: '', affectedUserId: '', affectedTransactionId: '', isResolved: '', page: 1, limit: filters.limit })}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Security Audit Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Security Audit Logs</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Event Type</th>
                <th className="text-left p-3">Severity</th>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">Affected User</th>
                <th className="text-left p-3">IP Address</th>
                <th className="text-left p-3">Created At</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{audit.id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${getSeverityColor(audit.severity)}`}>
                      {audit.eventType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${getSeverityColor(audit.severity)}`}>
                      {audit.severity}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate">{audit.description}</td>
                  <td className="p-3 font-mono text-xs">{audit.affectedUserId || 'N/A'}</td>
                  <td className="p-3 font-mono text-xs">{audit.ipAddress || 'N/A'}</td>
                  <td className="p-3">{new Date(audit.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    {audit.resolvedAt ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs">
                        Unresolved
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedAudit(audit)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Security Event Details</h2>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event ID</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAudit.id}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <span className={`px-2 py-1 rounded text-white ${getSeverityColor(selectedAudit.severity)}`}>
                  {selectedAudit.eventType}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <span className={`px-2 py-1 rounded text-white ${getSeverityColor(selectedAudit.severity)}`}>
                  {selectedAudit.severity}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <div className="p-3 bg-gray-100 rounded">{selectedAudit.description}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Affected User ID</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAudit.affectedUserId || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Affected Transaction ID</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAudit.affectedTransactionId || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IP Address</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAudit.ipAddress || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">User Agent</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded truncate">{selectedAudit.userAgent || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Performed By</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAudit.performedBy || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Created At</label>
                <div>{new Date(selectedAudit.createdAt).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Resolved At</label>
                <div>{selectedAudit.resolvedAt ? new Date(selectedAudit.resolvedAt).toLocaleString() : 'Not resolved'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Resolved By</label>
                <div>{selectedAudit.resolvedBy || 'N/A'}</div>
              </div>

              {selectedAudit.eventData && (
                <div>
                  <label className="block text-sm font-medium mb-1">Event Data</label>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                    {JSON.stringify(selectedAudit.eventData, null, 2)}
                  </pre>
                </div>
              )}

              {!selectedAudit.resolvedAt && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-1">Resolve Event</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Enter resolution notes..."
                    rows={3}
                    id="resolutionNotes"
                  />
                  <button
                    onClick={() => {
                      const notes = (document.getElementById('resolutionNotes') as HTMLTextAreaElement).value;
                      resolveSecurityEvent(selectedAudit.id, notes);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button
          disabled={filters.page === 1}
          onClick={() => setFilters({ ...filters, page: filters.page - 1, limit: filters.limit })}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="py-2">Page {filters.page}</span>
        <button
          onClick={() => setFilters({ ...filters, page: filters.page + 1, limit: filters.limit })}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
