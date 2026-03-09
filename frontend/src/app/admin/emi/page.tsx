'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, TrendingUp, Check, X, ArrowRight } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api/client';

interface EmiStats {
  totalProviders: number;
  activeProviders: number;
  totalPlans: number;
  activePlans: number;
}

interface EmiOverview {
  stats: EmiStats;
  recentProviders: any[];
  recentPlans: any[];
}

function EmiDashboard() {
  const [overview, setOverview] = useState<EmiOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        
        // Fetch providers and plans in parallel
        const [providersResponse, plansResponse] = await Promise.all([
          apiClient.get('/admin/emi/providers?page=1&limit=5'),
          apiClient.get('/admin/emi/plans?page=1&limit=5')
        ]);

        const providers = providersResponse.providers || [];
        const plans = plansResponse.plans || [];
 
        // Use pagination totals for accurate statistics instead of array length
        const totalProviders = providersResponse.pagination?.total || 0;
        const totalPlans = plansResponse.pagination?.total || 0;
 
        setOverview({
          stats: {
            totalProviders,
            activeProviders: providers.filter((p: any) => p.isActive === true).length,
            totalPlans,
            activePlans: plans.filter((p: any) => p.isActive === true).length,
          },
          recentProviders: providers.slice(0, 5),
          recentPlans: plans.slice(0, 5),
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load EMI overview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const statsData = [
    {
      title: 'Total Providers',
      value: isLoading ? '...' : overview?.stats.totalProviders || 0,
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      color: 'blue',
    },
    {
      title: 'Active Providers',
      value: isLoading ? '...' : overview?.stats.activeProviders || 0,
      icon: <Check className="w-6 h-6 text-green-600" />,
      color: 'green',
    },
    {
      title: 'Total Plans',
      value: isLoading ? '...' : overview?.stats.totalPlans || 0,
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      color: 'blue',
    },
    {
      title: 'Active Plans',
      value: isLoading ? '...' : overview?.stats.activePlans || 0,
      icon: <Check className="w-6 h-6 text-green-600" />,
      color: 'green',
    },
  ];

  return (
    <AdminLayout title="EMI Management">
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Divider */}
        <div className="border-t border-neutral-200 my-8"></div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/admin/emi/providers"
            className="flex items-center justify-between p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Providers</h3>
              <p className="text-sm text-gray-600">Add, edit, and manage EMI providers</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link
            href="/admin/emi/plans"
            className="flex items-center justify-between p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Plans</h3>
              <p className="text-sm text-gray-600">Configure EMI plans and durations</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        {/* Recent Providers */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Providers</h3>
            <Link
              href="/admin/emi/providers"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : overview?.recentProviders && overview.recentProviders.length > 0 ? (
              <div className="space-y-3">
                {overview.recentProviders.map((provider: any) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {provider.logoUrl && (
                        <img
                          src={provider.logoUrl}
                          alt={provider.name}
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        <p className="text-sm text-gray-500">
                          {provider.minAmount} - {provider.maxAmount} BDT
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      provider.isActive === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.isActive === true ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No providers found</div>
            )}
          </div>
        </div>

        {/* Recent Plans */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Plans</h3>
            <Link
              href="/admin/emi/plans"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : overview?.recentPlans && overview.recentPlans.length > 0 ? (
              <div className="space-y-3">
                {overview.recentPlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-500">
                        {plan.duration} months @ {plan.interestRate}% interest
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.isActive === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.isActive === true ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No plans found</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(EmiDashboard, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
