'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, FileText, DollarSign, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import { CorporateAPI } from '@/lib/api/corporate';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CorporateAccount, CorporateDashboardStats } from '@/types/corporate';

const CorporateAccountPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [stats, setStats] = useState<CorporateDashboardStats | null>(null);

  useEffect(() => {
    loadCorporateAccount();
  }, []);

  const loadCorporateAccount = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get account ID from localStorage or user context
      const accountId = localStorage.getItem('corporate_account_id');
      
      if (!accountId) {
        // Redirect to registration if no corporate account
        router.push('/register/corporate');
        return;
      }

      // Load account details and stats in parallel
      const [accountData, statsData] = await Promise.all([
        CorporateAPI.getAccount(accountId),
        CorporateAPI.getDashboardStats(accountId).catch(() => null)
      ]);

      setAccount(accountData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load corporate account');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/register/corporate')}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Register Corporate Account
          </button>
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
                    ৳{stats.availableCredit.toLocaleString()}
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
                    ৳{stats.creditLimit.toLocaleString()}
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
                    ৳{stats.usedCredit.toLocaleString()}
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
      </div>
    </div>
  );
};

export default CorporateAccountPage;
