/**
 * Invoice Download Component
 * 
 * Component for downloading/viewing invoices with invoice list,
 * download, preview, and email functionality.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useOrderInvoices } from '@/hooks/useOrderConfirmation';
import { Invoice } from '@/lib/api/orderConfirmation';

interface InvoiceDownloadProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function InvoiceDownload({ orderId, isOpen, onClose, isAdmin = false }: InvoiceDownloadProps) {
  const { invoices, loading, error, getInvoices, downloadInvoice, previewInvoice, emailInvoice, generateInvoice, resendInvoice } = useOrderInvoices(orderId);

  const [emailInput, setEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getInvoices();
    }
  }, [isOpen, getInvoices]);

  const handleDownload = async (invoice: Invoice) => {
    setActionLoading(`download-${invoice.id}`);
    setSuccess(null);
    try {
      await downloadInvoice(invoice.id);
      setSuccess('Invoice downloaded successfully!');
    } catch (err: any) {
      console.error('Failed to download invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = async (invoice: Invoice) => {
    setActionLoading(`preview-${invoice.id}`);
    setSuccess(null);
    try {
      await previewInvoice(invoice.id);
    } catch (err: any) {
      console.error('Failed to preview invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmail = async (invoice: Invoice, email?: string) => {
    setActionLoading(`email-${invoice.id}`);
    setSuccess(null);
    try {
      await emailInvoice(invoice.id, email);
      setSuccess('Invoice sent successfully!');
      setShowEmailInput(null);
      setEmailInput('');
    } catch (err: any) {
      console.error('Failed to email invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateInvoice = async () => {
    setActionLoading('generate');
    setSuccess(null);
    try {
      await generateInvoice();
      setSuccess('New invoice generated successfully!');
      await getInvoices();
    } catch (err: any) {
      console.error('Failed to generate invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvoice = async (invoice: Invoice) => {
    setActionLoading(`resend-${invoice.id}`);
    setSuccess(null);
    try {
      await resendInvoice(invoice.id);
      setSuccess('Invoice resent successfully!');
    } catch (err: any) {
      console.error('Failed to resend invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Invoices
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            {/* Generate New Invoice Button (Admin Only) */}
            {isAdmin && (
              <div className="mb-6">
                <button
                  onClick={handleGenerateInvoice}
                  disabled={actionLoading === 'generate' || loading}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'generate' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Generate New Invoice
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Invoice List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Invoice Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Date</p>
                            <p className="text-gray-900 dark:text-gray-100">{formatDate(invoice.invoiceDate)}</p>
                          </div>
                          {invoice.dueDate && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                              <p className="text-gray-900 dark:text-gray-100">{formatDate(invoice.dueDate)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Total</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Status</p>
                            {invoice.sentAt && (
                              <p className="text-gray-900 dark:text-gray-100">Sent: {formatDate(invoice.sentAt)}</p>
                            )}
                            {invoice.paidAt && (
                              <p className="text-green-600 dark:text-green-400">Paid: {formatDate(invoice.paidAt)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDownload(invoice)}
                          disabled={actionLoading === `download-${invoice.id}`}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {actionLoading === `download-${invoice.id}` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handlePreview(invoice)}
                          disabled={actionLoading === `preview-${invoice.id}`}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                          {actionLoading === `preview-${invoice.id}` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Preview
                            </>
                          )}
                        </button>

                        {showEmailInput === invoice.id ? (
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="Enter email"
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
                            />
                            <button
                              onClick={() => handleEmail(invoice, emailInput)}
                              disabled={actionLoading === `email-${invoice.id}`}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Send
                            </button>
                            <button
                              onClick={() => {
                                setShowEmailInput(null);
                                setEmailInput('');
                              }}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowEmailInput(invoice.id)}
                            disabled={actionLoading === `email-${invoice.id}`}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {actionLoading === `email-${invoice.id}` ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email
                              </>
                            )}
                          </button>
                        )}

                        {isAdmin && invoice.status !== 'paid' && (
                          <button
                            onClick={() => handleResendInvoice(invoice)}
                            disabled={actionLoading === `resend-${invoice.id}`}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {actionLoading === `resend-${invoice.id}` ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Resending...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Resend
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Invoices Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {isAdmin ? 'Generate a new invoice for this order.' : 'No invoices have been generated for this order yet.'}
                </p>
                {isAdmin && (
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={actionLoading === 'generate' || loading}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate First Invoice
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
