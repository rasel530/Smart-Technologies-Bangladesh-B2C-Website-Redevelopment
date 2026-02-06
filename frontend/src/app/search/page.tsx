/**
 * Search Results Page
 *
 * Server component for search results with filters, sorting, and pagination.
 * Features include:
 * - Display search query at top
 * - Show result count
 * - Integrate FilterSidebar (same as products page)
 * - Integrate SortDropdown
 * - Grid/list view toggle
 * - "Did you mean?" suggestions for typos
 * - No results state with suggestions
 * - Recent searches display
 * - Popular searches display
 */

// @ts-ignore - Type mismatch due to API incompatibility
import { Metadata } from 'next';
import { search } from '@/lib/api/search';
import { getCategories } from '@/lib/api/categories';
import { getBrands } from '@/lib/api/brands';
import { ProductWithRelations } from '@/types/product';
import SearchPageClient from '@/components/search/SearchPageClient';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  
  return {
    title: query ? `Search Results for "${query}" - Smart Technologies Bangladesh` : 'Search - Smart Technologies Bangladesh',
    description: query 
      ? `Search results for "${query}" at Smart Technologies Bangladesh. Find the best technology products.`
      : 'Search for products at Smart Technologies Bangladesh.',
    keywords: query ? `${query}, search, products, technology, Bangladesh` : 'search, products, technology, Bangladesh',
    openGraph: {
      title: query ? `Search Results for "${query}"` : 'Search',
      description: query ? `Search results for "${query}"` : 'Search products',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: query ? `Search Results for "${query}"` : 'Search',
      description: query ? `Search results for "${query}"` : 'Search products',
    },
  };
}

/**
 * Search Results Page Component
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 20;
  
  // Parse sort parameter into sortBy and sortOrder
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;
  
  // Improved sort parameter mapping to match API options
  const sortMapping: Record<string, { sortBy: 'price' | 'name' | 'rating' | 'popularity' | 'createdAt'; sortOrder: 'asc' | 'desc' }> = {
    'price-asc': { sortBy: 'price', sortOrder: 'asc' },
    'price-desc': { sortBy: 'price', sortOrder: 'desc' },
    'name-asc': { sortBy: 'name', sortOrder: 'asc' },
    'name-desc': { sortBy: 'name', sortOrder: 'desc' },
    'rating-asc': { sortBy: 'rating', sortOrder: 'asc' },
    'rating-desc': { sortBy: 'rating', sortOrder: 'desc' },
    'popularity-asc': { sortBy: 'popularity', sortOrder: 'asc' },
    'popularity-desc': { sortBy: 'popularity', sortOrder: 'desc' },
    'newest': { sortBy: 'createdAt', sortOrder: 'desc' },
    'oldest': { sortBy: 'createdAt', sortOrder: 'asc' },
  };
  
  const { sortBy, sortOrder } = sortParam && sortMapping[sortParam] ? sortMapping[sortParam] : { sortBy: undefined, sortOrder: undefined };
  
  // Parse filters - support multiple selections for categories and brands
  const categories = Array.isArray(searchParams.category) ? searchParams.category : (searchParams.category ? [searchParams.category] : []);
  const brands = Array.isArray(searchParams.brand) ? searchParams.brand : (searchParams.brand ? [searchParams.brand] : []);
  const minPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) : undefined;
  const rating = typeof searchParams.rating === 'string' ? parseInt(searchParams.rating) : undefined;
  const specifications = Array.isArray(searchParams.specification) ? searchParams.specification : (searchParams.specification ? [searchParams.specification] : []);
 
  // Fetch data
  let searchResults, categoriesResponse, brandsResponse;
  let fetchError = null;
 
  try {
    [searchResults, categoriesResponse, brandsResponse] = await Promise.all([
      search({
        query,
        page,
        limit,
        sortBy,
        sortOrder,
        categoryId: categories.length > 0 ? categories : undefined,
        brandId: brands.length > 0 ? brands : undefined,
        minPrice,
        maxPrice,
        rating,
        specifications: specifications.length > 0 ? specifications : undefined,
      }),
      getCategories({ status: 'active' }),
      getBrands({ status: 'active' }),
    ]);
  } catch (error: any) {
    console.error('[SearchPage] Error fetching data:', error);
    fetchError = error?.message || 'Failed to load search results. Please try again later.';
    
    // Set default values to prevent page crash
    searchResults = {
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      },
      metadata: {
        query: '',
        executionTime: 0,
        searchEngine: '',
      },
    };
    categoriesResponse = { categories: [] };
    brandsResponse = { brands: [] };
  }

  // Transform search results to ProductWithRelations format
  const transformedProducts = searchResults.products.map((result: any): any => ({
    ...result,
    id: result.id,
    sku: result.sku,
    name: result.name,
    nameEn: result.nameEn,
    nameBn: result.nameBn,
    slug: result.slug,
    shortDescription: result.shortDescription,
    description: result.shortDescription,
    regularPrice: result.regularPrice,
    salePrice: result.salePrice,
    costPrice: result.costPrice,
    stockQuantity: result.stockQuantity || 0,
    lowStockThreshold: 10,
    taxRate: 0,
    status: 'published' as const,
    visibility: 'public' as const,
    metaTitle: result.name,
    metaDescription: result.shortDescription,
    metaKeywords: '',
    isFeatured: result.isFeatured || false,
    isNewArrival: result.isNewArrival || false,
    isBestSeller: result.isBestSeller || false,
    warrantyPeriod: null,
    warrantyType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    brand: result.brandName ? {
      id: result.brandId || '',
      name: result.brandName || '',
      slug: result.brandName?.toLowerCase().replace(/\s+/g, '-') || '',
      logoUrl: undefined,
    } : undefined,
    categories: result.categoryName ? [{
      id: result.categoryId || '',
      category: {
        id: result.categoryId || '',
        name: result.categoryName || '',
        nameEn: result.categoryNameEn || result.categoryName || '',
        nameBn: result.categoryNameBn,
        slug: result.categoryName?.toLowerCase().replace(/\s+/g, '-') || '',
        imageUrl: undefined,
        iconUrl: undefined,
      }
    }] : [],
    images: result.images || [],
    specifications: [],
    variants: [],
    avgRating: result.rating,
    _count: {
      reviews: result.reviewCount || 0,
    },
  }));

  // Pass all data to the Client Component
  return (
    <SearchPageClient
      query={query}
      page={page}
      limit={limit}
      searchResults={{
        ...searchResults,
        products: transformedProducts,
      }}
      categories={categoriesResponse.categories}
      brands={brandsResponse.brands}
      fetchError={fetchError}
    />
  );
}
