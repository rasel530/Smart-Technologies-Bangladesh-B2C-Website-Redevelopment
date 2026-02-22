'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Mail, 
  Clock, 
  Percent, 
  AlertCircle,
  ChevronLeft,
  Bell,
  Send
} from 'lucide-react';
import Link from 'next/link';

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

interface RecoverySettings {
  enabled: boolean;
  firstEmailDelay: number;
  secondEmailDelay: number;
  thirdEmailDelay: number;
  discountEnabled: boolean;
  discountPercentage: number;
  discountCode: string;
  maxRecoveryAttempts: number;
  minCartValue: number;
  emailFromName: string;
  emailFromAddress: string;
}

const defaultSettings: RecoverySettings = {
  enabled: true,
  firstEmailDelay: 1,
  secondEmailDelay: 24,
  thirdEmailDelay: 72,
  discountEnabled: true,
  discountPercentage: 10,
  discountCode: 'COMEBACK10',
  maxRecoveryAttempts: 3,
  minCartValue: 1000,
  emailFromName: 'Smart Tech',
  emailFromAddress: 'noreply@smarttech.com',
};

export default function RecoverySettingsPage() {
  const [settings, setSettings] = useState<RecoverySettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/carts/recovery/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data.data });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/carts/recovery/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof RecoverySettings>(
    key: K,
    value: RecoverySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/cart/recovery">
          <Button variant="outline" className="px-3">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recovery Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure abandoned cart recovery settings and email templates
          </p>
        </div>
      </div>

      {saved && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <SimpleTabs defaultValue="general">
        <SimpleTabsList className="mb-6">
          <SimpleTabsTrigger value="general">General</SimpleTabsTrigger>
          <SimpleTabsTrigger value="emails">Emails</SimpleTabsTrigger>
          <SimpleTabsTrigger value="discounts">Discounts</SimpleTabsTrigger>
        </SimpleTabsList>

        <SimpleTabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Enable or disable cart recovery and set basic parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Cart Recovery</Label>
                  <p className="text-sm text-gray-500">
                    Automatically send recovery emails for abandoned carts
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Recovery Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min={1}
                    max={5}
                    value={settings.maxRecoveryAttempts}
                    onChange={(e) => updateSetting('maxRecoveryAttempts', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    Maximum number of recovery emails to send per cart
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minCartValue">Minimum Cart Value</Label>
                  <Input
                    id="minCartValue"
                    type="number"
                    min={0}
                    step={100}
                    value={settings.minCartValue}
                    onChange={(e) => updateSetting('minCartValue', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    Only recover carts with value above this amount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure sender information for recovery emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.emailFromName}
                    onChange={(e) => updateSetting('emailFromName', e.target.value)}
                    placeholder="Smart Tech"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromAddress">From Email Address</Label>
                  <Input
                    id="fromAddress"
                    type="email"
                    value={settings.emailFromAddress}
                    onChange={(e) => updateSetting('emailFromAddress', e.target.value)}
                    placeholder="noreply@smarttech.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </SimpleTabsContent>

        <SimpleTabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Email Timing
              </CardTitle>
              <CardDescription>
                Set the delay for each recovery email (in hours)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstDelay">First Email Delay</Label>
                  <Input
                    id="firstDelay"
                    type="number"
                    min={0}
                    value={settings.firstEmailDelay}
                    onChange={(e) => updateSetting('firstEmailDelay', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">Hours after abandonment</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondDelay">Second Email Delay</Label>
                  <Input
                    id="secondDelay"
                    type="number"
                    min={0}
                    value={settings.secondEmailDelay}
                    onChange={(e) => updateSetting('secondEmailDelay', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">Hours after abandonment</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thirdDelay">Third Email Delay</Label>
                  <Input
                    id="thirdDelay"
                    type="number"
                    min={0}
                    value={settings.thirdEmailDelay}
                    onChange={(e) => updateSetting('thirdEmailDelay', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">Hours after abandonment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Customize recovery email content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Available Variables</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <code className="bg-white px-2 py-1 rounded">{'{{customerName}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{cartTotal}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{productList}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{recoveryLink}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{discountCode}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{discountAmount}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{expiryDate}}'}</code>
                    <code className="bg-white px-2 py-1 rounded">{'{{companyName}}'}</code>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Email templates can be customized in the admin panel.</p>
                  <p className="mt-1">Default templates are available in English and Bengali.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SimpleTabsContent>

        <SimpleTabsContent value="discounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Discount Settings
              </CardTitle>
              <CardDescription>
                Configure automatic discounts for recovered carts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="discountEnabled">Enable Recovery Discounts</Label>
                  <p className="text-sm text-gray-500">
                    Offer discounts to incentivize cart recovery
                  </p>
                </div>
                <Switch
                  checked={settings.discountEnabled}
                  onCheckedChange={(checked) => updateSetting('discountEnabled', checked)}
                />
              </div>

              {settings.discountEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min={1}
                      max={100}
                      value={settings.discountPercentage}
                      onChange={(e) => updateSetting('discountPercentage', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      Percentage discount for recovered carts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountCode">Discount Code</Label>
                    <Input
                      id="discountCode"
                      value={settings.discountCode}
                      onChange={(e) => updateSetting('discountCode', e.target.value)}
                      placeholder="COMEBACK10"
                    />
                    <p className="text-sm text-gray-500">
                      Code shown to customers
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </SimpleTabsContent>
      </SimpleTabs>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
