/**
 * Export Comparison Component
 *
 * Component for exporting comparisons to PDF, Excel, CSV, or print view.
 */

'use client';

import { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, Printer, Check } from 'lucide-react';
import { ExportComparisonResponse } from '@/types/comparison';
import { exportComparison } from '@/lib/api/comparisons';

interface ExportComparisonProps {
  comparisonId: string;
  comparisonName: string;
  onExported?: (exportData: ExportComparisonResponse) => void;
  className?: string;
}

export function ExportComparison({
  comparisonId,
  comparisonName,
  onExported,
  className = '',
}: ExportComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [includePrices, setIncludePrices] = useState(true);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await exportComparison(comparisonId, {
        format: selectedFormat,
        includeImages,
        includeSpecs,
        includePrices,
      });

      // Download the file
      if (response.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = `${comparisonName.replace(/\s+/g, '_')}_comparison.${selectedFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      onExported?.(response);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to export comparison');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors ${className}`}
        aria-label="Export comparison"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
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
            Export Comparison
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
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  selectedFormat === 'pdf'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label="Export as PDF"
              >
                <FileText className="w-6 h-6 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">PDF</span>
              </button>
              <button
                onClick={() => setSelectedFormat('excel')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  selectedFormat === 'excel'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label="Export as Excel"
              >
                <FileSpreadsheet className="w-6 h-6 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Excel</span>
              </button>
              <button
                onClick={() => setSelectedFormat('csv')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                  selectedFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label="Export as CSV"
              >
                <FileSpreadsheet className="w-6 h-6 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">CSV</span>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include in Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  aria-label="Include images"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Product Images</span>
                  <p className="text-xs text-gray-500">Include product images in the export</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpecs}
                  onChange={(e) => setIncludeSpecs(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  aria-label="Include specifications"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Specifications</span>
                  <p className="text-xs text-gray-500">Include product specifications table</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrices}
                  onChange={(e) => setIncludePrices(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  aria-label="Include prices"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Price Comparison</span>
                  <p className="text-xs text-gray-500">Include price comparison table</p>
                </div>
              </label>
            </div>
          </div>

          {/* Print Option */}
          <div className="mb-6">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Print comparison"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print Comparison</span>
            </button>
          </div>

          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Format Information:</strong>
              <ul className="mt-1 space-y-1 ml-4 list-disc">
                <li><strong>PDF:</strong> Best for printing and sharing as document</li>
                <li><strong>Excel:</strong> Best for data analysis and editing</li>
                <li><strong>CSV:</strong> Best for importing into other applications</li>
              </ul>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportComparison;
