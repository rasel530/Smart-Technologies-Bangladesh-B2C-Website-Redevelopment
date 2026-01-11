'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2, AlertCircle, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToastNotification from '@/components/ui/ToastNotification';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';
import { DataExport as DataExportType } from '@/types/accountPreferences';

interface DataExportSectionProps {
  language: 'en' | 'bn';
}

const DATA_TYPES = [
  { id: 'profile', label: { en: 'Profile Information', bn: 'প্রোফাইল তথ্য' } },
  { id: 'orders', label: { en: 'Order History', bn: 'অর্ডার ইতিহাস' } },
  { id: 'addresses', label: { en: 'Addresses', bn: 'ঠিকানা' } },
  { id: 'wishlist', label: { en: 'Wishlist', bn: 'উইশলিস্ট' } },
];

const DataExportSection: React.FC<DataExportSectionProps> = ({ language }) => {
  const [exports, setExports] = useState<DataExportType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getDataExports();
      setExports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load exports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataTypeToggle = (dataTypeId: string) => {
    setSelectedDataTypes(prev =>
      prev.includes(dataTypeId)
        ? prev.filter(id => id !== dataTypeId)
        : [...prev, dataTypeId]
    );
  };

  const handleGenerateExport = async () => {
    if (selectedDataTypes.length === 0) {
      setError(language === 'en' ? 'Please select at least one data type' : 'দয়া করে অন্তত একটি ডেটা ধরন নির্বাচন করুন');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const newExport = await AccountPreferencesAPI.generateDataExport({
        dataTypes: selectedDataTypes,
        format,
      });
      setExports(prev => [newExport, ...prev]);
      setToast({
        type: 'success',
        message: language === 'en'
          ? 'Export request submitted successfully!'
          : 'রপ্তানি অনুরোধ সফলভাবে জমা হয়েছে!',
      });
      setSelectedDataTypes([]);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate export');
      setToast({
        type: 'error',
        message: language === 'en'
          ? 'Failed to generate export'
          : 'রপ্তানি জমা করতে ব্যর্থ হয়েছে',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (exportId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/profile/data/export/${exportId}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success && data.data?.downloadUrl) {
        window.location.href = data.data.downloadUrl;
        setToast({
          type: 'success',
          message: language === 'en'
            ? 'Export downloaded successfully!'
            : 'রপ্তানি সফলভাবে ডাউনলোড হয়েছে!',
        });
        setTimeout(() => setToast(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to download export');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download export');
      setToast({
        type: 'error',
        message: language === 'en'
          ? 'Failed to download export'
          : 'রপ্তানি ডাউনলোড করতে ব্যর্থ হয়েছে',
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'ready':
        return 'text-green-600 bg-green-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'bn') {
      switch (status) {
        case 'processing':
          return 'প্রক্রিয়া হচ্ছে';
        case 'ready':
          return 'প্রস্ত';
        case 'expired':
          return 'মেয়াউতিত';
      }
    }
    switch (status) {
      case 'processing':
        return 'Processing';
      case 'ready':
        return 'Ready';
      case 'expired':
        return 'Expired';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="text-xl font-bold text-gray-900">
        {language === 'en' ? 'Data Export' : 'ডেটা রপ্তানি'}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Generate Export Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'en' ? 'Generate New Export' : 'নতুন রপ্তানি জমা করুন'}
        </h3>

        {/* Data Types Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Select Data Types' : 'ডেটা ধরন নির্বাচন করুন'}
          </label>
          <div className="space-y-2">
            {DATA_TYPES.map(type => (
              <label
                key={type.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDataTypes.includes(type.id)}
                  onChange={() => handleDataTypeToggle(type.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {language === 'en' ? type.label.en : type.label.bn}
                  </p>
                  <p className="text-xs text-gray-600">
                    {type.id === 'profile' && (language === 'en' ? 'Personal information' : 'ব্যক্তিগত তথ্য')}
                    {type.id === 'orders' && (language === 'en' ? 'Order history and details' : 'অর্ডার ইতিহাস এবং বিস্তার')}
                    {type.id === 'addresses' && (language === 'en' ? 'Saved addresses' : 'সংরক্ষিত ঠিকানা')}
                    {type.id === 'wishlist' && (language === 'en' ? 'Wishlist items' : 'উইশলিস্টের আইটেম')}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {language === 'en' ? 'Export Format' : 'রপ্তানি ফরমেট'}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">JSON</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">CSV</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateExport}
          disabled={isGenerating || selectedDataTypes.length === 0}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{language === 'en' ? 'Generating...' : 'জমা হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              <span>{language === 'en' ? 'Generate Export' : 'রপ্তানি জমা করুন'}</span>
            </>
          )}
        </button>
      </div>

      {/* Export History */}
      {exports.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'en' ? 'Export History' : 'রপ্তানি ইতিহাস'}
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Data Types' : 'ডেটা ধরন'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Format' : 'ফরমেট'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Status' : 'স্ট্যাটাস'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Requested' : 'অনুরোধ করা হয়েছে'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Expires' : 'মেয়াউতিত হবে'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Actions' : 'কার্যবাসমুলি'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exports && exports.length > 0 && exports.map(exportItem => (
                  <tr key={exportItem.exportId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {exportItem.dataTypes && exportItem.dataTypes.map(typeId => {
                          const dataType = DATA_TYPES.find(dt => dt.id === typeId);
                          return (
                            <span
                              key={typeId}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                            >
                              {language === 'en' ? dataType?.label.en : dataType?.label.bn}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exportItem.format.toUpperCase()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', getStatusColor(exportItem.status))}>
                        {exportItem.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                        {exportItem.status === 'ready' && <Check className="h-3 w-3 mr-1" />}
                        {getStatusText(exportItem.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(exportItem.requestedAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(exportItem.expiresAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {exportItem.status === 'ready' && exportItem.downloadUrl ? (
                        <button
                          onClick={() => handleDownload(exportItem.exportId)}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium focus:outline-none"
                        >
                          <Download className="h-4 w-4" />
                          <span>{language === 'en' ? 'Download' : 'ডাউনলোড'}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">
                          {language === 'en' ? 'Not available' : 'উপলব্ধ নেই'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {exports.length === 0 && !isLoading && (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {language === 'en'
              ? 'No exports yet. Generate your first export above.'
              : 'এখনো কোনো রপ্তানি নেই। উপরে আপনার প্রথম রপ্তানি জমা করুন।'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataExportSection;
