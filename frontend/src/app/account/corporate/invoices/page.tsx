'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceAPI } from '@/lib/api/corporate';
import { Invoice, InvoiceStatus } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CorporateInvoicesPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { accountId, isLoading: accountLoading, error: accountError } = useCorporateAccount();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    if (!accountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await InvoiceAPI.getInvoices(accountId);
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to load invoices' : 'চালান লোড করতে ব্যর্থ'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [accountId]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PENDING':
        return language === 'en' ? 'Pending' : 'অপেক্তিঙ';
      case 'PAID':
        return language === 'en' ? 'Paid' : 'পরিশোধিত';
      case 'OVERDUE':
        return language === 'en' ? 'Overdue' : 'দেরী';
      case 'CANCELLED':
        return language === 'en' ? 'Cancelled' : 'বাতিল';
      default:
        return language === 'en' ? 'Unknown' : 'অজানা';
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const invoice = await InvoiceAPI.getInvoice(accountId!, invoiceId);
      setSelectedInvoice(invoice);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to load invoice details' : 'চালান বিস্তারিত লোড করতে ব্যর্থ'));
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!accountId) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      const blob = await InvoiceAPI.downloadInvoice(accountId, invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      if (document.body && link.parentNode === document.body) { document.body.removeChild(link); }
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(language === 'en' ? 'Invoice downloaded successfully' : 'চালান সফলভাবে ডাউনলোড হয়েছে');
      
      // Clear success message after 3 seconds
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err: any) {
      setDownloadError(err.message || (language === 'en' ? 'Failed to download invoice' : 'চালান ডাউনলোড করতে ব্যর্থ'));
      
      // Clear error message after 5 seconds
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    const matchesDateFrom = !dateFrom || (invoice.invoiceDate && new Date(invoice.invoiceDate) >= new Date(dateFrom));
    const matchesDateTo = !dateTo || (invoice.invoiceDate && new Date(invoice.invoiceDate) <= new Date(dateTo));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.amount !== null && invoice.amount !== undefined ? invoice.amount : 0), 0);
  const paidAmount = filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, invoice) => sum + (invoice.amount !== null && invoice.amount !== undefined ? invoice.amount : 0), 0);
  const unpaidAmount = filteredInvoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((sum, invoice) => sum + (invoice.amount !== null && invoice.amount !== undefined ? invoice.amount : 0), 0);

  if (!user || accountLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (accountError) {
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
              fetchInvoices();
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
              <FileText className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Invoice Management' : 'চালান ম্যানেজমেন্ট'}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {language === 'en' ? 'Total Invoices' : 'মোট চালান'}
              </h3>
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{filteredInvoices.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {language === 'en' ? 'Total Amount' : 'মোট পরিমাণ'}
              </h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">৳{totalAmount !== null && totalAmount !== undefined ? totalAmount.toLocaleString('en-BD') : '0'}</p>
            <p className="text-xs text-gray-500">{language === 'en' ? 'BDT' : 'টাকা'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {language === 'en' ? 'Unpaid Amount' : 'অপরিশোধিত'}
              </h3>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">৳{unpaidAmount !== null && unpaidAmount !== undefined ? unpaidAmount.toLocaleString('en-BD') : '0'}</p>
            <p className="text-xs text-gray-500">{language === 'en' ? 'BDT' : 'টাকা'}</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Success/Error Messages */}
          {downloadSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800">{downloadSuccess}</span>
              </div>
            </div>
          )}
          {downloadError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{downloadError}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search invoice number...' : 'চালান নম্বর খুঁজুন...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">{language === 'en' ? 'All Status' : 'সব স্থিতি'}</option>
                <option value="PENDING">{language === 'en' ? 'Pending' : 'অপেক্তিঙ'}</option>
                <option value="PAID">{language === 'en' ? 'Paid' : 'পরিশোধিত'}</option>
                <option value="OVERDUE">{language === 'en' ? 'Overdue' : 'দেরী'}</option>
                <option value="CANCELLED">{language === 'en' ? 'Cancelled' : 'বাতিল'}</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
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
                  fetchInvoices();
                }}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {language === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'No Invoices' : 'কোন চালান নেই'}
              </h2>
              <p className="text-gray-600">
                {language === 'en' ? 'No invoices found matching your criteria' : 'আপনার মানদণ্ড অনুযায়ী কোন চালান পাওয়া যায়নি'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Invoice Number' : 'চালান নম্বর'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Date' : 'তারিখ'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'PO Number' : 'পিও নম্বর'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Amount' : 'পরিমাণ'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'en' ? 'Due Date' : 'দেওয়ার তারিখ'}
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
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ৳{invoice.amount !== null && invoice.amount !== undefined ? invoice.amount.toLocaleString('en-BD') : '0'}
                        </div>
                        <div className="text-xs text-gray-500">{language === 'en' ? 'BDT' : 'টাকা'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusBadge(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>{language === 'en' ? 'View' : 'দেখুন'}</span>
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                            disabled={isDownloading}
                            className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDownloading ? (
                              <>
                                <LoadingSpinner />
                                <span>{language === 'en' ? 'Downloading...' : 'ডাউনলোড হচ্ছে...'}</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>{language === 'en' ? 'Download' : 'ডাউনলোড'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Detail Modal */}
        {showDetailModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'en' ? 'Invoice Details' : 'চালান বিস্তারিত'}
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
                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Invoice Number' : 'চালান নম্বর'}</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Status' : 'স্থিতি'}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusBadge(selectedInvoice.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Invoice Date' : 'চালান তারিখ'}</p>
                    <p className="text-sm text-gray-900">
                      {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Due Date' : 'দেওয়ার তারিখ'}</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'PO Number' : 'পিও নম্বর'}</p>
                    <p className="text-sm text-gray-900">{selectedInvoice.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Amount' : 'পরিমাণ'}</p>
                    <p className="text-lg font-semibold text-gray-900">৳{selectedInvoice.amount !== null && selectedInvoice.amount !== undefined ? selectedInvoice.amount.toLocaleString('en-BD') : '0'}</p>
                    <p className="text-xs text-gray-500">{language === 'en' ? 'BDT' : 'টাকা'}</p>
                  </div>
                </div>

                {/* VAT Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{language === 'en' ? 'Subtotal' : 'সাবটোটাল'}</span>
                    <span className="font-semibold text-gray-900">৳{selectedInvoice.subtotal !== null && selectedInvoice.subtotal !== undefined ? selectedInvoice.subtotal.toLocaleString('en-BD') : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{language === 'en' ? 'VAT' : 'ভ্যাট'}</span>
                    <span className="font-semibold text-gray-900">৳{selectedInvoice.vatAmount !== null && selectedInvoice.vatAmount !== undefined ? selectedInvoice.vatAmount.toLocaleString('en-BD') : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-2">
                    <span className="text-gray-900">{language === 'en' ? 'Total' : 'মোট'}</span>
                    <span className="text-primary-600">৳{selectedInvoice.amount !== null && selectedInvoice.amount !== undefined ? selectedInvoice.amount.toLocaleString('en-BD') : '0'}</span>
                  </div>
                </div>

                {/* Payment Status */}
                {selectedInvoice.paidAt && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">{language === 'en' ? 'Paid On' : 'পরিশোধিত'}</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedInvoice.paidAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDownloadInvoice(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                    disabled={isDownloading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <LoadingSpinner />
                        <span>{language === 'en' ? 'Downloading...' : 'ডাউনলোড হচ্ছে...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{language === 'en' ? 'Download PDF' : 'পিডিএফ ডাউনলোড'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {language === 'en' ? 'Close' : 'বন্ধ করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateInvoicesPage;
