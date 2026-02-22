'use client';

import React, { useState, useEffect } from 'react';
import { Save, DollarSign, MapPin, Shield, Clock, AlertTriangle, Check, X } from 'lucide-react';
import { withAuth } from '@/components/auth/withAuth';
import { PageWrapper, StatsGrid, Badge, ButtonPrimary, Input, Label } from '@/components/design-system';
import { apiClient } from '@/lib/api/client';

interface CodSettings {
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  additionalFee: number;
  freeAboveAmount: number;
  requirePhoneVerification: boolean;
  requireAddressVerification: boolean;
  maxDailyOrders: number;
  maxWeeklyOrders: number;
  deliveryDays: number;
  availableDivisions: string[];
  unavailableDivisions: string[];
  notes?: string;
}

const BANGLADESH_DIVISIONS = [
  'dhaka',
  'chittagong',
  'khulna',
  'rajshahi',
  'rangpur',
  'sylhet',
  'barisal',
  'mymensingh'
];

function CodSettingsPage() {
  const [settings, setSettings] = useState<CodSettings>({
    isEnabled: true,
    minAmount: 0,
    maxAmount: 50000,
    additionalFee: 0,
    freeAboveAmount: 0,
    requirePhoneVerification: true,
    requireAddressVerification: true,
    maxDailyOrders: 5,
    maxWeeklyOrders: 15,
    deliveryDays: 3,
    availableDivisions: BANGLADESH_DIVISIONS,
    unavailableDivisions: [],
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      console.log('[COD Settings] Fetching settings from API...');
      const response = await apiClient.get<CodSettings>('/admin/cod/settings');
      console.log('[COD Settings] API response:', response);
      
      // Validate response structure
      if (response && typeof response === 'object' && 'isEnabled' in response) {
        setSettings(response);
        console.log('[COD Settings] Settings loaded successfully:', response);
      } else {
        console.error('[COD Settings] Invalid response structure:', response);
        setError('Invalid settings response from server');
      }
    } catch (err: any) {
      console.error('[COD Settings] Error:', err);
      setError(err.message || 'Failed to fetch COD settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      await apiClient.put('/admin/cod/settings', settings);
      
      setSuccessMessage('COD settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save COD settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDivisionToggle = (division: string) => {
    setSettings(prev => {
      const isAvailable = prev.availableDivisions.includes(division);
      
      if (isAvailable) {
        return {
          ...prev,
          availableDivisions: prev.availableDivisions.filter(d => d !== division),
          unavailableDivisions: [...prev.unavailableDivisions, division],
        };
      } else {
        return {
          ...prev,
          availableDivisions: [...prev.availableDivisions, division],
          unavailableDivisions: prev.unavailableDivisions.filter(d => d !== division),
        };
      }
    });
  };

  const statsData = [
    {
      title: 'COD Status',
      value: settings.isEnabled ? 'Enabled' : 'Disabled',
      icon: <Shield className="w-6 h-6" />,
      color: settings.isEnabled ? ('success' as const) : ('default' as const),
    },
    {
      title: 'Available Divisions',
      value: settings.availableDivisions.length.toString(),
      icon: <MapPin className="w-6 h-6" />,
      color: 'primary' as const,
    },
    {
      title: 'Min Order Amount',
      value: `${settings.minAmount.toLocaleString()} BDT`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'primary' as const,
    },
    {
      title: 'Max Order Amount',
      value: `${settings.maxAmount.toLocaleString()} BDT`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'primary' as const,
    },
  ];

  return (
    <PageWrapper
      title="COD Settings"
      description="Configure Cash on Delivery payment options and restrictions"
      actions={
        <ButtonPrimary
          leftIcon={<Save className="w-5 h-5" />}
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </ButtonPrimary>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading settings...</div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <StatsGrid stats={statsData} columns={4} />

          {/* Section Divider */}
          <div className="border-t border-neutral-200 my-8"></div>

          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isEnabled">Enable COD</Label>
                  <p className="text-sm text-gray-500">Allow customers to pay with Cash on Delivery</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.isEnabled ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Minimum Order Amount (BDT)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={settings.minAmount}
                    onChange={(e) => setSettings(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxAmount">Maximum Order Amount (BDT)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={settings.maxAmount}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="additionalFee">Additional Fee (BDT)</Label>
                  <Input
                    id="additionalFee"
                    type="number"
                    value={settings.additionalFee}
                    onChange={(e) => setSettings(prev => ({ ...prev, additionalFee: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="freeAboveAmount">Free COD Above Amount (BDT)</Label>
                  <Input
                    id="freeAboveAmount"
                    type="number"
                    value={settings.freeAboveAmount}
                    onChange={(e) => setSettings(prev => ({ ...prev, freeAboveAmount: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Settings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requirePhoneVerification">Require Phone Verification</Label>
                  <p className="text-sm text-gray-500">Verify customer phone number before COD order</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, requirePhoneVerification: !prev.requirePhoneVerification }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.requirePhoneVerification ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.requirePhoneVerification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireAddressVerification">Require Address Verification</Label>
                  <p className="text-sm text-gray-500">Verify customer address before COD order</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, requireAddressVerification: !prev.requireAddressVerification }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.requireAddressVerification ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.requireAddressVerification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Order Limits */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Limits</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDailyOrders">Maximum Daily Orders per User</Label>
                  <Input
                    id="maxDailyOrders"
                    type="number"
                    value={settings.maxDailyOrders}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxDailyOrders: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxWeeklyOrders">Maximum Weekly Orders per User</Label>
                  <Input
                    id="maxWeeklyOrders"
                    type="number"
                    value={settings.maxWeeklyOrders}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxWeeklyOrders: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deliveryDays">Estimated Delivery Days</Label>
                <Input
                  id="deliveryDays"
                  type="number"
                  value={settings.deliveryDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, deliveryDays: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Number of days for COD delivery</p>
              </div>
            </div>
          </div>

          {/* Available Divisions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Divisions</h3>
            
            <p className="text-sm text-gray-500 mb-4">
              Select the divisions where COD is available
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BANGLADESH_DIVISIONS.map((division) => (
                <button
                  key={division}
                  onClick={() => handleDivisionToggle(division)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    settings.availableDivisions.includes(division)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {settings.availableDivisions.includes(division) ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-sm font-medium">{division}</span>
                  </div>
                </button>
              ))}
            </div>

            {settings.unavailableDivisions.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Unavailable Divisions</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {settings.unavailableDivisions.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Notes</h3>
            
            <div>
              <Label htmlFor="notes">COD Policy Notes</Label>
              <textarea
                id="notes"
                value={settings.notes || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add any additional notes about COD policy..."
              />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default withAuth(CodSettingsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/unauthorized'
});
