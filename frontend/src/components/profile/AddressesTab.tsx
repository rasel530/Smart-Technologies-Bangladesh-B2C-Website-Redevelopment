'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { Address, AddressAPI } from '@/lib/api/profile';
import { useAuth } from '@/contexts/AuthContext';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';

interface AddressesTabProps {
  language: 'en' | 'bn';
}

const AddressesTab: React.FC<AddressesTabProps> = ({ language }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  const [operationLoading, setOperationLoading] = useState<{
    create: boolean;
    update: string | null;
    delete: string | null;
    setDefault: string | null;
  }>({
    create: false,
    update: null,
    delete: null,
    setDefault: null,
  });

  // Fetch addresses on component mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get userId from AuthContext user object
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;
      const response = await AddressAPI.getAddresses(userId);
      setAddresses(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message ||
        (language === 'en' ? 'Failed to load addresses' : 'ঠিকানা লোড করতে ব্যর্থ হয়েছে');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(undefined);
    setShowForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleFormSubmit = (address: Address) => {
    // Add or update address in the list
    if (editingAddress) {
      setAddresses(prev => prev.map(a => a.id === address.id ? address : a));
    } else {
      setAddresses(prev => [...prev, address]);
    }
    setShowForm(false);
    setEditingAddress(undefined);
    setOperationLoading({ create: false, update: null, delete: null, setDefault: null });
    
    // Refresh addresses list after successful update to show latest data
    setTimeout(() => {
      fetchAddresses();
    }, 100);
  };

  const handleDeleteAddress = async (addressId: string) => {
    setOperationLoading(prev => ({ ...prev, delete: addressId }));
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;
      await AddressAPI.deleteAddress(userId, addressId);
      setAddresses(prev => prev.filter(a => a.id !== addressId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message ||
        (language === 'en' ? 'Failed to delete address' : 'ঠিকানা মুছে ফেলতে ব্যর্থ হয়েছে');
      setError(errorMessage);
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: null }));
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setOperationLoading(prev => ({ ...prev, setDefault: addressId }));
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;
      const response = await AddressAPI.setDefaultAddress(userId, addressId);
      // Update the addresses list - set isDefault to false for all, then true for the selected one
      setAddresses(prev => 
        prev.map(a => ({
          ...a,
          isDefault: a.id === addressId
        }))
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 
        (language === 'en' ? 'Failed to set default address' : 'ডিফল্ট ঠিকানা সেট করতে ব্যর্থ হয়েছে');
      setError(errorMessage);
    } finally {
      setOperationLoading(prev => ({ ...prev, setDefault: null }));
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(undefined);
  };

  // Empty state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Show form when adding or editing
  if (showForm) {
    return (
      <AddressForm
        address={editingAddress}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        language={language}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Saved Addresses' : 'সংরক্ষিত ঠিকানা'}
        </h2>
        <button
          onClick={handleAddAddress}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>{language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'en' ? 'No saved addresses' : 'কোনো সংরক্ষিত ঠিকানা নেই'}
          </h3>
          <p className="text-gray-600 mb-6">
            {language === 'en'
              ? 'Add a delivery address for faster checkout.'
              : 'দ্রুত চেকআউটের জন্য ডেলিভারি ঠিকানা যোগ করুন।'}
          </p>
          <button
            onClick={handleAddAddress}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>{language === 'en' ? 'Add Your First Address' : 'আপনার প্রথম ঠিকানা যোগ করুন'}</span>
          </button>
        </div>
      ) : (
        /* Address List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
              language={language}
              isEditing={operationLoading.update === address.id}
              isDeleting={operationLoading.delete === address.id}
              isSettingDefault={operationLoading.setDefault === address.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesTab;
