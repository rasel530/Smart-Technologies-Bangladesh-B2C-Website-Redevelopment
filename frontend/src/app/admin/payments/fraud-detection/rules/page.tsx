'use client';

import React, { useState, useEffect } from 'react';

interface FraudRule {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  priority: number;
  weight: number;
  isActive: boolean;
  conditions: any;
  actions: any;
  createdAt: string;
  updatedAt: string;
}

export default function FraudRulesPage() {
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FraudRule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byType: {}
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'VELOCITY_CHECK',
    priority: 50,
    weight: 10,
    isActive: true,
    conditions: {},
    actions: {}
  });

  useEffect(() => {
    fetchFraudRules();
    fetchStatistics();
  }, []);

  const fetchFraudRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/payments/fraud-detection/rules', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fraud rules');
      }

      const data = await response.json();
      setRules(data.data || []);
    } catch (error) {
      console.error('Error fetching fraud rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/v1/admin/payments/fraud-detection/rules/statistics', {
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

  const createFraudRule = async () => {
    try {
      const response = await fetch('/api/v1/admin/payments/fraud-detection/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create fraud rule');
      }

      await fetchFraudRules();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating fraud rule:', error);
    }
  };

  const updateFraudRule = async () => {
    if (!editingRule) return;

    try {
      const response = await fetch(`/api/v1/admin/payments/fraud-detection/rules/${editingRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update fraud rule');
      }

      await fetchFraudRules();
      setShowEditModal(false);
      setEditingRule(null);
      resetForm();
    } catch (error) {
      console.error('Error updating fraud rule:', error);
    }
  };

  const deleteFraudRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fraud rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/payments/fraud-detection/rules/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete fraud rule');
      }

      await fetchFraudRules();
    } catch (error) {
      console.error('Error deleting fraud rule:', error);
    }
  };

  const toggleRuleStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/v1/admin/payments/fraud-detection/rules/${id}/${isActive ? 'activate' : 'deactivate'}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to toggle rule status');
      }

      await fetchFraudRules();
    } catch (error) {
      console.error('Error toggling rule status:', error);
    }
  };

  const openEditModal = (rule: FraudRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      priority: rule.priority,
      weight: rule.weight,
      isActive: rule.isActive,
      conditions: rule.conditions,
      actions: rule.actions
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ruleType: 'VELOCITY_CHECK',
      priority: 50,
      weight: 10,
      isActive: true,
      conditions: {},
      actions: {}
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Priority', 'Weight', 'Active', 'Created At', 'Updated At'];
    const rows = rules.map(rule => [
      rule.id,
      rule.name,
      rule.ruleType,
      rule.priority,
      rule.weight,
      rule.isActive ? 'Yes' : 'No',
      rule.createdAt,
      rule.updatedAt
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud-rules-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'VELOCITY_CHECK':
        return 'bg-blue-100 text-blue-800';
      case 'AMOUNT_PATTERN':
        return 'bg-green-100 text-green-800';
      case 'IP_ANALYSIS':
        return 'bg-purple-100 text-purple-800';
      case 'DEVICE_ANALYSIS':
        return 'bg-orange-100 text-orange-800';
      case 'BEHAVIORAL_ANALYSIS':
        return 'bg-red-100 text-red-800';
      case 'GEOGRAPHIC_CHECK':
        return 'bg-indigo-100 text-indigo-800';
      case 'TIME_PATTERN':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fraud Detection Rules Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Rule
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Rules</h3>
          <div className="text-3xl font-bold">{statistics.total}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Active Rules</h3>
          <div className="text-3xl font-bold text-green-600">{statistics.active}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Inactive Rules</h3>
          <div className="text-3xl font-bold text-gray-600">{statistics.inactive}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm text-gray-600 mb-2">Most Common Type</h3>
          <div className="text-xl font-bold">
            {Object.entries(statistics.byType || {}).sort((a, b) => {
              const countA = (a[1] as number) || 0;
              const countB = (b[1] as number) || 0;
              return countB - countA;
            })?.[0]?.[0] || 'N/A'}
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Fraud Detection Rules</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Priority</th>
                <th className="text-left p-3">Weight</th>
                <th className="text-left p-3">Active</th>
                <th className="text-left p-3">Created At</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{rule.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${getRuleTypeColor(rule.ruleType)}`}>
                      {rule.ruleType}
                    </span>
                  </td>
                  <td className="p-3">{rule.priority}</td>
                  <td className="p-3">{rule.weight}</td>
                  <td className="p-3">
                    {rule.isActive ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3">{new Date(rule.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleRuleStatus(rule.id, !rule.isActive)}
                        className={`px-2 py-1 text-white rounded text-sm ${
                          rule.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {rule.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteFraudRule(rule.id)}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">
                {showEditModal ? 'Edit' : 'Create'} Fraud Rule
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingRule(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rule Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter rule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter rule description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rule Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.ruleType}
                  onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                >
                  <option value="VELOCITY_CHECK">Velocity Check</option>
                  <option value="AMOUNT_PATTERN">Amount Pattern</option>
                  <option value="IP_ANALYSIS">IP Analysis</option>
                  <option value="DEVICE_ANALYSIS">Device Analysis</option>
                  <option value="BEHAVIORAL_ANALYSIS">Behavioral Analysis</option>
                  <option value="GEOGRAPHIC_CHECK">Geographic Check</option>
                  <option value="TIME_PATTERN">Time Pattern</option>
                  <option value="ML_PREDICTION">ML Prediction</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full p-2 border rounded"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Weight (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full p-2 border rounded"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (showEditModal) {
                      updateFraudRule();
                    } else {
                      createFraudRule();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {showEditModal ? 'Update' : 'Create'} Rule
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
