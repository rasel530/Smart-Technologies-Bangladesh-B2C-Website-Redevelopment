'use client';

/**
 * WishlistTable Component
 *
 * A table component for displaying wishlists with sorting, filtering, pagination, and bulk actions
 */

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WishlistWithUser } from '@/lib/api/adminWishlist';

interface WishlistTableProps {
  wishlists: WishlistWithUser[];
  onEdit?: (wishlist: WishlistWithUser) => void;
  onDelete?: (wishlistId: string) => void;
  onView?: (wishlist: WishlistWithUser) => void;
  onExport?: (wishlist: WishlistWithUser) => void;
  isLoading?: boolean;
  className?: string;
}

type SortField = 'createdAt' | 'updatedAt' | 'name' | 'items';
type SortOrder = 'asc' | 'desc';

const WishlistTable: React.FC<WishlistTableProps> = ({
  wishlists,
  onEdit,
  onDelete,
  onView,
  onExport,
  isLoading = false,
  className
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedWishlists, setSelectedWishlists] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  /**
   * Handle sort
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  /**
   * Handle select all
   */
  const handleSelectAll = () => {
    if (selectedWishlists.size === wishlists.length) {
      setSelectedWishlists(new Set());
    } else {
      setSelectedWishlists(new Set(wishlists.filter(w => w != null && w.id != null).map(w => w.id)));
    }
  };

  /**
   * Handle select wishlist
   */
  const handleSelectWishlist = (wishlistId: string) => {
    const newSelected = new Set(selectedWishlists);
    if (newSelected.has(wishlistId)) {
      newSelected.delete(wishlistId);
    } else {
      newSelected.add(wishlistId);
    }
    setSelectedWishlists(newSelected);
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    if (onDelete) {
      selectedWishlists.forEach(id => onDelete(id));
      setSelectedWishlists(new Set());
    }
  };

  /**
   * Get sorted wishlists
   */
  const getSortedWishlists = () => {
    return [...wishlists]
      .filter((wishlist) => wishlist != null && wishlist.id != null)
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'items':
            comparison = a._count.items - b._count.items;
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  };

  const sortedWishlists = getSortedWishlists();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-pink-600"></div>
      </div>
    );
  }

  if (wishlists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No wishlists found</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Bulk Actions Bar */}
      {selectedWishlists.size > 0 && (
        <div className="mb-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-pink-800 dark:text-pink-200">
              {selectedWishlists.size} wishlist{selectedWishlists.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              {onExport && (
                <button
                  type="button"
                  onClick={() => {
                    const selected = wishlists.filter(w => selectedWishlists.has(w.id));
                    selected.forEach(w => onExport(w));
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedWishlists.size === wishlists.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('items')}
              >
                <div className="flex items-center gap-1">
                  Items
                  {sortField === 'items' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Privacy
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Created
                  {sortField === 'createdAt' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center gap-1">
                  Updated
                  {sortField === 'updatedAt' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedWishlists.map((wishlist) => (
              <tr key={wishlist.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedWishlists.has(wishlist.id)}
                    onChange={() => handleSelectWishlist(wishlist.id)}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {wishlist.name || 'My Wishlist'}
                  </div>
                  {wishlist.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {wishlist.user?.firstName || wishlist.user?.lastName
                      ? `${wishlist.user?.firstName || ''} ${wishlist.user?.lastName || ''}`.trim()
                      : wishlist.user?.email || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {wishlist.user?.email || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {wishlist._count.items}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    wishlist.isPublic
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  )}>
                    {wishlist.isPublic ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(wishlist.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(wishlist.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(menuOpen === wishlist.id ? null : wishlist.id)}
                      className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuOpen === wishlist.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => {
                              onView(wishlist);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              onEdit(wishlist);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Edit
                          </button>
                        )}
                        {onExport && (
                          <button
                            type="button"
                            onClick={() => {
                              onExport(wishlist);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this wishlist?')) {
                                onDelete(wishlist.id);
                                setMenuOpen(null);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WishlistTable;
