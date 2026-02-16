'use client';

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Clock,
  Mail,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Calendar,
  BarChart3
} from 'lucide-react';
import adminCartApi, {
  type CleanupResponse,
  type AbandonedCleanupResponse,
  type FullCleanupResponse,
  type ReminderResponse,
  type SchedulerStatusResponse
} from '@/lib/api/admin/cart';

interface CartCleanupProps {
  language?: 'en' | 'bn';
}

const CartCleanup: React.FC<CartCleanupProps> = ({ language = 'en' }) => {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatusResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [operating, setOperating] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState({
    dryRun: false,
    thresholdDays: 7,
    sendReminders: false,
    batchSize: 1000
  });

  useEffect(() => {
    fetchSchedulerStatus();
  }, []);

  const fetchSchedulerStatus = async () => {
    setLoading(true);
    try {
      const response = await adminCartApi.getSchedulerStatus();
      if (response.success) {
        setSchedulerStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    } finally {
      setLoading(false);
    }
  };

  const showResult = (type: 'success' | 'error', message: string) => {
    setResult({ type, message });
    setTimeout(() => setResult(null), 5000);
  };

  const handleCleanupExpiredCarts = async () => {
    setOperating('cleanupExpired');
    try {
      const response = await adminCartApi.cleanupExpiredCartsNew({
        dryRun: cleanupOptions.dryRun,
        batchSize: cleanupOptions.batchSize
      });
      if (response.success) {
        showResult('success', `Cleaned ${response.cleaned} expired carts. Duration: ${response.duration}ms`);
      } else {
        showResult('error', response.message || 'Failed to clean up expired carts');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Failed to clean up expired carts');
    } finally {
      setOperating(null);
    }
  };

  const handleCleanupReservations = async () => {
    setOperating('cleanupReservations');
    try {
      const response = await adminCartApi.cleanupExpiredReservations();
      if (response.success) {
        showResult('success', `Released ${response.released} expired reservations. Duration: ${response.duration}ms`);
      } else {
        showResult('error', response.message || 'Failed to clean up reservations');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Failed to clean up reservations');
    } finally {
      setOperating(null);
    }
  };

  const handleCleanupAbandonedCarts = async () => {
    setOperating('cleanupAbandoned');
    try {
      const response = await adminCartApi.cleanupAbandonedCarts({
        thresholdDays: cleanupOptions.thresholdDays,
        sendReminders: cleanupOptions.sendReminders,
        dryRun: cleanupOptions.dryRun
      });
      if (response.success) {
        showResult('success', `Marked ${response.cleaned} carts as abandoned. Sent ${response.remindersSent} reminders.`);
      } else {
        showResult('error', response.message || 'Failed to clean up abandoned carts');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Failed to clean up abandoned carts');
    } finally {
      setOperating(null);
    }
  };

  const handleRunFullCleanup = async () => {
    setOperating('fullCleanup');
    try {
      const response = await adminCartApi.runFullCleanup({
        includeReservations: true,
        includeAbandoned: true,
        sendReminders: cleanupOptions.sendReminders
      });
      if (response.success) {
        showResult('success', 
          `Full cleanup completed: ${response.cartsExpired} carts expired, ` +
          `${response.reservationsReleased} reservations released, ` +
          `${response.abandonedCleaned} abandoned, ${response.remindersSent} reminders sent`
        );
      } else {
        showResult('error', 'Full cleanup failed');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Full cleanup failed');
    } finally {
      setOperating(null);
    }
  };

  const handleSendReminders = async () => {
    setOperating('sendReminders');
    try {
      const response = await adminCartApi.sendRecoveryReminders({
        thresholdDays: cleanupOptions.thresholdDays,
        batchSize: cleanupOptions.batchSize
      });
      if (response.success) {
        showResult('success', `Sent ${response.sent} recovery reminder emails`);
      } else {
        showResult('error', response.message || 'Failed to send reminders');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Failed to send reminders');
    } finally {
      setOperating(null);
    }
  };

  const handleStartScheduler = async () => {
    setOperating('startScheduler');
    try {
      const response = await adminCartApi.startCleanupScheduler();
      if (response.success) {
        showResult('success', 'Cleanup scheduler started');
        fetchSchedulerStatus();
      } else {
        showResult('error', response.message || 'Failed to start scheduler');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Failed to start scheduler');
    } finally {
      setOperating(null);
    }
  };

  const handleStopScheduler = async () => {
    setOperating('stopScheduler');
    try {
      const response = await adminCartApi.stopCleanupScheduler();
      if (response.success) {
        showResult('success', 'Cleanup scheduler stopped');
        fetchSchedulerStatus();
      } else {
        showResult('error', response.message || 'Failed to stop scheduler');
      }
    } catch (error: any) {
      showResult('error', error.message || 'Failed to stop scheduler');
    } finally {
      setOperating(null);
    }
  };

  const handleRunJob = async (jobName: string) => {
    setOperating(`runJob_${jobName}`);
    try {
      const response = await adminCartApi.runScheduledJob(jobName);
      if (response.success) {
        showResult('success', `Job ${jobName} completed in ${response.duration}ms`);
      } else {
        showResult('error', response.message || `Failed to run job ${jobName}`);
      }
    } catch (error: any) {
      showResult('error', error.message || `Failed to run job ${jobName}`);
    } finally {
      setOperating(null);
    }
  };

  const translations = {
    en: {
      title: 'Cart Cleanup',
      subtitle: 'Manage cart cleanup operations and scheduler',
      cleanupExpired: 'Cleanup Expired Carts',
      cleanupExpiredDesc: 'Mark carts past TTL as expired',
      cleanupReservations: 'Cleanup Reservations',
      cleanupReservationsDesc: 'Release expired stock reservations',
      cleanupAbandoned: 'Cleanup Abandoned Carts',
      cleanupAbandonedDesc: 'Mark carts with no activity as abandoned',
      fullCleanup: 'Full Cleanup',
      fullCleanupDesc: 'Run all cleanup operations',
      sendReminders: 'Send Reminders',
      sendRemindersDesc: 'Send recovery reminder emails',
      scheduler: 'Scheduler',
      schedulerRunning: 'Scheduler Running',
      schedulerStopped: 'Scheduler Stopped',
      startScheduler: 'Start Scheduler',
      stopScheduler: 'Stop Scheduler',
      scheduledJobs: 'Scheduled Jobs',
      nextRun: 'Next Run',
      cleanupStats: 'Cleanup Statistics',
      cartsExpired: 'Carts Expired',
      reservationsReleased: 'Reservations Released',
      abandonedCleaned: 'Abandoned Cleaned',
      remindersSent: 'Reminders Sent',
      settings: 'Settings',
      options: 'Options',
      dryRun: 'Dry Run',
      dryRunDesc: 'Preview changes without making them',
      thresholdDays: 'Threshold Days',
      sendRemindersOption: 'Send Reminders',
      batchSize: 'Batch Size',
      running: 'Running...',
      success: 'Success',
      error: 'Error',
      lastRun: 'Last Run',
      never: 'Never'
    },
    bn: {
      title: 'কার্ট পরিষ্কার',
      subtitle: 'কার্ট পরিষ্কার এবং শিডিউলার পরিচালনা করুন',
      cleanupExpired: 'মেয়াদোত্তীর্ণ কার্ট পরিষ্কার',
      cleanupExpiredDesc: 'TTL অতিক্রান্ত কার্টগুলিকে মেয়াদোত্তীর্ণ হিসাবে চিহ্নিত করুন',
      cleanupReservations: 'রিজার্ভেশন পরিষ্কার',
      cleanupReservationsDesc: 'মেয়াদোত্তীর্ণ স্টক রিজার্ভেশন প্রকাশ করুন',
      cleanupAbandoned: 'পরিত্যক্ত কার্ট পরিষ্কার',
      cleanupAbandonedDesc: 'কোনো কার্যকলাপ ছাড়াই কার্টগুলিকে পরিত্যক্ত হিসাবে চিহ্নিত করুন',
      fullCleanup: 'সম্পূর্ণ পরিষ্কার',
      fullCleanupDesc: 'সমস্ত পরিষ্কার অপারেশন চালান',
      sendReminders: 'রিমাইন্ডার পাঠান',
      sendRemindersDesc: 'পুনরুদ্ধার রিমাইন্ডার ইমেইল পাঠান',
      scheduler: 'শিডিউলার',
      schedulerRunning: 'শিডিউলার চলছে',
      schedulerStopped: 'শিডিউলার বন্ধ',
      startScheduler: 'শিডিউলার শুরু করুন',
      stopScheduler: 'শিডিউলার বন্ধ করুন',
      scheduledJobs: 'নির্ধারিত কাজ',
      nextRun: 'পরবর্তী রান',
      cleanupStats: 'পরিষ্কার পরিসংখ্যান',
      cartsExpired: 'মেয়াদোত্তীর্ণ কার্ট',
      reservationsReleased: 'প্রকাশিত রিজার্ভেশন',
      abandonedCleaned: 'পরিষ্কৃত পরিত্যক্ত',
      remindersSent: 'পাঠানো রিমাইন্ডার',
      settings: 'সেটিংস',
      options: 'বিকল্প',
      dryRun: 'ড্রাই রান',
      dryRunDesc: 'পরিবর্তনগুলি ছাড়াই পূর্বরূপ দেখুন',
      thresholdDays: 'থ্রেশহোল্ড দিন',
      sendRemindersOption: 'রিমাইন্ডার পাঠান',
      batchSize: 'ব্যাচ সাইজ',
      running: 'চলছে...',
      success: 'সফল',
      error: 'ত্রুটি',
      lastRun: 'শেষ রান',
      never: 'কখনো না'
    }
  };

  const t = translations[language];

  const formatNextRun = (dateStr?: string) => {
    if (!dateStr) return t.never;
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showSettings ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            {t.settings}
          </button>
          <button
            onClick={() => fetchSchedulerStatus()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Result Toast */}
      {result && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          result.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {result.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={result.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {result.message}
          </span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.options}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dryRun"
                checked={cleanupOptions.dryRun}
                onChange={(e) => setCleanupOptions({ ...cleanupOptions, dryRun: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="dryRun" className="text-sm">
                <span className="font-medium">{t.dryRun}</span>
                <p className="text-gray-500 text-xs">{t.dryRunDesc}</p>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.thresholdDays}
              </label>
              <input
                type="number"
                value={cleanupOptions.thresholdDays}
                onChange={(e) => setCleanupOptions({ ...cleanupOptions, thresholdDays: parseInt(e.target.value) })}
                min={1}
                max={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendReminders"
                checked={cleanupOptions.sendReminders}
                onChange={(e) => setCleanupOptions({ ...cleanupOptions, sendReminders: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="sendReminders" className="text-sm">
                <span className="font-medium">{t.sendRemindersOption}</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.batchSize}
              </label>
              <input
                type="number"
                value={cleanupOptions.batchSize}
                onChange={(e) => setCleanupOptions({ ...cleanupOptions, batchSize: parseInt(e.target.value) })}
                min={100}
                max={5000}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cleanup Expired Carts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.cleanupExpired}</h3>
                <p className="text-sm text-gray-500">{t.cleanupExpiredDesc}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCleanupExpiredCarts}
            disabled={operating !== null}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operating === 'cleanupExpired' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.running}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {t.cleanupExpired}
              </>
            )}
          </button>
        </div>

        {/* Cleanup Reservations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.cleanupReservations}</h3>
                <p className="text-sm text-gray-500">{t.cleanupReservationsDesc}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCleanupReservations}
            disabled={operating !== null}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operating === 'cleanupReservations' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.running}
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                {t.cleanupReservations}
              </>
            )}
          </button>
        </div>

        {/* Cleanup Abandoned Carts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.cleanupAbandoned}</h3>
                <p className="text-sm text-gray-500">{t.cleanupAbandonedDesc}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCleanupAbandonedCarts}
            disabled={operating !== null}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operating === 'cleanupAbandoned' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.running}
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                {t.cleanupAbandoned}
              </>
            )}
          </button>
        </div>

        {/* Full Cleanup */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.fullCleanup}</h3>
                <p className="text-sm text-gray-500">{t.fullCleanupDesc}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleRunFullCleanup}
            disabled={operating !== null}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operating === 'fullCleanup' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.running}
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                {t.fullCleanup}
              </>
            )}
          </button>
        </div>

        {/* Send Reminders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.sendReminders}</h3>
                <p className="text-sm text-gray-500">{t.sendRemindersDesc}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSendReminders}
            disabled={operating !== null}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operating === 'sendReminders' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.running}
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                {t.sendReminders}
              </>
            )}
          </button>
        </div>

        {/* Scheduler Control */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                schedulerStatus?.scheduler?.isRunning ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {schedulerStatus?.scheduler?.isRunning ? (
                  <Play className="w-5 h-5 text-green-600" />
                ) : (
                  <Pause className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.scheduler}</h3>
                <p className="text-sm text-gray-500">
                  {schedulerStatus?.scheduler?.isRunning ? t.schedulerRunning : t.schedulerStopped}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleStartScheduler}
              disabled={operating !== null || schedulerStatus?.scheduler?.isRunning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
              {t.startScheduler}
            </button>
            <button
              onClick={handleStopScheduler}
              disabled={operating !== null || !schedulerStatus?.scheduler?.isRunning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Pause className="w-4 h-4" />
              {t.stopScheduler}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduler Jobs */}
      {schedulerStatus && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t.scheduledJobs}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.nextRun}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedulerStatus.jobs?.map((job) => (
                  <tr key={job.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.name}</div>
                      <div className="text-sm text-gray-500">{job.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.cronExpression}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNextRun(job.nextRun)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRunJob(job.name)}
                        disabled={operating !== null}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 text-sm"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cleanup Statistics */}
      {schedulerStatus && schedulerStatus.cleanupStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.cleanupStats}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {schedulerStatus.cleanupStats.cartsExpired || 0}
              </div>
              <div className="text-sm text-gray-600">{t.cartsExpired}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {schedulerStatus.cleanupStats.reservationsReleased || 0}
              </div>
              <div className="text-sm text-gray-600">{t.reservationsReleased}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {schedulerStatus.cleanupStats.abandonedCleaned || 0}
              </div>
              <div className="text-sm text-gray-600">{t.abandonedCleaned}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {schedulerStatus.cleanupStats.remindersSent || 0}
              </div>
              <div className="text-sm text-gray-600">{t.remindersSent}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">{t.lastRun}</div>
              <div className="text-sm font-medium text-gray-900">
                {schedulerStatus.cleanupStats.lastRun
                  ? new Date(schedulerStatus.cleanupStats.lastRun).toLocaleDateString()
                  : t.never}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Counts */}
      {schedulerStatus && schedulerStatus.cleanupStats && schedulerStatus.cleanupStats.config && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Cart Counts</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-700">
                {schedulerStatus.cleanupStats.config?.cartTTL ? 'Active' : '-'}
              </div>
              <div className="text-xs text-gray-600">Active Carts</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-700">
                {Math.round(schedulerStatus.cleanupStats.config.cartTTL / (24 * 60 * 60 * 1000))}d
              </div>
              <div className="text-xs text-gray-600">Cart TTL</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-700">
                {Math.round(schedulerStatus.cleanupStats.config.reservationTTL / 60000)}m
              </div>
              <div className="text-xs text-gray-600">Reservation TTL</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-700">
                {schedulerStatus.cleanupStats.config.abandonedCartThreshold}d
              </div>
              <div className="text-xs text-gray-600">Abandonment Threshold</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCleanup;
