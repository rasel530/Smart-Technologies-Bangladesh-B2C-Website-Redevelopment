/**
 * Product Comparison Context
 * 
 * Manages product comparison state across the application.
 * Features:
 * - Add/remove products from comparison
 * - Maximum 4 products for comparison
 * - Persist comparison state to localStorage
 * - Clear all comparison
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductWithRelations } from '@/types/product';

interface CompareProduct extends ProductWithRelations {
  addedAt: Date;
}

interface CompareContextType {
  products: CompareProduct[];
  addProduct: (product: ProductWithRelations) => boolean;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  isComparing: (productId: string) => boolean;
  maxProducts: number;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_PRODUCTS = 4;
const STORAGE_KEY = 'smart_tech_compare_products';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load from localStorage on mount (only after component is mounted)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate and filter out invalid products
          const validProducts: CompareProduct[] = parsed
            .filter((p: any) => p.id && p.name && p.slug)
            .map((p: any) => ({
              ...p,
              addedAt: new Date(p.addedAt)
            }));
          setProducts(validProducts);
        }
      } catch (error) {
        console.error('[CompareContext] Error loading from localStorage:', error);
      }
      setIsLoaded(true);
    }
  }, [isMounted]);

  // Save to localStorage on change (only after component is mounted)
  useEffect(() => {
    if (isLoaded && isMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      } catch (error) {
        console.error('[CompareContext] Error saving to localStorage:', error);
      }
    }
  }, [products, isLoaded, isMounted]);

  const addProduct = (product: ProductWithRelations): boolean => {
    if (products.length >= MAX_COMPARE_PRODUCTS) {
      return false;
    }

    if (products.some(p => p.id === product.id)) {
      return false;
    }

    const newProduct: CompareProduct = {
      ...product,
      addedAt: new Date(product.updatedAt || product.createdAt || Date.now())
    };

    setProducts(prev => [...prev, newProduct]);
    return true;
  };

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const clearAll = () => {
    setProducts([]);
  };

  const isComparing = (productId: string): boolean => {
    return products.some(p => p.id === productId);
  };

  const isFull = products.length >= MAX_COMPARE_PRODUCTS;

  return (
    <CompareContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        clearAll,
        isComparing,
        maxProducts: MAX_COMPARE_PRODUCTS,
        isFull
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}

export default CompareContext;
