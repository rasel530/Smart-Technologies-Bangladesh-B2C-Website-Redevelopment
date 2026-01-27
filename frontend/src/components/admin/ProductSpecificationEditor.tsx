'use client';

import React, { useState } from 'react';
import { ProductSpecification } from '@/types/product';
import productsApi from '@/lib/api/products';

interface ProductSpecificationEditorProps {
  productId: string;
  specifications: ProductSpecification[];
  onUpdate: () => void;
}

const ProductSpecificationEditor: React.FC<ProductSpecificationEditorProps> = ({
  productId,
  specifications,
  onUpdate,
}) => {
  const [newSpec, setNewSpec] = useState({ name: '', value: '', sortOrder: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', value: '', sortOrder: 0 });
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpec.name || !newSpec.value) return;

    setAdding(true);
    try {
      await productsApi.createSpecification(productId, newSpec);
      setNewSpec({ name: '', value: '', sortOrder: 0 });
      onUpdate();
    } catch (error) {
      console.error('Error adding specification:', error);
      alert('Failed to add specification');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (spec: ProductSpecification) => {
    setEditingId(spec.id);
    setEditData({
      name: spec.name,
      value: spec.value,
      sortOrder: spec.sortOrder,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await productsApi.updateSpecification(productId, editingId, editData);
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating specification:', error);
      alert('Failed to update specification');
    }
  };

  const handleDelete = async (specId: string) => {
    if (!confirm('Are you sure you want to delete this specification?')) return;

    try {
      await productsApi.deleteSpecification(productId, specId);
      onUpdate();
    } catch (error) {
      console.error('Error deleting specification:', error);
      alert('Failed to delete specification');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', value: '', sortOrder: 0 });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>

      {/* Add New Specification */}
      <form onSubmit={handleAdd} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Specification Name"
            value={newSpec.name}
            onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Value"
            value={newSpec.value}
            onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={newSpec.sortOrder}
            onChange={(e) => setNewSpec({ ...newSpec, sortOrder: parseInt(e.target.value) })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Specifications List */}
      {specifications.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No specifications added yet</p>
      ) : (
        <div className="space-y-3">
          {specifications
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((spec) => (
              <div key={spec.id} className="border border-gray-200 rounded-lg p-4">
                {editingId === spec.id ? (
                  <form onSubmit={handleUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={editData.value}
                        onChange={(e) => setEditData({ ...editData, value: e.target.value })}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={editData.sortOrder}
                        onChange={(e) => setEditData({ ...editData, sortOrder: parseInt(e.target.value) })}
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
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{spec.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Value:</span>
                        <p className="text-gray-900">{spec.value}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Sort Order:</span>
                        <p className="text-gray-900">{spec.sortOrder}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(spec)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(spec.id)}
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

export default ProductSpecificationEditor;
