'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandWithRelations, BrandStatus } from '@/types/brand';
import brandsApi from '@/lib/api/brands';

interface BrandListProps {
  initialBrands?: BrandWithRelations[];
}

/**
 * Admin BrandList Component
 * 
 * Displays a table/list view of all brands for admin with:
 * - Search and filter
 * - Actions: edit, delete, toggle featured, change status
 * - Featured badge indicator
 * - Status badge indicator
 * - Pagination
 */
export default function BrandList({ initialBrands = [] }: BrandListProps) {
  const [brands, setBrands] = useState<BrandWithRelations[]>(initialBrands);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBrands();
  }, [page, statusFilter, featuredFilter]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const result = await brandsApi.getBrands({
        page,
        limit: 20,
        status: statusFilter as BrandStatus || undefined,
        isFeatured: featuredFilter === 'featured' ? true : featuredFilter === 'not-featured' ? false : undefined,
        search: search || undefined
      });
      setBrands(result.brands);
      setTotalPages(result.pagination.pages);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBrands();
  };

  const handleStatusChange = (brandId: string, newStatus: BrandStatus) => {
    brandsApi.updateBrandStatus(brandId, newStatus)
      .then(() => {
        setBrands(brands.map(b => 
          b.id === brandId ? { ...b, status: newStatus } : b
        ));
      })
      .catch(error => console.error('Error updating status:', error));
  };

  const handleToggleFeatured = (brandId: string, isFeatured: boolean) => {
    brandsApi.toggleBrandFeatured(brandId, isFeatured)
      .then(() => {
        setBrands(brands.map(b => 
          b.id === brandId ? { ...b, isFeatured } : b
        ));
      })
      .catch(error => console.error('Error toggling featured:', error));
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) return;
    
    try {
      await brandsApi.deleteBrand(brandId);
      setBrands(brands.filter(b => b.id !== brandId));
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Failed to delete brand');
    }
  };

  const getStatusBadge = (status: BrandStatus) => {
    const colors: Record<BrandStatus, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
        <Link
          href="/admin/brands/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Brand
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Brands</option>
            <option value="featured">Featured Only</option>
            <option value="not-featured">Not Featured</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Brands</p>
          <p className="text-3xl font-bold text-gray-900">{brands.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Active Brands</p>
          <p className="text-3xl font-bold text-green-600">
            {brands.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Featured Brands</p>
          <p className="text-3xl font-bold text-yellow-600">
            {brands.filter(b => b.isFeatured).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-3xl font-bold text-blue-600">
            {brands.reduce((sum, b) => sum + (b._count?.products || 0), 0)}
          </p>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No brands found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {brand.logoUrl && (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                        {brand.nameEn && (
                          <div className="text-xs text-gray-500">{brand.nameEn}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {brand.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(brand.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {brand.isFeatured ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {brand._count?.products || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {brand.featuredOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/brands/${brand.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleFeatured(brand.id, !brand.isFeatured)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title={brand.isFeatured ? 'Remove from featured' : 'Add to featured'}
                      >
                        {brand.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(brand.id, brand.status === 'active' ? 'inactive' : 'active')}
                        className={brand.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={brand.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {brand.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
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
}
