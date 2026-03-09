'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { withAuth } from '@/components/auth/withAuth';
import { 
  ArrowLeft, 
  BarChart3, 
  Settings, 
  FileText,
  CreditCard,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Edit,
  ToggleLeft,
  ToggleRight,
  Key,
  Globe,
  Shield,
  Search,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft as ArrowLeftIcon
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import adminGatewayApi, {
  PaymentGateway,
  GatewayConfig,
  ConnectionTestResult,
} from '@/lib/api/admin/gateways';

// Types
interface GatewayStats {
  totalTransactions: number;
  successRate: number;
  lastTransaction?: string;
}

interface FormErrors {
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  webhookUrl?: string;
}

// Utility functions
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

const maskValue = (value?: string): string => {
  if (!value) return 'Not configured';
  if (value.includes('***')) return value;
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
};

// Validation functions
const validateApiKey = (value: string): string | null => {
  if (!value) return null;
  if (value.length < 8) return 'API key must be at least 8 characters';
  return null;
};

const validateApiSecret = (value: string): string | null => {
  if (!value) return null;
  if (value.length < 8) return 'API secret must be at least 8 characters';
  return null;
};

const validateMerchantId = (value: string): string | null => {
  if (!value) return null;
  if (value.length < 3) return 'Merchant ID must be at least 3 characters';
  return null;
};

const validateWebhookUrl = (value: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!url.protocol.startsWith('http')) return 'URL must start with http:// or https://';
    return null;
  } catch {
    return 'Invalid URL format';
  }
};

