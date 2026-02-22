'use client';

import { ProductGrid } from '@/components/product/ProductGrid';
import { useCart } from '@/contexts/CartContext';

interface HomeProductGridProps {
  products: any[];
}

export function HomeProductGrid({ products }: HomeProductGridProps) {
  const { addItem } = useCart();

  const handleAddToCart = (productId: string, variantId?: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addItem(product, 1, variantId);
    }
  };

  return (
    <ProductGrid
      products={products}
      wishlistedProducts={new Set()}
      onAddToCart={handleAddToCart}
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 4,
      }}
    />
  );
}
