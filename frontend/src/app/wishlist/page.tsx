/**
 * Wishlist Route Page
 *
 * This is the Next.js App Router page for wishlist functionality.
 * It renders the WishlistPage component with proper metadata and context provider.
 */

import { Metadata } from 'next';
import { WishlistProvider } from '@/contexts/WishlistContext';
import WishlistPage from '@/components/wishlist/WishlistPage';

export const metadata: Metadata = {
  title: 'My Wishlist | Smart Tech',
  description: 'View and manage your wishlist. Save your favorite products and access them anytime.',
  keywords: ['wishlist', 'favorites', 'saved items', 'Smart Tech'],
};

/**
 * Wishlist Page
 *
 * Renders main wishlist page component wrapped in WishlistProvider.
 */
export default function Page() {
  return (
    <WishlistProvider>
      <WishlistPage />
    </WishlistProvider>
  );
}