// Main component
function GatewaySettingsPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [addingGateway, setAddingGateway] = useState(false);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; details?: string }>>({});
  const [saving, setSaving] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'transactions' | 'successRate' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Form state for edit modal
  const [formValues, setFormValues] = useState<Partial<GatewayConfig>>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Form state for add gateway modal
  const [newGatewayName, setNewGatewayName] = useState('');
  const [newGatewayDisplayName, setNewGatewayDisplayName] = useState('');
  const [newGatewayConfig, setNewGatewayConfig] = useState<Partial<GatewayConfig>>({});
  const [newGatewayErrors, setNewGatewayErrors] = useState<FormErrors & { name?: string; displayName?: string }>({});
  
  // Delete confirmation state
  const [deletingGateway, setDeletingGateway] = useState<string | null>(null);
  
  // Success notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchGateways();
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    
    setSearchDebounceTimer(timer);
  }, [searchDebounceTimer]);

  const fetchGateways = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the real API
      const response = await adminGatewayApi.getGateways();
      setGateways(response);
    } catch (err: any) {
      console.error('Error fetching gateways:', err);
      setError(err.message || 'Failed to load gateways. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (gatewayId: string) => {
    const gateway = gateways.find(gw => gw.id === gatewayId);
    if (!gateway) return;
    
    const newEnabledState = !gateway.enabled;
    
    // Optimistic update
    setGateways(gateways.map(gw =>
      gw.id === gatewayId ? { ...gw, enabled: newEnabledState } : gw
    ));
    
    try {
      // Call the real API
      await adminGatewayApi.toggleGateway(gateway.name, newEnabledState);
      
      // Update already done optimistically, just show success
      showSuccess(`Gateway ${newEnabledState ? 'enabled' : 'disabled'} successfully!`);
    } catch (err: any) {
      console.error('Error toggling gateway:', err);
      // Revert on error
      setGateways(gateways.map(gw =>
        gw.id === gatewayId ? { ...gw, enabled: !newEnabledState } : gw
      ));
      setError(err.message || 'Failed to toggle gateway. Please try again.');
    }
  };

  const handleToggleTestMode = async (gatewayId: string) => {
    const gateway = gateways.find(gw => gw.id === gatewayId);
    if (!gateway) return;
    
    const newTestModeState = !gateway.testMode;
    
    // Optimistic update
    setGateways(gateways.map(gw =>
      gw.id === gatewayId ? { ...gw, testMode: newTestModeState } : gw
    ));
    
    try {
      // Call the real API
      await adminGatewayApi.toggleTestMode(gateway.name, newTestModeState);
      
      showSuccess(`Test mode ${newTestModeState ? 'enabled' : 'disabled'} successfully!`);
    } catch (err: any) {
      console.error('Error toggling test mode:', err);
      // Revert on error
      setGateways(gateways.map(gw =>
        gw.id === gatewayId ? { ...gw, testMode: !newTestModeState } : gw
      ));
      setError(err.message || 'Failed to toggle test mode. Please try again.');
    }
  };

  const handleEditGateway = (gatewayId: string) => {
    const gateway = gateways.find(gw => gw.id === gatewayId);
    if (!gateway) return;
    
    setEditingGateway(gatewayId);
    setFormValues({ ...gateway.config });
    setFormErrors({});
  };

  const handleCloseEdit = () => {
    setEditingGateway(null);
    setFormValues({});
    setFormErrors({});
  };

  const handleFormValueChange = (field: keyof GatewayConfig, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateForm = (config: Partial<GatewayConfig>): FormErrors => {
    const errors: FormErrors = {};
    
    if (config.apiKey) {
      const error = validateApiKey(config.apiKey);
      if (error) errors.apiKey = error;
    }
    
    if (config.apiSecret) {
      const error = validateApiSecret(config.apiSecret);
      if (error) errors.apiSecret = error;
    }
    
    if (config.merchantId) {
      const error = validateMerchantId(config.merchantId);
      if (error) errors.merchantId = error;
    }
    
    if (config.webhookUrl) {
      const error = validateWebhookUrl(config.webhookUrl);
      if (error) errors.webhookUrl = error;
    }
    
    return errors;
  };

  const handleSaveConfig = async (gatewayId: string) => {
    const errors = validateForm(formValues);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSaving(true);
    
    try {
      // Call the real API
      await adminGatewayApi.updateGatewayConfig(gateways.find(gw => gw.id === gatewayId)!.name, formValues);
      
      setGateways(gateways.map(gw =>
        gw.id === gatewayId ? { ...gw, config: { ...gw.config, ...formValues } } : gw
      ));
      
      setEditingGateway(null);
      setFormValues({});
      setFormErrors({});
      showSuccess('Gateway configuration saved successfully!');
    } catch (err: any) {
      console.error('Error saving gateway config:', err);
      setError(err.message || 'Failed to save gateway configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (gatewayId: string) => {
    setTestingGateway(gatewayId);
    
    try {
      // Call the real API
      const result = await adminGatewayApi.testGatewayConnection(gateways.find(gw => gw.id === gatewayId)!.name);
      
      setTestResults({
        ...testResults,
        [gatewayId]: result
      });
      
      if (result.success) {
        showSuccess('Connection test passed!');
      }
    } catch (err: any) {
      console.error('Error testing gateway:', err);
      setTestResults({
        ...testResults,
        [gatewayId]: {
          success: false,
          message: err.message || 'Connection failed. Please try again.',
          details: 'Error: ' + (err.message || 'Unknown error')
        }
      });
    } finally {
      setTestingGateway(null);
    }
  };

  const handleOpenAddGateway = () => {
    setAddingGateway(true);
    setNewGatewayName('');
    setNewGatewayDisplayName('');
    setNewGatewayConfig({});
    setNewGatewayErrors({});
  };

  const handleCloseAddGateway = () => {
    setAddingGateway(false);
    setNewGatewayName('');
    setNewGatewayDisplayName('');
    setNewGatewayConfig({});
    setNewGatewayErrors({});
  };

  const handleNewGatewayConfigChange = (field: keyof GatewayConfig, value: string) => {
    setNewGatewayConfig(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setNewGatewayErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateNewGatewayForm = (): boolean => {
    const errors: FormErrors & { name?: string; displayName?: string } = {};
    
    if (!newGatewayName.trim()) {
      errors.name = 'Gateway name is required';
    } else if (newGatewayName.length < 2) {
      errors.name = 'Gateway name must be at least 2 characters';
    }
    
    if (!newGatewayDisplayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (newGatewayDisplayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    const configErrors = validateForm(newGatewayConfig);
    Object.assign(errors, configErrors);
    
    setNewGatewayErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGateway = async () => {
    if (!validateNewGatewayForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // Call the real API
      const newGateway = await adminGatewayApi.addGateway({
        name: newGatewayName.toLowerCase().replace(/\s+/g, '_'),
        displayName: newGatewayDisplayName,
        enabled: true,
        testMode: true,
        config: newGatewayConfig,
      });
      
      setGateways([...gateways, newGateway]);
      handleCloseAddGateway();
      showSuccess('Gateway added successfully!');
    } catch (err: any) {
      console.error('Error adding gateway:', err);
      setError(err.message || 'Failed to add gateway. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGateway = async (gatewayId: string) => {
    setDeletingGateway(gatewayId);
    
    try {
      // Call the real API
      await adminGatewayApi.deleteGateway(gateways.find(gw => gw.id === gatewayId)!.name);
      
      setGateways(gateways.filter(gw => gw.id !== gatewayId));
      setDeletingGateway(null);
      showSuccess('Gateway deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting gateway:', err);
      setError(err.message || 'Failed to delete gateway. Please try again.');
      setDeletingGateway(null);
    }
  };

  const handleSort = (field: 'name' | 'transactions' | 'successRate' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = async () => {
    try {
      // Call the real API
      const blob = await adminGatewayApi.exportGateways();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-gateways-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Gateways exported successfully!');
    } catch (err: any) {
      console.error('Error exporting gateways:', err);
      setError(err.message || 'Failed to export gateways. Please try again.');
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Filter gateways based on search query
  const filteredGateways = gateways.filter(gateway => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      gateway.name.toLowerCase().includes(query) ||
      gateway.displayName.toLowerCase().includes(query)
    );
  });

  // Sort filtered gateways
  const sortedGateways = [...filteredGateways].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.displayName.localeCompare(b.displayName);
        break;
      case 'transactions':
        comparison = a.stats.totalTransactions - b.stats.totalTransactions;
        break;
      case 'successRate':
        comparison = a.stats.successRate - b.stats.successRate;
        break;
      case 'status':
        comparison = (a.enabled ? 1 : 0) - (b.enabled ? 1 : 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedGateways.length / itemsPerPage);
  const paginatedGateways = sortedGateways.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout title="Payment Gateway Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Gateway Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure and manage your payment gateway settings
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Payments
            </Link>
            <Link
              href="/admin/payments/analytics"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
            <Link
              href="/admin/payments/logs"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Logs
            </Link>
          </div>
        </div>

      {/* Page Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Configure and manage your payment gateway settings. Enable or disable gateways,
          manage API credentials, configure webhooks, and test connections.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search gateways..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleOpenAddGateway}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Gateway
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading gateways...</p>
        </div>
      ) : paginatedGateways.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No gateways found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
              <div 
                className="col-span-3 cursor-pointer hover:text-blue-600 flex items-center gap-1"
                onClick={() => handleSort('name')}
              >
                Gateway Name
                {sortField === 'name' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:text-blue-600 flex items-center gap-1"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:text-blue-600 flex items-center gap-1"
                onClick={() => handleSort('transactions')}
              >
                Transactions
                {sortField === 'transactions' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:text-blue-600 flex items-center gap-1"
                onClick={() => handleSort('successRate')}
              >
                Success Rate
                {sortField === 'successRate' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            
            {/* Table Body */}
            {paginatedGateways.map((gateway) => (
              <div key={gateway.id} className="border-b border-gray-200 last:border-b-0">
                {/* Gateway Row */}
                <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50">
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${gateway.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CreditCard className={`w-4 h-4 ${gateway.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{gateway.displayName}</p>
                        <p className="text-xs text-gray-500 lowercase">{gateway.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {gateway.testMode && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Test
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        gateway.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gateway.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{gateway.stats.totalTransactions.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className={`text-sm font-medium ${
                      gateway.stats.successRate >= 95 ? 'text-green-600' :
                      gateway.stats.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {gateway.stats.successRate.toFixed(2)}%
                    </p>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleEnabled(gateway.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={gateway.enabled ? 'Disable Gateway' : 'Enable Gateway'}
                    >
                      {gateway.enabled ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleTestConnection(gateway.id)}
                      disabled={testingGateway === gateway.id || !gateway.enabled}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Test Connection"
                    >
                      {testingGateway === gateway.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <TestTube className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditGateway(gateway.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Configuration"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setDeletingGateway(gateway.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Gateway"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                
                {/* Test Result */}
                {testResults[gateway.id] && (
                  <div className={`mx-4 mb-4 p-3 rounded-lg ${
                    testResults[gateway.id].success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {testResults[gateway.id].success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm ${
                          testResults[gateway.id].success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResults[gateway.id].message}
                        </p>
                        {testResults[gateway.id].details && (
                          <pre className="text-xs mt-1 text-gray-600 whitespace-pre-wrap">
                            {testResults[gateway.id].details}
                          </pre>
                        )}
                      </div>
                      <button
                        onClick={() => setTestResults(prev => {
                          const newResults = { ...prev };
                          delete newResults[gateway.id];
                          return newResults;
                        })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Configuration Details */}
                <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4" />
                    Configuration
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(gateway.config).length > 0 ? (
                      Object.entries(gateway.config).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200">
                            {maskValue(value)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 md:col-span-3 text-sm text-gray-500 italic">
                        No configuration required for this gateway
                      </div>
                    )}
                  </div>
                  
                  {/* Test Mode Toggle */}
                  {gateway.name !== 'cod' && (
                    <div className="mt-4 flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">Test Mode</p>
                          <p className="text-xs text-yellow-700">
                            When enabled, payments are processed in sandbox environment
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleTestMode(gateway.id)}
                        className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                      >
                        {gateway.testMode ? (
                          <ToggleRight className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Webhook Configuration */}
                  {gateway.config.webhookUrl && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Webhook URL</p>
                          <p className="text-xs text-blue-700 font-mono mt-1 break-all">
                            {gateway.config.webhookUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedGateways.length)} of {sortedGateways.length} gateways
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingGateway && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Edit {gateways.find(gw => gw.id === editingGateway)?.displayName} Configuration
              </h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Update the configuration for {gateways.find(gw => gw.id === editingGateway)?.displayName}. All fields are optional.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={formValues.apiKey || ''}
                    onChange={(e) => handleFormValueChange('apiKey', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.apiKey ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter API key"
                  />
                  {formErrors.apiKey && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.apiKey}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formValues.apiSecret || ''}
                    onChange={(e) => handleFormValueChange('apiSecret', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.apiSecret ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter API secret"
                  />
                  {formErrors.apiSecret && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.apiSecret}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    value={formValues.merchantId || ''}
                    onChange={(e) => handleFormValueChange('merchantId', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.merchantId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter merchant ID"
                  />
                  {formErrors.merchantId && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.merchantId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store ID
                  </label>
                  <input
                    type="text"
                    value={formValues.storeId || ''}
                    onChange={(e) => handleFormValueChange('storeId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter store ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Password
                  </label>
                  <input
                    type="password"
                    value={formValues.storePassword || ''}
                    onChange={(e) => handleFormValueChange('storePassword', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter store password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formValues.username || ''}
                    onChange={(e) => handleFormValueChange('username', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formValues.password || ''}
                    onChange={(e) => handleFormValueChange('password', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formValues.webhookUrl || ''}
                    onChange={(e) => handleFormValueChange('webhookUrl', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.webhookUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/api/payments/webhook"
                  />
                  {formErrors.webhookUrl && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.webhookUrl}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveConfig(editingGateway)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Gateway Modal */}
      {addingGateway && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Add New Payment Gateway
              </h2>
              <button
                onClick={handleCloseAddGateway}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Add a new payment gateway to your system. Fill in the required fields below.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gateway Name *
                  </label>
                  <input
                    type="text"
                    value={newGatewayName}
                    onChange={(e) => setNewGatewayName(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newGatewayErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., stripe, paypal"
                  />
                  {newGatewayErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{newGatewayErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={newGatewayDisplayName}
                    onChange={(e) => setNewGatewayDisplayName(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newGatewayErrors.displayName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Stripe, PayPal"
                  />
                  {newGatewayErrors.displayName && (
                    <p className="text-xs text-red-600 mt-1">{newGatewayErrors.displayName}</p>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Configuration (Optional)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={newGatewayConfig.apiKey || ''}
                    onChange={(e) => handleNewGatewayConfigChange('apiKey', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newGatewayErrors.apiKey ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter API key"
                  />
                  {newGatewayErrors.apiKey && (
                    <p className="text-xs text-red-600 mt-1">{newGatewayErrors.apiKey}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={newGatewayConfig.apiSecret || ''}
                    onChange={(e) => handleNewGatewayConfigChange('apiSecret', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newGatewayErrors.apiSecret ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter API secret"
                  />
                  {newGatewayErrors.apiSecret && (
                    <p className="text-xs text-red-600 mt-1">{newGatewayErrors.apiSecret}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    value={newGatewayConfig.merchantId || ''}
                    onChange={(e) => handleNewGatewayConfigChange('merchantId', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newGatewayErrors.merchantId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter merchant ID"
                  />
                  {newGatewayErrors.merchantId && (
                    <p className="text-xs text-red-600 mt-1">{newGatewayErrors.merchantId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={newGatewayConfig.webhookUrl || ''}
                    onChange={(e) => handleNewGatewayConfigChange('webhookUrl', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newGatewayErrors.webhookUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/api/payments/webhook"
                  />
                  {newGatewayErrors.webhookUrl && (
                    <p className="text-xs text-red-600 mt-1">{newGatewayErrors.webhookUrl}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseAddGateway}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGateway}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Gateway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGateway && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Delete Gateway
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>{gateways.find(gw => gw.id === deletingGateway)?.displayName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingGateway(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteGateway(deletingGateway)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

// Wrap with authentication HOC
export default withAuth(GatewaySettingsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
