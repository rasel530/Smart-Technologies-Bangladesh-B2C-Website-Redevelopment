'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, TrendingUp, Check, X, ArrowRight } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { PageWrapper, StatsGrid, Badge } from '@/components/design-system';
import { apiClient } from '@/lib/api/client';
import { ButtonPrimary } from '@/components/design-system';

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
      icon: <CreditCard className="w-6 h-6 text-primary-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Providers',
      value: isLoading ? '...' : overview?.stats.activeProviders || 0,
      icon: <Check className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
    {
      title: 'Total Plans',
      value: isLoading ? '...' : overview?.stats.totalPlans || 0,
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Plans',
      value: isLoading ? '...' : overview?.stats.activePlans || 0,
      icon: <Check className="w-6 h-6 text-green-600" />,
      color: 'success' as const,
    },
  ];

  return (
    <PageWrapper
      title="EMI Management"
      description="Manage Equated Monthly Installment (EMI) providers and plans"
    >
      {/* Statistics */}
      <StatsGrid stats={statsData} columns={4} />

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
            className="text-sm text-primary-600 hover:text-primary-700"
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
                  <Badge color={provider.isActive === true ? 'success' : 'neutral'}>
                    {provider.isActive === true ? 'Active' : 'Inactive'}
                  </Badge>
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
            className="text-sm text-primary-600 hover:text-primary-700"
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
                  <Badge color={plan.isActive === true ? 'success' : 'neutral'}>
                    {plan.isActive === true ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No plans found</div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

export default withAuth(EmiDashboard, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
