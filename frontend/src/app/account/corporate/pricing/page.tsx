'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CorporatePricingAPI } from '@/lib/api/corporate';
import { CorporateProduct } from '@/types/corporate';
import { useCorporateAccount } from '@/hooks/useCorporateAccount';
import {
  Package,
  Search,
  Filter,
  TrendingUp,
  ShoppingCart,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CorporatePricingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { accountId, isLoading: accountLoading, error: accountError } = useCorporateAccount();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CorporateProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    console.log('[PricingPage] fetchData called', { accountId, isLoading });
    
    if (!accountId) {
      console.log('[PricingPage] No accountId, returning early');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[PricingPage] Fetching products and categories for accountId:', accountId);
      const [productsData, categoriesData] = await Promise.all([
        CorporatePricingAPI.getProducts(accountId),
        CorporatePricingAPI.getCategories(),
      ]);

      console.log('[PricingPage] API responses received:', {
        productsData,
        categoriesData,
        productsDataType: typeof productsData,
        hasProductsProperty: 'products' in (productsData || {}),
        productsIsArray: Array.isArray(productsData?.products)
      });

      if (productsData && productsData.products && Array.isArray(productsData.products)) {
        console.log('[PricingPage] Setting products:', productsData.products.length, 'items');
        setProducts(productsData.products);
      } else {
        console.error('[PricingPage] Unexpected API response structure:', productsData);
        setProducts([]);
      }
      
      console.log('[PricingPage] Setting categories:', categoriesData);
      console.log('[PricingPage] Categories data type:', typeof categoriesData);
      console.log('[PricingPage] Categories is array:', Array.isArray(categoriesData));
      console.log('[PricingPage] Categories length:', categoriesData?.length);
      console.log('[PricingPage] First category:', categoriesData?.[0]);
      console.log('[PricingPage] First category type:', typeof categoriesData?.[0]);
      // Extract category names from API response
      // API client already unwraps response, so categoriesData is an array of objects
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
      const categoryNames = categoriesArray.map((cat: any) => cat.name);
      console.log('[PricingPage] Extracted category names:', categoryNames);
      console.log('[PricingPage] Category names type:', typeof categoryNames);
      console.log('[PricingPage] Category names is array:', Array.isArray(categoryNames));
      setCategories(categoryNames);
    } catch (err: any) {
      console.error('[PricingPage] Error fetching data:', err);
      setError(err.message || (language === 'en' ? 'Failed to load products' : 'পণডাক্ট লোড করতে হয়নি।'));
    } finally {
      console.log('[PricingPage] Fetch complete, setting isLoading to false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchTerm.trim() === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || 
        product.category.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm('');
  };

  const handleAddToPO = (product: CorporateProduct) => {
    router.push('/account/corporate/purchase-orders?action=create&productId=' + product.id);
  };

  console.log('[PricingPage] Rendering check:', { 
    user: !!user, 
    accountLoading, 
    accountError, 
    isLoading, 
    error,
    accountId 
  });

  if (!user || accountLoading) {
    console.log('[PricingPage] Rendering loading state (user or account loading)');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (accountError !== null) {
    console.log('[PricingPage] Rendering account error state:', accountError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Error' : 'ভুল'}
          </h2>
          <p className="text-gray-600">{accountError}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {language === 'en' ? 'Retry' : 'পুনরাত'}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading === true) {
    console.log('[PricingPage] Rendering API loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error !== null) {
    console.log('[PricingPage] Rendering API error state:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Error' : 'ভুল'}
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {language === 'en' ? 'Retry' : 'পুনরাত'}
          </button>
        </div>
      </div>
    );
  }

  console.log('[PricingPage] Rendering main content with', products.length, 'products');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Corporate Pricing' : 'কর্পোরেট মূল্য'}
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
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full md:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'en' ? 'Search products...' : 'পণডাক্ট অনুজান...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Filter by:' : 'ফিল্টার করুন:'}
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">{language === 'en' ? 'All Categories' : 'সবর ক্যাগরি'}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600">
              {language === 'en' ? 'No products found' : 'কোন পণডাক্ট পাওয়নি'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  {(product.corporatePricing?.discountPercent || 0) > 0 && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {product.corporatePricing?.discountPercent || 0}% OFF
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      {product.category.name}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ৳{(product.corporatePricing?.specialPrice !== null && product.corporatePricing?.specialPrice !== undefined ? product.corporatePricing.specialPrice : product.salePrice) !== null && (product.corporatePricing?.specialPrice !== null && product.corporatePricing?.specialPrice !== undefined ? product.corporatePricing.specialPrice : product.salePrice) !== undefined ? (product.corporatePricing?.specialPrice !== null && product.corporatePricing?.specialPrice !== undefined ? product.corporatePricing.specialPrice : product.salePrice).toLocaleString('en-BD') : '0'}
                      </p>
                      <p className="text-sm text-gray-500 line-through">
                        ৳{product.regularPrice !== null && product.regularPrice !== undefined ? product.regularPrice.toLocaleString('en-BD') : '0'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 font-semibold">
                        {product.corporatePricing?.discountPercent || 0}% OFF
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddToPO(product)}
                      className="flex flex-1 items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'en' ? 'Add to PO' : 'পিওতে যোগ করুন'}
                      </span>
                    </button>
                    <button
                      onClick={() => router.push('/account/corporate/purchase-orders')}
                      className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      <span className="font-medium">
                        {language === 'en' ? 'View Details' : 'বিস্তারয়'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporatePricingPage;
