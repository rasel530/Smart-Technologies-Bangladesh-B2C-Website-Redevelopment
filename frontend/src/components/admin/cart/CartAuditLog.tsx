'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Minus,
  Edit,
  Trash2,
  ShoppingCart,
  Tag,
  Calendar,
  User,
  Globe,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  CreditCard
} from 'lucide-react';

interface CartAuditLogEntry {
  id: string;
  cartId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  previousValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  performedBy: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface CartAuditSummary {
  actionCounts: Record<string, number>;
  timeline: Array<{ date: string; count: number }>;
  lastModifiedAt: string;
  totalActions: number;
}

interface CartAuditLogProps {
  cartId: string;
  language?: 'en' | 'bn';
  onRollback?: () => void;
}

const CartAuditLog: React.FC<CartAuditLogProps> = ({ cartId, language = 'en', onRollback }) => {
  const [logs, setLogs] = useState<CartAuditLogEntry[]>([]);
  const [summary, setSummary] = useState<CartAuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('adminUser') || '{}') : {};
    setCurrentUserId(user.id || null);
    fetchLogs();
    fetchSummary();
  }, [cartId, actionFilter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (actionFilter !== 'all') {
        queryParams.append('action', actionFilter);
      }

      const response = await fetch(`/api/v1/admin/carts/${cartId}/audit?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/audit/summary`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit summary:', error);
    }
  };

  const handleRollback = async (logId: string) => {
    if (!confirm('Are you sure you want to rollback this action? This will attempt to restore the previous state.')) {
      return;
    }

    setRollbackLoading(logId);
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/audit/rollback/${logId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: currentUserId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to rollback action');
      }

      alert('Rollback successful!');
      fetchLogs();
      fetchSummary();
      
      if (onRollback) {
        onRollback();
      }
    } catch (error: any) {
      console.error('Error rolling back:', error);
      alert(error.message);
    } finally {
      setRollbackLoading(null);
    }
  };

  const translations = {
    en: {
      title: 'Audit History',
      summary: 'Summary',
      filters: 'Filters',
      action: 'Action',
      entity: 'Entity',
      before: 'Before',
      after: 'After',
      performedBy: 'Performed by',
      at: 'at',
      ipAddress: 'IP Address',
      noLogs: 'No audit logs found',
      noLogsDesc: 'Cart changes will be tracked here',
      loading: 'Loading audit logs...',
      error: 'Error loading audit logs',
      rollback: 'Rollback',
      rollingBack: 'Rolling back...',
      page: 'Page',
      of: 'of',
      expand: 'Expand',
      collapse: 'Collapse',
      totalActions: 'Total Actions',
      lastModified: 'Last Modified',
      filterByAction: 'Filter by action',
      allActions: 'All Actions',
      changes: 'changes'
    },
    bn: {
      title: 'অডিট ইতিহাস',
      summary: 'সারসংক্ষেপ',
      filters: 'ফিল্টার',
      action: 'কার্যক্রম',
      entity: 'সত্তা',
      before: 'আগে',
      after: 'পরে',
      performedBy: 'কার্যকর করেছেন',
      at: 'তারিখ',
      ipAddress: 'IP ঠিকানা',
      noLogs: 'কোনো অডিট লগ পাওয়া যায়নি',
      noLogsDesc: 'কার্ট পরিবর্তনগুলি এখানে ট্র্যাক করা হবে',
      loading: 'অডিট লগ লোড হচ্ছে...',
      error: 'অডিট লগ লোড করতে ত্রুটি',
      rollback: 'রোলব্যাক',
      rollingBack: 'রোলব্যাক হচ্ছে...',
      page: 'পৃষ্ঠা',
      of: 'এর',
      expand: 'বিস্তারিত দেখুন',
      collapse: 'কমান',
      totalActions: 'মোট কার্যক্রম',
      lastModified: 'সর্বশেষ পরিবর্তন',
      filterByAction: 'কার্যক্রম অনুযায়ী ফিল্টার করুন',
      allActions: 'সব কার্যক্রম',
      changes: 'পরিবর্তন'
    }
  };

  const t = translations[language];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('add') || actionLower.includes('create')) {
      return <Plus className="w-4 h-4 text-green-600" />;
    }
    if (actionLower.includes('remove') || actionLower.includes('delete')) {
      return <Minus className="w-4 h-4 text-red-600" />;
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <Edit className="w-4 h-4 text-blue-600" />;
    }
    if (actionLower.includes('quantity')) {
      return <Package className="w-4 h-4 text-purple-600" />;
    }
    if (actionLower.includes('discount') || actionLower.includes('coupon')) {
      return <Tag className="w-4 h-4 text-orange-600" />;
    }
    if (actionLower.includes('payment')) {
      return <CreditCard className="w-4 h-4 text-green-600" />;
    }
    if (actionLower.includes('cart')) {
      return <ShoppingCart className="w-4 h-4 text-gray-600" />;
    }
    return <History className="w-4 h-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('add') || actionLower.includes('create')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (actionLower.includes('remove') || actionLower.includes('delete')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (actionLower.includes('rollback')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEntityIcon = (entityType: string) => {
    const typeLower = entityType.toLowerCase();
    if (typeLower.includes('cart')) {
      return <ShoppingCart className="w-3 h-3" />;
    }
    if (typeLower.includes('item')) {
      return <Package className="w-3 h-3" />;
    }
    if (typeLower.includes('discount')) {
      return <Tag className="w-3 h-3" />;
    }
    if (typeLower.includes('payment')) {
      return <CreditCard className="w-3 h-3" />;
    }
    return <Edit className="w-3 h-3" />;
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  const canRollback = (action: string) => {
    const rollbackable = ['ITEM_ADDED', 'ITEM_REMOVED', 'QUANTITY_UPDATED', 'DISCOUNT_APPLIED', 'DISCOUNT_REMOVED'];
    return rollbackable.some(a => action.toUpperCase().includes(a));
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <History className="w-8 h-8 mx-auto mb-2 animate-spin" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>{t.error}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          {summary && (
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
              {summary.totalActions}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          {t.filters}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">{t.totalActions}</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{summary.totalActions}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Added</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{summary.actionCounts['ITEM_ADDED'] || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Removed</span>
            </div>
            <p className="text-2xl font-bold text-red-800">{summary.actionCounts['ITEM_REMOVED'] || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{t.lastModified}</span>
            </div>
            <p className="text-sm font-bold text-purple-800">
              {summary.lastModifiedAt ? formatDate(summary.lastModifiedAt) : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.filterByAction}
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t.allActions}</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t.noLogs}</p>
          <p className="text-sm">{t.noLogsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Log Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      {index < logs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" style={{ minHeight: '40px' }} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Action Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {getEntityIcon(log.entityType)}
                          {log.entityType}
                        </span>
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.performedBy === currentUserId ? 'You' : log.performedBy.slice(0, 8) + '...'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {canRollback(log.action) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(log.id);
                        }}
                        disabled={rollbackLoading === log.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {rollbackLoading === log.id ? t.rollingBack : t.rollback}
                      </button>
                    )}
                    {expandedLog === log.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLog === log.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous Value */}
                    {log.previousValue && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                          <ChevronDown className="w-4 h-4" />
                          {t.before}
                        </h4>
                        <pre className="text-xs text-red-800 overflow-x-auto">
                          {JSON.stringify(log.previousValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {/* New Value */}
                    {log.newValue && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                          <ChevronUp className="w-4 h-4" />
                          {t.after}
                        </h4>
                        <pre className="text-xs text-green-800 overflow-x-auto">
                          {JSON.stringify(log.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Metadata */}
                  {log.metadata && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Info</h4>
                      <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-2 rounded border border-gray-200">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Entity ID */}
                  {log.entityId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">
                        Entity ID: <code className="text-xs bg-gray-200 px-1 rounded">{log.entityId}</code>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            {t.page} {page} {t.of} {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartAuditLog;
