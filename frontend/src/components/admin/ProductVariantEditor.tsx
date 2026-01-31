'use client';

import React, { useState } from 'react';
import { ProductVariant } from '@/types/product';
import productsApi from '@/lib/api/products';

const getSafePrice = (price: number | string | null | undefined, defaultValue: number = 0): number => {
  if (price === null || price === undefined) return defaultValue;
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? defaultValue : numPrice;
};

interface ProductVariantEditorProps {
  productId: string;
  variants: ProductVariant[];
  onUpdate: () => void;
}

const ProductVariantEditor: React.FC<ProductVariantEditorProps> = ({
  productId,
  variants,
  onUpdate,
}) => {
  const [newVariant, setNewVariant] = useState({
    name: '',
    sku: '',
    price: 0,
    comparePrice: 0,
    stock: 0,
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    sku: '',
    price: 0,
    comparePrice: 0,
    stock: 0,
    isActive: true,
  });
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.name || !newVariant.sku || newVariant.price <= 0) return;

    setAdding(true);
    try {
      await productsApi.createVariant(productId, newVariant);
      setNewVariant({
        name: '',
        sku: '',
        price: 0,
        comparePrice: 0,
        stock: 0,
        isActive: true,
      });
      onUpdate();
    } catch (error) {
      console.error('Error adding variant:', error);
      alert('Failed to add variant');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setEditData({
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      comparePrice: variant.comparePrice || 0,
      stock: variant.stock,
      isActive: variant.isActive,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await productsApi.updateVariant(productId, editingId, editData);
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating variant:', error);
      alert('Failed to update variant');
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await productsApi.deleteVariant(productId, variantId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Failed to delete variant');
    }
  };

  const handleToggleActive = async (variantId: string, isActive: boolean) => {
    try {
      await productsApi.updateVariant(productId, variantId, { isActive });
      onUpdate();
    } catch (error) {
      console.error('Error toggling variant status:', error);
      alert('Failed to update variant status');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({
      name: '',
      sku: '',
      price: 0,
      comparePrice: 0,
      stock: 0,
      isActive: true,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h2>

      {/* Add New Variant */}
      <form onSubmit={handleAdd} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Variant Name"
            value={newVariant.name}
            onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="SKU"
            value={newVariant.sku}
            onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">৳</span>
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newVariant.price}
              onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })}
              className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">৳</span>
            <input
              type="number"
              step="0.01"
              placeholder="Compare Price"
              value={newVariant.comparePrice}
              onChange={(e) => setNewVariant({ ...newVariant, comparePrice: parseFloat(e.target.value) })}
              className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="number"
            placeholder="Stock"
            value={newVariant.stock}
            onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add Variant'}
          </button>
        </div>
      </form>

      {/* Variants List */}
      {variants.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No variants added yet</p>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === variant.id ? (
                <form onSubmit={handleUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={editData.sku}
                      onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.price}
                        onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                        className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.comparePrice}
                        onChange={(e) => setEditData({ ...editData, comparePrice: parseFloat(e.target.value) })}
                        className="w-full pl-8 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="number"
                      value={editData.stock}
                      onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) })}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{variant.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">SKU:</span>
                      <p className="text-gray-900">{variant.sku}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Price:</span>
                      <p className="text-gray-900">৳{getSafePrice(variant.price).toFixed(2)}</p>
                      {variant.comparePrice && (
                        <p className="text-sm text-gray-500 line-through">
                          ৳{getSafePrice(variant.comparePrice)?.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Stock:</span>
                      <p className="text-gray-900">{variant.stock}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleToggleActive(variant.id, !variant.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        variant.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {variant.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleEdit(variant)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductVariantEditor;
