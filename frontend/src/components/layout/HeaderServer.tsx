/**
 * Server Component Wrapper for Header
 * 
 * This component fetches the category tree server-side and passes it to the client Header component.
 * This eliminates the client-side fetch and improves performance.
 */

import { getCategoryTreeServer } from '@/lib/api/server';
import Header from './Header';

export async function HeaderServer({ className }: { className?: string }) {
  try {
    // Fetch category tree server-side with caching
    const categoryTreeResponse = await getCategoryTreeServer('active');
    const categoryTree = categoryTreeResponse?.tree || [];
    
    return (
      <Header
        className={className}
        categoryTree={categoryTree}
        categoriesLoading={false}
      />
    );
  } catch (error) {
    console.error('[HeaderServer] Error fetching category tree:', error);
    // Return Header with empty category tree on error
    return (
      <Header
        className={className}
        categoryTree={[]}
        categoriesLoading={false}
      />
    );
  }
}
