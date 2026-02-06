/**
 * Share Comparison Component
 *
 * Component for sharing comparisons via link, social media, email, and QR code.
 */

'use client';

import { useState } from 'react';
import { X, Link as LinkIcon, Copy, Check, Facebook, Twitter, Mail, QrCode } from 'lucide-react';
import { ShareComparisonResponse } from '@/types/comparison';
import { shareComparison } from '@/lib/api/comparisons';

interface ShareComparisonProps {
  comparisonId: string;
  comparisonName: string;
  onShared?: (shareData: ShareComparisonResponse) => void;
  className?: string;
}

export function ShareComparison({
  comparisonId,
  comparisonName,
  onShared,
  className = '',
}: ShareComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareComparisonResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    generateShareLink();
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setShareData(null);
    setCopied(false);
  };

  const generateShareLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await shareComparison(comparisonId, { expiresIn: 7 * 24 * 60 * 60 }); // 7 days
      setShareData(response);
      onShared?.(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData) return;

    try {
      // BUG-MED-004: No error handling for clipboard operations - Added proper error handling
      await navigator.clipboard.writeText(shareData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy link to clipboard. Please try again.');
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'whatsapp' | 'email') => {
    if (!shareData) return;

    const url = encodeURIComponent(shareData.shareUrl);
    const text = encodeURIComponent(`Check out this product comparison: ${comparisonName}`);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(comparisonName)}&body=${text}%20${url}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleGenerateQRCode = () => {
    if (!shareData) return;

    // Open QR code generator with the share URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareData.shareUrl)}`;
    window.open(qrUrl, '_blank');
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${className}`}
        aria-label="Share comparison"
      >
        <LinkIcon className="w-4 h-4" />
        <span>Share</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            Share Comparison
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Generating share link...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={generateShareLink}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Share Link */}
          {shareData && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareData.shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                    aria-label="Share link"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    aria-label="Copy link to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {shareData.expiresAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {new Date(shareData.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Social Sharing */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share on Social Media
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSocialShare('facebook')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="text-sm font-medium">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleSocialShare('twitter')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="text-sm font-medium">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleSocialShare('whatsapp')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    aria-label="Share on WhatsApp"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.149.672-.582.822-.816.297-.297.497-.614.614-.921.099-.297.149-.614.149-.921 0-.796-.614-1.718-1.718-1.718-.796 0-1.472.297-2.019.894-.547.597-.822 1.319-.822 2.24 0 1.219.614 2.24 1.718 2.24.547 0 .996-.149 1.472-.446.476-.297.822-.796.996-1.472.149-.796.223-1.618.223-2.44 0-1.718-.822-2.24-1.718-2.24-.547 0-.996.149-1.472.446-.476.297-.822.796-.996 1.472-.149.796-.223 1.618-.223 2.44 0 1.718.822 2.24 1.718 2.24.547 0 .996-.149 1.472-.446.476-.297.822-.796.996-1.472.149-.796.223-1.618.223-2.44 0-1.718-.822-2.24-1.718-2.24-.547 0-.996.149-1.472.446-.476.297-.822.796-.996 1.472-.149.796-.223 1.618-.223 2.44 0 1.718.822 2.24 1.718 2.24z" />
                    </svg>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleSocialShare('email')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    aria-label="Share via email"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="text-sm font-medium">Email</span>
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <button
                  onClick={handleGenerateQRCode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  aria-label="Generate QR code"
                >
                  <QrCode className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Generate QR Code</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Scan the QR code to open this comparison on your mobile device
                </p>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Share links expire in 7 days. Anyone with the link can view this comparison.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareComparison;
