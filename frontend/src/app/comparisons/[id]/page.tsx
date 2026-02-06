/**
 * Comparison Detail Page
 *
 * Page for viewing a detailed comparison between products.
 * Features: side-by-side comparison, specifications, prices, images, summary, share, export.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { ComparisonData } from '@/types/comparison';
import { getComparison, getComparisonData, deleteComparison } from '@/lib/api/comparisons';
import { ProductComparisonCard } from '@/components/comparisons/ProductComparisonCard';
import { SpecComparisonTable } from '@/components/comparisons/SpecComparisonTable';
import { PriceComparison } from '@/components/comparisons/PriceComparison';
import { ImageComparison } from '@/components/comparisons/ImageComparison';
import { ComparisonSummary } from '@/components/comparisons/ComparisonSummary';
import { ShareComparison } from '@/components/comparisons/ShareComparison';
import { ExportComparison } from '@/components/comparisons/ExportComparison';
import { AddToWishlist } from '@/components/comparisons/AddToWishlist';

function ComparisonDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const comparisonId = params.id as string;

  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'specs' | 'prices' | 'images'>('summary');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch comparison data
  useEffect(() => {
    fetchComparisonData();
  }, [comparisonId]);

  const fetchComparisonData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getComparisonData(comparisonId);
      setComparisonData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load comparison');
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete comparison
  const handleDelete = async () => {
    try {
      await deleteComparison(comparisonId);
      router.push('/comparisons');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete comparison');
    }
  };

  // Handle share
  const handleShared = () => {
    // Share completed
  };

  // Handle export
  const handleExported = () => {
    // Export completed
  };

  // Handle wishlist add
  const handleWishlistAdded = () => {
    // Wishlist add completed
  };

  // Get product names map
  const productNames = comparisonData
    ? comparisonData.products.reduce((acc, product) => {
        acc[product.id] = product.name;
        return acc;
      }, {} as { [productId: string]: string })
    : {};

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !comparisonData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Comparison Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The comparison you are looking for does not exist or has been deleted.'}
          </p>
          <Link
            href="/comparisons"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Comparisons
          </Link>
        </div>
      </div>
    );
  }

  const { comparison, products, specifications, prices, images } = comparisonData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/comparisons" className="hover:text-blue-600 transition-colors">
              Comparisons
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-900 line-clamp-1">
              {comparison.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <Link href="/comparisons" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Comparisons
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{comparison.name}</h1>
              <p className="text-sm text-gray-600">
                {comparison.itemCount} products • Updated on {new Date(comparison.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShareComparison
                comparisonId={comparison.id}
                comparisonName={comparison.name}
                onShared={handleShared}
              />
              <ExportComparison
                comparisonId={comparison.id}
                comparisonName={comparison.name}
                onExported={handleExported}
              />
              <AddToWishlist
                comparisonProducts={products}
                comparisonName={comparison.name}
                onAdded={handleWishlistAdded}
              />
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                aria-label="Delete comparison"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto" role="tablist">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              role="tab"
              aria-selected={activeTab === 'summary'}
              aria-controls="summary-panel"
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'specs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              role="tab"
              aria-selected={activeTab === 'specs'}
              aria-controls="specs-panel"
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'prices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              role="tab"
              aria-selected={activeTab === 'prices'}
              aria-controls="prices-panel"
            >
              Prices
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'images'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              role="tab"
              aria-selected={activeTab === 'images'}
              aria-controls="images-panel"
            >
              Images
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div id="summary-panel" role="tabpanel" aria-labelledby="summary-tab">
            <div className="space-y-8">
              {/* Comparison Summary */}
              <ComparisonSummary comparisonData={comparisonData} />

              {/* Product Cards */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Products in Comparison</h2>
                <div
                  className={`grid gap-6 ${
                    products.length === 1
                      ? 'grid-cols-1'
                      : products.length === 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : products.length === 3
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {products.map((product) => {
                    const priceData = prices.products.find((p) => p.productId === product.id);
                    return (
                      <ProductComparisonCard
                        key={product.id}
                        product={product}
                        isCheapest={priceData?.isCheapest}
                        isMostExpensive={priceData?.isMostExpensive}
                        highlightBest={comparisonData.differences.bestValueRecommendation?.productId === product.id}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specs' && (
          <div id="specs-panel" role="tabpanel" aria-labelledby="specs-tab">
            <SpecComparisonTable
              specifications={specifications}
              productIds={products.map((p) => p.id)}
              productNames={productNames}
            />
          </div>
        )}

        {/* Prices Tab */}
        {activeTab === 'prices' && (
          <div id="prices-panel" role="tabpanel" aria-labelledby="prices-tab">
            <PriceComparison prices={prices} productNames={productNames} />
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div id="images-panel" role="tabpanel" aria-labelledby="images-tab">
            <ImageComparison images={images} productNames={productNames} />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2
                id="delete-modal-title"
                className="text-xl font-semibold text-gray-900 mb-2"
              >
                Delete Comparison?
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{comparison.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparisonDetailPage() {
  return <ComparisonDetailPageContent />;
}
