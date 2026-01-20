'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseOrderAPI } from '@/lib/api/corporate';
import { PurchaseOrder, POStatus } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function CorporatePurchaseOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { accountId, isLoading: accountLoading, error: accountError } = useCorporateAccount();
  const action = searchParams.get('action');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(action === 'create');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [createPOData, setCreatePOData] = useState({
    poNumber: '',
    items: [{ productName: '', productCode: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    notes: '',
  });

  const fetchOrders = async () => {
    if (!accountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await PurchaseOrderAPI.getOrders(accountId);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to load purchase orders' : 'পিও লোড করতে ব্যর্থ'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [accountId]);

  const getStatusColor = (status: POStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CANCELLED':
        return 'bg-gray-200 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'DRAFT':
        return language === 'en' ? 'Draft' : 'খসড়া';
      case 'PENDING_APPROVAL':
        return language === 'en' ? 'Pending Approval' : 'অনুমতিক্তিঙ অনুমতিক্রয়';
      case 'APPROVED':
        return language === 'en' ? 'Approved' : 'অনুমতিক';
      case 'REJECTED':
        return language === 'en' ? 'Rejected' : 'প্রত্য়';
      case 'PROCESSING':
        return language === 'en' ? 'Processing' : 'প্রসেসিং';
      case 'COMPLETED':
        return language === 'en' ? 'Completed' : 'সম্পন্ন';
      case 'CANCELLED':
        return language === 'en' ? 'Cancelled' : 'বাতিল';
      default:
        return language === 'en' ? 'Unknown' : 'অজানা';
    }
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      const order = await PurchaseOrderAPI.getOrder(accountId!, orderId);
      setSelectedOrder(order);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to load order details' : 'পিও বিস্তারিত লোড করতে ব্যর্থ'));
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await PurchaseOrderAPI.approveOrder(accountId!, orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: POStatus.APPROVED } : o));
      setShowDetailModal(false);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to approve order' : 'পিও অনুমতিক করতে ব্যর্থ'));
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await PurchaseOrderAPI.rejectOrder(accountId!, orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: POStatus.REJECTED } : o));
      setShowDetailModal(false);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to reject order' : 'পিও প্রত্য় করতে ব্যর্থ'));
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await PurchaseOrderAPI.cancelOrder(accountId!, orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: POStatus.CANCELLED } : o));
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to cancel order' : 'পিও বাতিল করতে ব্যর্থ'));
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user || accountLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (accountError !== null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Error' : 'ভুল'}
          </h2>
          <p className="text-gray-600">{accountError}</p>
          <button
            onClick={() => {
              setError(null);
              fetchOrders();
            }}
            className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {language === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading === true) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Error' : 'ভুল'}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchOrders();
            }}
            className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {language === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Purchase Orders' : 'পিও ম্যানেজমেন্ট'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'bn'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search PO number...' : 'পিও নম্বর খুঁজুন...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as POStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">{language === 'en' ? 'All Status' : 'সবর স্থিতি'}</option>
                <option value="DRAFT">{language === 'en' ? 'Draft' : 'খসড়া'}</option>
                <option value="PENDING_APPROVAL">{language === 'en' ? 'Pending Approval' : 'অনুমতিক্তিঙ অনুমতিক্রয়'}</option>
                <option value="APPROVED">{language === 'en' ? 'Approved' : 'অনুমতিক'}</option>
                <option value="REJECTED">{language === 'en' ? 'Rejected' : 'প্রত্য়'}</option>
                <option value="PROCESSING">{language === 'en' ? 'Processing' : 'প্রসেসিং'}</option>
                <option value="COMPLETED">{language === 'en' ? 'Completed' : 'সম্পন্ন'}</option>
                <option value="CANCELLED">{language === 'en' ? 'Cancelled' : 'বাতিল'}</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{language === 'en' ? 'New PO' : 'নতুন পিও'}</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Error' : 'ভুল'}
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchOrders();
                }}
                className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {language === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'No Purchase Orders' : 'কোন পিও নেই'}
              </h2>
              <p className="text-gray-600 mb-4">
                {language === 'en' ? 'Create your first purchase order to get started' : 'শুরু করতে আপনার প্রথম পিও তৈরি করুন'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>{language === 'en' ? 'Create PO' : 'নতুন পিও'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'PO Number' : 'পিও নম্বর'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Date' : 'তারিখ'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Items' : 'আইটেম'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Amount' : 'পরিমাণ'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Status' : 'স্থিতি'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Actions' : 'ক্রিয়া'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.poNumber}</div>
                        <div className="text-xs text-gray-500">
                          {language === 'en' ? 'Created by' : 'তৈরি করেছেন'}: {order.createdBy}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.items.length} {language === 'en' ? 'items' : 'আইটেম'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ৳{order.totalAmount !== null && order.totalAmount !== undefined ? order.totalAmount.toLocaleString('en-BD') : '0'}
                        </div>
                        <div className="text-xs text-gray-500">{language === 'en' ? 'BDT' : 'টাকা'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusBadge(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{language === 'en' ? 'View' : 'দেখুন'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'en' ? 'Purchase Order Details' : 'পিও বিস্তারিত'}
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'PO Number' : 'পিও নম্বর'}</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedOrder.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Status' : 'স্থিতি'}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusBadge(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Created Date' : 'তারিখ'}</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Created By' : 'তৈরি করেছেন'}</p>
                    <p className="text-sm text-gray-900">{selectedOrder.createdBy}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'en' ? 'Order Items' : 'অর্ডার আইটেম'}
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-sm text-gray-600">{item.productCode}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{language === 'en' ? 'Quantity' : 'পরিমাণ'}</p>
                              <p className="font-semibold text-gray-900">{item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{language === 'en' ? 'Price' : 'দাম'}</p>
                              <p className="font-semibold text-gray-900">৳{item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice.toLocaleString('en-BD') : '0'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{language === 'en' ? 'Total' : 'মোট'}</p>
                              <p className="font-semibold text-gray-900">৳{item.totalPrice !== null && item.totalPrice !== undefined ? item.totalPrice.toLocaleString('en-BD') : '0'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{language === 'en' ? 'Subtotal' : 'সাবটোটাল'}</span>
                    <span className="font-semibold text-gray-900">৳{selectedOrder.subtotal !== null && selectedOrder.subtotal !== undefined ? selectedOrder.subtotal.toLocaleString('en-BD') : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{language === 'en' ? 'VAT' : 'ভ্যাট'}</span>
                    <span className="font-semibold text-gray-900">৳{selectedOrder.vatAmount !== null && selectedOrder.vatAmount !== undefined ? selectedOrder.vatAmount.toLocaleString('en-BD') : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">{language === 'en' ? 'Total' : 'মোট'}</span>
                    <span className="text-primary-600">৳{selectedOrder.totalAmount !== null && selectedOrder.totalAmount !== undefined ? selectedOrder.totalAmount.toLocaleString('en-BD') : '0'}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {language === 'en' ? 'Notes' : 'নোট'}
                    </h3>
                    <p className="text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    {selectedOrder.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => handleApproveOrder(selectedOrder.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{language === 'en' ? 'Approve' : 'অনুমতিক'}</span>
                        </button>
                        <button
                          onClick={() => handleRejectOrder(selectedOrder.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{language === 'en' ? 'Reject' : 'প্রত্য়'}</span>
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'DRAFT' && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{language === 'en' ? 'Delete' : 'মুছে ফেলুন'}</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {language === 'en' ? 'Close' : 'বন্ধ করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'en' ? 'Delete Purchase Order?' : 'পিও মুছে ফেলবেন?'}
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  {language === 'en'
                    ? 'Are you sure you want to delete this purchase order? This action cannot be undone.'
                    : 'আপনি নিশ্চিত যে আপনার প্রথম পিও তৈরি করুন আপনি এই পিও মুছে ফেরানো যাবে না।'}
                </p>
                <div className="flex space-x-3">
                    <button
                      onClick={() => selectedOrder && handleCancelOrder(selectedOrder.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      {language === 'en' ? 'Delete' : 'মুছে ফেলুন'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      {language === 'en' ? 'Cancel' : 'বাতিল করুন'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Create PO Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'en' ? 'Create Purchase Order' : 'পিও তৈরি করুন'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'PO Number' : 'পিও নম্বর'}
                  </label>
                  <input
                    type="text"
                    value={createPOData.poNumber}
                    onChange={(e) => setCreatePOData({ ...createPOData, poNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={language === 'en' ? 'Enter PO number' : 'পিও নম্বর লিখুন'}
                  />
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'en' ? 'Order Items' : 'অর্ডার আইটেম'}
                  </h3>
                  {createPOData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'en' ? 'Product Name' : 'পণডাক্ট নাম'}
                          </label>
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => {
                              const newItems = [...createPOData.items];
                              newItems[index].productName = e.target.value;
                              setCreatePOData({ ...createPOData, items: newItems });
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={language === 'en' ? 'Enter product name' : 'পণডাক্ট নাম লিখুন'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'en' ? 'Product Code' : 'পণডাক্ট কোড'}
                          </label>
                          <input
                            type="text"
                            value={item.productCode}
                            onChange={(e) => {
                              const newItems = [...createPOData.items];
                              newItems[index].productCode = e.target.value;
                              setCreatePOData({ ...createPOData, items: newItems });
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={language === 'en' ? 'Enter product code' : 'পণডাক্ট কোড লিখুন'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'en' ? 'Quantity' : 'পরিমাণ'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...createPOData.items];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                              setCreatePOData({ ...createPOData, items: newItems });
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'en' ? 'Unit Price' : 'একক দাম'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...createPOData.items];
                              newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                              newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                              setCreatePOData({ ...createPOData, items: newItems });
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{language === 'en' ? 'Total' : 'মোট'}</p>
                        <p className="text-lg font-semibold text-gray-900">৳{item.totalPrice !== null && item.totalPrice !== undefined ? item.totalPrice.toLocaleString('en-BD') : '0'}</p>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCreatePOData({
                        ...createPOData,
                        items: [...createPOData.items, { productName: '', productCode: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {language === 'en' ? '+ Add Item' : '+ আইটেম যোগ করুন'}
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Notes' : 'নোট'}
                  </label>
                  <textarea
                    value={createPOData.notes}
                    onChange={(e) => setCreatePOData({ ...createPOData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={language === 'en' ? 'Enter any notes...' : 'যেকোনো নোট লিখুন...'}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {language === 'en' ? 'Cancel' : 'বাতিল করুন'}
                  </button>
                  <button
                    onClick={() => {
                      // Handle submit - would call API to create PO
                      setShowCreateModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    {language === 'en' ? 'Create PO' : 'পিও তৈরি করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CorporatePurchaseOrdersPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <CorporatePurchaseOrdersContent />
    </Suspense>
  );
};

export default CorporatePurchaseOrdersPage;
