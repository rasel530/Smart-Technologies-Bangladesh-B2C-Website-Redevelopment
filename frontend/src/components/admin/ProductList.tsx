'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductWithRelations, ProductStatus, ProductVisibility } from '@/types/product';
import productsApi from '@/lib/api/products';
import { getImageUrl } from '@/lib/api/product-images';

interface ProductListProps {
  initialProducts?: ProductWithRelations[];
}

const ProductList: React.FC<ProductListProps> = ({ initialProducts = [] }) => {
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('');
  const [hasImagesFilter, setHasImagesFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter, visibilityFilter, hasImagesFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[ProductList] Fetching products with filters:', {
        page,
        limit: 20,
        status: statusFilter,
        search: search || undefined,
      });
      
      const result = await productsApi.getAll({
        page,
        limit: 20,
        status: statusFilter as ProductStatus,
        search: search || undefined,
      });
      
      console.log('[ProductList] Products fetched successfully:', {
        count: result.products.length,
        totalPages: result.pagination.pages,
        total: result.pagination.total,
      });
      
      // Log the first product to check data types
      if (result.products.length > 0) {
        console.log('[ProductList] First product data:', {
          id: result.products[0].id,
          name: result.products[0].name,
          regularPrice: result.products[0].regularPrice,
          regularPriceType: typeof result.products[0].regularPrice,
          salePrice: result.products[0].salePrice,
          salePriceType: typeof result.products[0].salePrice,
        });
      }
      
      setProducts(result.products);
      setTotalPages(result.pagination.pages);
    } catch (error: any) {
      console.error('[ProductList] Error fetching products:', error);
      
      // Extract error message for display
      let errorMessage = 'Failed to load products. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for authentication errors
      if (error?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
        console.warn('[ProductList] Authentication error detected');
      } else if (error?.status === 403) {
        errorMessage = 'You do not have permission to view products.';
        console.warn('[ProductList] Authorization error detected');
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
        console.error('[ProductList] Server error detected');
      }
      
      setError(errorMessage);
      setProducts([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleStatusChange = (productId: string, newStatus: ProductStatus) => {
    productsApi.updateProductStatus(productId, newStatus)
      .then(() => {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, status: newStatus } : p
        ));
      })
      .catch(error => console.error('Error updating status:', error));
  };

  const handleVisibilityChange = (productId: string, newVisibility: ProductVisibility) => {
    productsApi.updateVisibility(productId, newVisibility)
      .then(() => {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, visibility: newVisibility } : p
        ));
      })
      .catch(error => console.error('Error updating visibility:', error));
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsApi.delete(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const colors: Record<ProductStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-orange-100 text-orange-800',
      discontinued: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: ProductVisibility) => {
    const colors: Record<ProductVisibility, string> = {
      public: 'bg-green-100 text-green-800',
      private: 'bg-red-100 text-red-800',
      restricted: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[visibility]}`}>
        {visibility.toUpperCase()}
      </span>
    );
  };

  // Helper function to safely format price values
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) {
      return '0.00';
    }
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    // Check if conversion resulted in a valid number
    if (isNaN(numPrice)) {
      console.warn('[ProductList] Invalid price value:', price);
      return '0.00';
    }
    return numPrice.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="restricted">Restricted</option>
          </select>
          <select
            value={hasImagesFilter}
            onChange={(e) => setHasImagesFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Products</option>
            <option value="yes">With Images</option>
            <option value="no">Without Images</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => fetchProducts()}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.images[0] && (
                        <img
                          src={getImageUrl(product.images[0], 'thumbnail')}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.categories?.[0]?.category?.name || 'No category'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ৳{formatPrice(product.regularPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stockQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVisibilityBadge(product.visibility)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {product.images?.length || 0}
                      </span>
                      {product.images && product.images.length > 0 && (
                        <Link
                          href={`/admin/products/${product.id}/images`}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
