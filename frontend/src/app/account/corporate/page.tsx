'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, FileText, DollarSign, TrendingUp, ArrowRight, AlertCircle, Download } from 'lucide-react';
import { CorporateAPI } from '@/lib/api/corporate';
import { apiClient } from '@/lib/api/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CorporateAccount, CorporateDashboardStats } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';

interface CorporateDocument {
  id: string;
  documentType: string;
  documentName: string;
  status: string;
  uploadedAt: string;
  verifiedAt?: string;
}

const CorporateAccountPage = () => {
  const router = useRouter();
  const { accountId, isLoading: accountLoading, error: accountError, account: accountData, refetch: refetchAccount } = useCorporateAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [stats, setStats] = useState<CorporateDashboardStats | null>(null);
  const [documents, setDocuments] = useState<CorporateDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (accountLoading) return;
    
    if (accountError) {
      setError(accountError);
      setIsLoading(false);
      return;
    }

    if (!accountId) {
      // Redirect to registration if no corporate account
      router.push('/register/corporate');
      return;
    }

    loadCorporateAccount(accountId);
  }, [accountId, accountLoading, accountError]);

  const loadCorporateAccount = async (accountId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use account data from hook if available, otherwise fetch
      const accountDetails = accountData || await CorporateAPI.getAccount(accountId);
      
      // Load stats in parallel
      const statsData = await CorporateAPI.getDashboardStats(accountId).catch(() => null);

      setAccount(accountDetails);
      setStats(statsData);
      
      // Load documents separately
      loadDocuments(accountId);
    } catch (err: any) {
      setError(err.message || 'Failed to load corporate account');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (accountId: string) => {
    setIsLoadingDocuments(true);
    try {
      const response: any = await apiClient.get<{ documents: CorporateDocument[] }>(`/corporate/${accountId}/status`);
      setDocuments(response.documents || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      // Don't set error for documents, just log it
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadDocument = async (document: CorporateDocument) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      // Construct the document URL based on the backend structure
      const documentUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/corporate-docs/${document.documentType}_${document.id}.pdf`;
      
      // Open in new tab for download/view
      window.open(documentUrl, '_blank');
    } catch (err: any) {
      console.error('Failed to download document:', err);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Clear any cached corporate account ID
      if (typeof window !== 'undefined') {
        localStorage.removeItem('corporate_account_id');
      }
      
      // Refetch the corporate account
      await refetchAccount();
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to refresh:', err);
      setError('Failed to refresh. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (accountLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || accountError) {
    const isCacheError = accountError?.toLowerCase().includes('404') || 
                         accountError?.toLowerCase().includes('not found') ||
                         error?.toLowerCase().includes('404') ||
                         error?.toLowerCase().includes('not found');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isCacheError ? 'Account Data Stale' : 'Error'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isCacheError 
              ? 'Your cached corporate account data is outdated. Please refresh to load the correct information.'
              : (error || accountError)}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => router.push('/register/corporate')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Register Corporate Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{account.companyName}</h1>
                <p className="text-sm text-gray-600">Account ID: {account.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(account.status)}`}>
                {account.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Credit</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ৳{stats.availableCredit !== null && stats.availableCredit !== undefined ? stats.availableCredit.toLocaleString() : '0'}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credit Limit</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ৳{stats.creditLimit !== null && stats.creditLimit !== undefined ? stats.creditLimit.toLocaleString() : '0'}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Used Credit</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ৳{stats.usedCredit !== null && stats.usedCredit !== undefined ? stats.usedCredit.toLocaleString() : '0'}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</p>
                </div>
                <Users className="w-10 h-10 text-primary-600" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/account/corporate/dashboard')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Dashboard</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/account/corporate/users')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Manage Users</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/account/corporate/pricing')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Pricing</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/account/corporate/purchase-orders')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Purchase Orders</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/account/corporate/invoices')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Invoices</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/account/corporate/credit')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900">Credit Management</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Company Name</p>
              <p className="text-gray-900 mt-1">{account.companyName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Registration Number</p>
              <p className="text-gray-900 mt-1">{account.companyRegistrationNumber}</p>
            </div>

            {account.tinNumber && (
              <div>
                <p className="text-sm font-medium text-gray-600">TIN Number</p>
                <p className="text-gray-900 mt-1">{account.tinNumber}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-600">Business Address</p>
              <p className="text-gray-900 mt-1">{account.businessAddress}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Division</p>
              <p className="text-gray-900 mt-1">{account.division}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">District</p>
              <p className="text-gray-900 mt-1">{account.district}</p>
            </div>

            {account.upazila && (
              <div>
                <p className="text-sm font-medium text-gray-600">Upazila</p>
                <p className="text-gray-900 mt-1">{account.upazila}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-600">Authorized Person</p>
              <p className="text-gray-900 mt-1">{account.authorizedPersonName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Company Email</p>
              <p className="text-gray-900 mt-1">{account.companyEmail}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Account Created</p>
              <p className="text-gray-900 mt-1">
                {new Date(account.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-gray-900 mt-1">
                {new Date(account.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Corporate Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Corporate Documents</h2>
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-primary-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.documentName}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {doc.verifiedAt && (
                          <p className="text-sm text-gray-500">
                            Verified: {new Date(doc.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorporateAccountPage;
