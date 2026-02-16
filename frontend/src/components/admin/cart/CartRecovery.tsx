'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Link as LinkIcon,
  Mail,
  Clock,
  History,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';

interface RecoveryHistoryItem {
  id: string;
  type: string;
  timestamp: string;
  adminEmail: string | null;
  adminName: string | null;
}

interface RecoveryStats {
  recoveryCount: number;
  lastRecoveryAt: string | null;
}

interface CartRecoveryProps {
  cartId: string;
  cartStatus: string;
  language?: 'en' | 'bn';
  onRecoveryComplete?: () => void;
}

const CartRecovery: React.FC<CartRecoveryProps> = ({
  cartId,
  cartStatus,
  language = 'en',
  onRecoveryComplete
}) => {
  const [isAbandoned, setIsAbandoned] = useState(cartStatus === 'abandoned');
  const [loading, setLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryHistoryItem[]>([]);
  const [recoveryStats, setRecoveryStats] = useState<RecoveryStats>({
    recoveryCount: 0,
    lastRecoveryAt: null
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [shareLinkExpiry, setShareLinkExpiry] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  
  // Share form state
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [sendEmail, setSendEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [recoveryNotes, setRecoveryNotes] = useState('');

  const translations = {
    en: {
      recoverCart: 'Recover Cart',
      recovering: 'Recovering...',
      recoverSuccess: 'Cart recovered successfully!',
      recoverError: 'Failed to recover cart',
      shareCart: 'Share Cart',
      generateShareLink: 'Generate Share Link',
      generateLink: 'Generate Link',
      generateRecoveryToken: 'Generate Recovery Token',
      sendNotification: 'Send Recovery Email',
      sending: 'Sending...',
      notificationSent: 'Notification sent!',
      notificationError: 'Failed to send notification',
      recoveryHistory: 'Recovery History',
      noHistory: 'No recovery history',
      recoveryCount: 'Recovery Count',
      lastRecovery: 'Last Recovery',
      neverRecovered: 'Never recovered',
      expiresAt: 'Expires At',
      linkCopied: 'Link copied to clipboard!',
      shareWithCustomer: 'Share with Customer',
      shareOptions: 'Share Options',
      linkExpiry: 'Link Expiry',
      days: 'days',
      includeEmail: 'Send Email Notification',
      recipientEmail: 'Recipient Email',
      customMessage: 'Custom Message (optional)',
      notes: 'Recovery Notes (optional)',
      notesPlaceholder: 'Add notes about this recovery...',
      messagePlaceholder: 'Add a personal message for the customer...',
      emailPlaceholder: 'customer@example.com',
      invalidEmail: 'Please enter a valid email',
      shareLink: 'Share Link',
      recoveryLink: 'Recovery Link',
      copyLink: 'Copy Link',
      openLink: 'Open Link',
      recoveryAttempts: 'Recovery Attempts',
      maxAttempts: 'Max Attempts',
      statusAbandoned: 'This cart is abandoned and can be recovered.',
      statusActive: 'This cart is already active.',
      shareCartDescription: 'Generate a shareable link to send to the customer.',
      recoveryDisabled: 'Recovery is only available for abandoned carts.'
    },
    bn: {
      recoverCart: 'কার্ট পুনরুদ্ধার করুন',
      recovering: 'পুনরুদ্ধার হচ্ছে...',
      recoverSuccess: 'কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে!',
      recoverError: 'কার্ট পুনরুদ্ধার করতে ব্যর্থ',
      shareCart: 'কার্ট শেয়ার করুন',
      generateShareLink: 'শেয়ার লিংক তৈরি করুন',
      generateLink: 'লিংক তৈরি করুন',
      generateRecoveryToken: 'পুনরুদ্ধার টোকেন তৈরি করুন',
      sendNotification: 'পুনরুদ্ধার ইমেইল পাঠান',
      sending: 'পাঠানো হচ্ছে...',
      notificationSent: 'বিজ্ঞপ্তি পাঠানো হয়েছে!',
      notificationError: 'বিজ্ঞপ্তি পাঠাতে ব্যর্থ',
      recoveryHistory: 'পুনরুদ্ধার ইতিহাস',
      noHistory: 'কোনো পুনরুদ্ধার ইতিহাস নেই',
      recoveryCount: 'পুনরুদ্ধার সংখ্যা',
      lastRecovery: 'শেষ পুনরুদ্ধার',
      neverRecovered: 'কখনো পুনরুদ্ধার করা হয়নি',
      expiresAt: 'মেয়াদ শেষ',
      linkCopied: 'লিংক ক্লিপবোর্ডে কপি করা হয়েছে!',
      shareWithCustomer: 'গ্রাহকের সাথে শেয়ার করুন',
      shareOptions: 'শেয়ার অপশন',
      linkExpiry: 'লিংক মেয়াদ',
      days: 'দিন',
      includeEmail: 'ইমেইল বিজ্ঞপ্তি পাঠান',
      recipientEmail: 'প্রাপকের ইমেইল',
      customMessage: 'কাস্টম মেসেজ (ঐচ্ছিক)',
      notes: 'পুনরুদ্ধার নোট (ঐচ্ছিক)',
      notesPlaceholder: 'এই পুনরুদ্ধার সম্পর্কে নোট যোগ করুন...',
      messagePlaceholder: 'গ্রাহকের জন্য একটি ব্যক্তিগত বার্তা যোগ করুন...',
      emailPlaceholder: 'customer@example.com',
      invalidEmail: 'অনুগ্রহ করে একটি বৈধ ইমেইল লিখুন',
      shareLink: 'শেয়ার লিংক',
      recoveryLink: 'পুনরুদ্ধার লিংক',
      copyLink: 'লিংক কপি করুন',
      openLink: 'লিংক খুলুন',
      recoveryAttempts: 'পুনরুদ্ধার প্রচেষ্টা',
      maxAttempts: 'সর্বোচ্চ প্রচেষ্টা',
      statusAbandoned: 'এই কার্টটি পরিত্যক্ত এবং এটি পুনরুদ্ধার করা যেতে পারে।',
      statusActive: 'এই কার্টটি ইতিমধ্যে সক্রিয়।',
      shareCartDescription: 'গ্রাহকের কাছে পাঠানোর জন্য একটি শেয়ারযোগ্য লিংক তৈরি করুন।',
      recoveryDisabled: 'পুনরুদ্ধার শুধুমাত্র পরিত্যক্ত কার্টের জন্য উপলব্ধ।'
    }
  };

  const t = translations[language];

  useEffect(() => {
    setIsAbandoned(cartStatus === 'abandoned');
    if (isAbandoned) {
      fetchRecoveryHistory();
    }
  }, [cartId, cartStatus]);

  const fetchRecoveryHistory = async () => {
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/recovery-history`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecoveryHistory(data.data.history || []);
          setRecoveryStats({
            recoveryCount: data.data.recoveryCount || 0,
            lastRecoveryAt: data.data.lastRecoveryAt
          });
        }
      }
    } catch (error) {
      console.error('Error fetching recovery history:', error);
    }
  };

  const handleRecoverCart = async () => {
    if (!confirm(language === 'bn' ? 'আপনি কি এই কার্টটি পুনরুদ্ধার করতে চান?' : 'Are you sure you want to recover this cart?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifyUser: sendEmail && recipientEmail,
          emailTemplate: 'cart_recovery',
          notes: recoveryNotes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(t.recoverSuccess);
        setIsAbandoned(false);
        if (onRecoveryComplete) {
          onRecoveryComplete();
        }
        fetchRecoveryHistory();
      } else {
        alert(data.error || t.recoverError);
      }
    } catch (error) {
      console.error('Error recovering cart:', error);
      alert(t.recoverError);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/generate-share-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expiresInDays,
          sendEmail,
          recipientEmail: sendEmail ? recipientEmail : undefined,
          customMessage: sendEmail ? customMessage : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedLink(data.data.shareUrl);
        setShareLinkExpiry(data.data.expiresAt);
        if (data.data.emailSent) {
          setEmailSent(true);
        }
      } else {
        alert(data.error || 'Failed to generate share link');
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert(t.linkCopied);
    }
  };

  const handleSendNotification = async () => {
    if (!recipientEmail) {
      alert(t.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/carts/${cartId}/notify-recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailTemplate: 'cart_recovery'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(t.notificationSent);
        setEmailSent(true);
      } else {
        alert(data.error || t.notificationError);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(t.notificationError);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t.neverRecovered;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRecoveryDisabled = cartStatus !== 'abandoned';
  const maxRecoveryAttempts = 5;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isAbandoned ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <RefreshCw className={`w-5 h-5 ${isAbandoned ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{t.recoverCart}</h2>
          </div>
          {isAbandoned && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              {t.statusAbandoned}
            </span>
          )}
          {!isAbandoned && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t.statusActive}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recovery Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">{t.recoveryCount}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{recoveryStats.recoveryCount}</p>
            <p className="text-xs text-gray-500">{t.maxAttempts}: {maxRecoveryAttempts}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{t.lastRecovery}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{formatDate(recoveryStats.lastRecoveryAt)}</p>
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-4">
          {/* Recover Cart Button */}
          <button
            onClick={handleRecoverCart}
            disabled={isRecoveryDisabled || loading}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              isRecoveryDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {t.recovering}
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                {t.recoverCart}
              </>
            )}
          </button>

          {/* Share Cart Section */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShareDialogOpen(!shareDialogOpen)}
              className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-gray-600" />
                <span>{t.shareCart}</span>
              </div>
              {shareDialogOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {shareDialogOpen && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <p className="text-sm text-gray-600">{t.shareCartDescription}</p>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.linkExpiry}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">{t.days}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{t.includeEmail}</span>
                    </label>
                  </div>
                </div>

                {/* Email Fields */}
                {sendEmail && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.recipientEmail}
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.customMessage}
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder={t.messagePlaceholder}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Recovery Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.notes}
                  </label>
                  <textarea
                    value={recoveryNotes}
                    onChange={(e) => setRecoveryNotes(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateShareLink}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <LinkIcon className="w-5 h-5" />
                  {loading ? t.sending : t.generateLink}
                </button>

                {/* Generated Link Display */}
                {generatedLink && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t.shareLink}</span>
                      {shareLinkExpiry && (
                        <span className="text-xs text-gray-500">
                          {t.expiresAt}: {formatDate(shareLinkExpiry)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title={t.copyLink}
                      >
                        <Copy className="w-5 h-5 text-gray-600" />
                      </button>
                      <a
                        href={generatedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title={t.openLink}
                      >
                        <ExternalLink className="w-5 h-5 text-gray-600" />
                      </a>
                    </div>
                    {emailSent && (
                      <div className="mt-2 flex items-center gap-2 text-green-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{t.notificationSent}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recovery History */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              <span>{t.recoveryHistory}</span>
            </div>
            {historyExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {historyExpanded && (
            <div className="mt-4 space-y-3">
              {recoveryHistory.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {t.noHistory}
                </div>
              ) : (
                recoveryHistory.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-1.5 rounded-full ${
                      item.type.includes('recovered') ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {item.type.includes('recovered') ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {item.type?.replace(/_/g, ' ') || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.adminName || item.adminEmail || 'System'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartRecovery;
