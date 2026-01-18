'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CreditAPI } from '@/lib/api/corporate';
import { CreditLimit, CreditRequest, CreditRequestStatus } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CorporateCreditPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { accountId, isLoading: accountLoading, error: accountError } = useCorporateAccount();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditLimit, setCreditLimit] = useState<CreditLimit | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCreditData = async () => {
    if (!accountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [limitData, historyData] = await Promise.all([
        CreditAPI.getCreditLimit(accountId),
        CreditAPI.getCreditHistory(accountId)
      ]);
      setCreditLimit(limitData);
      setCreditHistory(historyData);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to load credit information' : 'ক্রেডিট তথ্য লোড করতে ব্যর্থ'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, [accountId]);

  const getStatusColor = (status: CreditRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadge = (status: CreditRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return language === 'en' ? 'Pending' : 'অপেক্তিঙ';
      case 'APPROVED':
        return language === 'en' ? 'Approved' : 'অনুমতিক';
      case 'REJECTED':
        return language === 'en' ? 'Rejected' : 'প্রত্য়';
      default:
        return language === 'en' ? 'Unknown' : 'অজানা';
    }
  };

  const handleRequestCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !requestAmount || !requestReason) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const amount = parseFloat(requestAmount);
      await CreditAPI.requestCreditIncrease(accountId!, { requestedLimit: amount, reason: requestReason });
      
      // Refresh data
      const [limitData, historyData] = await Promise.all([
        CreditAPI.getCreditLimit(accountId),
        CreditAPI.getCreditHistory(accountId)
      ]);
      setCreditLimit(limitData);
      setCreditHistory(historyData);
      
      setShowRequestModal(false);
      setRequestAmount('');
      setRequestReason('');
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Failed to submit credit request' : 'ক্রেডিট অনুরোধ জমা দিতে ব্যর্থ'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const creditUsagePercentage = creditLimit 
    ? ((creditLimit.usedCredit / creditLimit.limit) * 100).toFixed(1)
    : '0';

  const availableCredit = creditLimit
    ? creditLimit.limit - creditLimit.usedCredit
    : 0;

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
              fetchCreditData();
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
              <CreditCard className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Credit Management' : 'ক্রেডিট ম্যানেজমেন্ট'}
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
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>{language === 'en' ? 'Request Increase' : 'বৃদ্ধির অনুরোধ'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Credit Limit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Credit Limit Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en' ? 'Credit Limit' : 'ক্রেডিট লিমিট'}
              </h3>
              <CreditCard className="w-6 h-6 text-primary-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Total Limit' : 'মোট লিমিট'}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ৳{creditLimit?.limit.toLocaleString('en-BD') || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Used Credit' : 'ব্যবহাও ক্রেডিট'}
                </span>
                <span className="text-2xl font-bold text-red-600">
                  ৳{creditLimit?.usedCredit.toLocaleString('en-BD') || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Available' : 'উপলব্ধ'}
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ৳{availableCredit.toLocaleString('en-BD')}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Usage' : 'ব্যবহার'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {creditUsagePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    parseFloat(creditUsagePercentage) > 80 
                      ? 'bg-red-600' 
                      : parseFloat(creditUsagePercentage) > 50 
                      ? 'bg-yellow-500' 
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${creditUsagePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Credit Score Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en' ? 'Credit Score' : 'ক্রেডিট স্কোর'}
              </h3>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {creditLimit?.creditScore || 0}
              </div>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'out of 100' : '100 এর মধ্যে'}
              </p>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                {language === 'en' 
                  ? 'Excellent credit standing. Keep up the good work!' 
                  : 'চমৎকার ক্রেডিট অবস্থা। ভালো কাজ চালিয়ে যান!'}
              </p>
            </div>
          </div>

          {/* Pending Requests Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en' ? 'Pending Requests' : 'অপেক্তিঙ অনুরোধ'}
              </h3>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-600 mb-2">
                {creditHistory.filter(r => r.status === 'PENDING').length}
              </div>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'requests awaiting approval' : 'অনুমতিক্তিঙ অনুরোধ'}
              </p>
            </div>
            {creditHistory.filter(r => r.status === 'PENDING').length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {language === 'en' 
                    ? 'You have pending credit increase requests. Check back later for updates.' 
                    : 'আপনার অপেক্তিঙ ক্রেডিট বৃদ্ধি অনুরোধ আছে। আপডেটের জন্য পরে চেক করুন।'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credit History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'en' ? 'Credit History' : 'ক্রেডিট ইতিহাস'}
            </h2>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="all">{language === 'en' ? 'All Requests' : 'সব অনুরোধ'}</option>
                <option value="pending">{language === 'en' ? 'Pending' : 'অপেক্তিঙ'}</option>
                <option value="approved">{language === 'en' ? 'Approved' : 'অনুমতিক'}</option>
                <option value="rejected">{language === 'en' ? 'Rejected' : 'প্রত্য়'}</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Error' : 'ভুল'}
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchCreditData();
                }}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {language === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
              </button>
            </div>
          ) : creditHistory.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'No Credit History' : 'কোন ক্রেডিট ইতিহাস নেই'}
              </h2>
              <p className="text-gray-600">
                {language === 'en' 
                  ? 'Request a credit increase to start building your credit history' 
                  : 'আপনার ক্রেডিট ইতিহাস তৈরি করতে ক্রেডিট বৃদ্ধির অনুরোধ করুন'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {creditHistory.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(request.status)}`}>
                        {request.status === 'PENDING' && <Clock className="w-5 h-5 text-white" />}
                        {request.status === 'APPROVED' && <CheckCircle className="w-5 h-5 text-white" />}
                        {request.status === 'REJECTED' && <XCircle className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {language === 'en' ? 'Credit Increase Request' : 'ক্রেডিট বৃদ্ধি অনুরোধ'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusBadge(request.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">{language === 'en' ? 'Requested Amount' : 'অনুরোধিত পরিমাণ'}</p>
                      <p className="font-semibold text-gray-900">৳{request.requestedAmount.toLocaleString('en-BD')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{language === 'en' ? 'Current Limit' : 'বর্তমান লিমিট'}</p>
                      <p className="font-semibold text-gray-900">৳{request.currentLimit.toLocaleString('en-BD')}</p>
                    </div>
                    {request.approvedAmount && (
                      <div>
                        <p className="text-xs text-gray-600">{language === 'en' ? 'Approved Amount' : 'অনুমতিক পরিমাণ'}</p>
                        <p className="font-semibold text-green-600">৳{request.approvedAmount.toLocaleString('en-BD')}</p>
                      </div>
                    )}
                    {request.reviewedAt && (
                      <div>
                        <p className="text-xs text-gray-600">{language === 'en' ? 'Reviewed On' : 'পর্যালোচিত'}</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(request.reviewedAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {request.reason && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">{language === 'en' ? 'Reason' : 'কারণ'}</p>
                      <p className="text-sm text-gray-900">{request.reason}</p>
                    </div>
                  )}

                  {request.rejectionReason && (
                    <div className="bg-red-50 rounded-lg p-3 mt-3">
                      <p className="text-xs text-red-600 mb-1">{language === 'en' ? 'Rejection Reason' : 'প্রত্য় কারণ'}</p>
                      <p className="text-sm text-red-900">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Credit Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {language === 'en' ? 'Request Credit Increase' : 'ক্রেডিট বৃদ্ধি অনুরোধ'}
                  </h2>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleRequestCredit} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Requested Amount (BDT)' : 'অনুরোধিত পরিমাণ (টাকা)'}
                  </label>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="100000"
                    min="1000"
                    step="1000"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en' ? 'Minimum amount: ৳1,000' : 'ন্যূনতম পরিমাণ: ৳1,000'}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Reason for Increase' : 'বৃদ্ধির কারণ'}
                  </label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder={language === 'en' 
                      ? 'Please explain why you need a credit increase...' 
                      : 'অনুগ্রহ করে ব্যাখ্যা করুন কেন আপনার ক্রেডিট বৃদ্ধি প্রয়োজন...'}
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {language === 'en' ? 'Important Note' : 'গুরুত্বপূর্ণ নোট'}
                      </p>
                      <p className="text-sm text-blue-800">
                        {language === 'en' 
                          ? 'Your request will be reviewed by our team. Approval typically takes 2-3 business days.' 
                          : 'আপনার অনুরোধ আমাদের দল দ্বারা পর্যালোচিত হবে। অনুমতিক সাধারণত 2-3 কার্যদিবস সময় লাগে।'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting 
                      ? (language === 'en' ? 'Submitting...' : 'জমা দিচ্ছে...') 
                      : (language === 'en' ? 'Submit Request' : 'অনুরোধ জমা দিন')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {language === 'en' ? 'Cancel' : 'বাতিল করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateCreditPage;
