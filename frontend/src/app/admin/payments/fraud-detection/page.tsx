'use client';

import React, { useState, useEffect } from 'react';

interface FraudDetection {
  id: string;
  userId?: string;
  transactionId: string;
  riskScore: number;
  riskLevel: string;
  detectionRules: any;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export default function FraudDetectionPage() {
  const [fraudDetections, setFraudDetections] = useState<FraudDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    riskLevel: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });
  const [selectedDetection, setSelectedDetection] = useState<FraudDetection | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    byRiskLevel: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  });

  useEffect(() => {
    fetchFraudDetections();
    fetchStatistics();
  }, [filters]);

  const fetchFraudDetections = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.riskLevel) queryParams.append('riskLevel', filters.riskLevel);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/v1/admin/payments/fraud-detection?${queryParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fraud detections');
      }

      const data = await response.json();
      setFraudDetections(data.data || []);
    } catch (error) {
      console.error('Error fetching fraud detections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/v1/admin/payments/fraud-detection/statistics', {
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

  const resolveFraudDetection = async (id: string, resolutionNotes: string) => {
    try {
      const response = await fetch(`/api/v1/admin/payments/fraud-detection/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolutionNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve fraud detection');
      }

      await fetchFraudDetections();
      setSelectedDetection(null);
    } catch (error) {
      console.error('Error resolving fraud detection:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User ID', 'Transaction ID', 'Risk Score', 'Risk Level', 'Detected At', 'Resolved At'];
    const rows = fraudDetections.map(fd => [
      fd.id,
      fd.userId || 'N/A',
      fd.transactionId,
      fd.riskScore,
      fd.riskLevel,
      fd.detectedAt,
      fd.resolvedAt || 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud-detections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
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
        <h1 className="text-3xl font-bold">Fraud Detection Dashboard</h1>
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
          <h3 className="text-sm text-gray-600 mb-2">Total Fraud Cases</h3>
          <div className="text-3xl font-bold">{statistics.total}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Low Risk</h3>
          <div className="text-3xl font-bold text-green-600">{statistics.byRiskLevel.LOW}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Medium Risk</h3>
          <div className="text-3xl font-bold text-yellow-600">{statistics.byRiskLevel.MEDIUM}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">High Risk</h3>
          <div className="text-3xl font-bold text-orange-600">{statistics.byRiskLevel.HIGH}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Critical Risk</h3>
          <div className="text-3xl font-bold text-red-600">{statistics.byRiskLevel.CRITICAL}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Risk Level</label>
              <select
              className="w-full p-2 border rounded"
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value, page: 1, limit: filters.limit })}
            >
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
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

            <div className="flex items-end gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: 1, limit: filters.limit })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={() => setFilters({ riskLevel: '', startDate: '', endDate: '', page: 1, limit: filters.limit })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
        </div>
      </div>

      {/* Fraud Detection Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Fraud Detection Records</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Transaction ID</th>
                <th className="text-left p-3">Risk Score</th>
                <th className="text-left p-3">Risk Level</th>
                <th className="text-left p-3">Detected At</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fraudDetections.map((detection) => (
                <tr key={detection.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{detection.id}</td>
                  <td className="p-3 font-mono text-xs">{detection.transactionId}</td>
                  <td className="p-3">{detection.riskScore}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${getRiskLevelColor(detection.riskLevel)}`}>
                      {detection.riskLevel}
                    </span>
                  </td>
                  <td className="p-3">{new Date(detection.detectedAt).toLocaleString()}</td>
                  <td className="p-3">
                    {detection.resolvedAt ? (
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
                      onClick={() => setSelectedDetection(detection)}
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
      {selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Fraud Detection Details</h2>
              <button
                onClick={() => setSelectedDetection(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Detection ID</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedDetection.id}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedDetection.transactionId}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedDetection.userId || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Risk Score</label>
                <div className="text-2xl font-bold">{selectedDetection.riskScore}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Risk Level</label>
                <span className={`px-3 py-1 rounded text-white ${getRiskLevelColor(selectedDetection.riskLevel)}`}>
                  {selectedDetection.riskLevel}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Detected At</label>
                <div>{new Date(selectedDetection.detectedAt).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Resolved At</label>
                <div>{selectedDetection.resolvedAt ? new Date(selectedDetection.resolvedAt).toLocaleString() : 'Not resolved'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Resolved By</label>
                <div>{selectedDetection.resolvedBy || 'N/A'}</div>
              </div>

              {selectedDetection.resolutionNotes && (
                <div>
                  <label className="block text-sm font-medium mb-1">Resolution Notes</label>
                  <div className="p-3 bg-gray-100 rounded">{selectedDetection.resolutionNotes}</div>
                </div>
              )}

              {!selectedDetection.resolvedAt && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-1">Resolve Detection</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Enter resolution notes..."
                    rows={3}
                    id="resolutionNotes"
                  />
                  <button
                    onClick={() => {
                      const notes = (document.getElementById('resolutionNotes') as HTMLTextAreaElement).value;
                      resolveFraudDetection(selectedDetection.id, notes);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Resolve
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Detection Rules</label>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                  {JSON.stringify(selectedDetection.detectionRules, null, 2)}
                </pre>
              </div>
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
