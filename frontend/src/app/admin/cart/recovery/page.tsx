'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  BarChart3, 
  Mail, 
  ShoppingCart,
  Clock,
  TrendingUp,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import RecoveryDashboard from '@/components/admin/cart/RecoveryDashboard';

// Simple Tabs implementation
const SimpleTabs: React.FC<{ defaultValue: string; children: React.ReactNode }> = ({ 
  defaultValue, 
  children 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className="w-full">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === SimpleTabsList) {
          return React.cloneElement(child as React.ReactElement<{ value: string; onValueChange: (v: string) => void }>, { 
            value: activeTab, 
            onValueChange: setActiveTab 
          });
        }
        if (child.type === SimpleTabsContent) {
          return React.cloneElement(child as React.ReactElement<{ value: string; activeValue: string }>, { 
            activeValue: activeTab 
          });
        }
        return child;
      })}
    </div>
  );
};

const SimpleTabsList: React.FC<{ 
  children: React.ReactNode; 
  value?: string; 
  onValueChange?: (v: string) => void;
  className?: string;
}> = ({ children, value, onValueChange, className }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className || ''}`}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<{ isActive?: boolean; onClick?: () => void }>, { 
        isActive: child.props.value === value,
        onClick: () => onValueChange?.(child.props.value)
      });
    })}
  </div>
);

const SimpleTabsTrigger: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  isActive?: boolean;
  onClick?: () => void;
}> = ({ children, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
      isActive 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const SimpleTabsContent: React.FC<{ 
  value: string; 
  children: React.ReactNode;
  activeValue?: string;
}> = ({ value, children, activeValue }) => {
  if (value !== activeValue) return null;
  return <div className="mt-2">{children}</div>;
};

export default function CartRecoveryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cart Recovery</h1>
          <p className="text-gray-500 mt-1">
            Manage abandoned carts and recovery campaigns
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/cart/recovery/settings">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Link href="/admin/cart/recovery/stats">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Abandoned Carts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ShoppingCart className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Recovery Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">--%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Recovery Emails</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Recovery Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">--h</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <SimpleTabs defaultValue="dashboard">
        <SimpleTabsList>
          <SimpleTabsTrigger value="dashboard">Dashboard</SimpleTabsTrigger>
          <SimpleTabsTrigger value="carts">Abandoned Carts</SimpleTabsTrigger>
        </SimpleTabsList>

        <SimpleTabsContent value="dashboard">
          <div className="space-y-6">
            <RecoveryDashboard 
              language="en"
              onViewCart={(cartId) => {
                window.location.href = `/admin/cart/${cartId}`;
              }}
            />
          </div>
        </SimpleTabsContent>

        <SimpleTabsContent value="carts">
          <Card>
            <CardHeader>
              <CardTitle>Abandoned Carts</CardTitle>
              <CardDescription>
                View and manage abandoned carts. Use the main cart list with filters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  View all abandoned carts in the main cart management page
                </p>
                <Link href="/admin/cart">
                  <Button variant="outline">
                    Go to Cart Management
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </SimpleTabsContent>
      </SimpleTabs>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/cart/recovery/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Recovery Settings</h3>
                  <p className="text-sm text-gray-500">Configure email templates and timing</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/cart/recovery/stats">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Recovery Statistics</h3>
                  <p className="text-sm text-gray-500">View detailed recovery analytics</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
