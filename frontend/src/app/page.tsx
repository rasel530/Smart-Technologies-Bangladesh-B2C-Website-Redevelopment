export const dynamic = 'force-dynamic';

/**
 * Home Page
 * 
 * Server component for the home page.
 * Features include:
 * - Featured products section
 * - New arrivals section
 * - Best sellers section
 * - Popular brands section
 * - Popular categories section
 * - Link to full product listing page
 * - Responsive design
 * - SEO metadata
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getFeatured, getNewArrivals, getBestSellers } from '@/lib/api/products';
import brandsApi from '@/lib/api/brands';
import categoriesApi from '@/lib/api/categories';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCard } from '@/components/product/ProductCard';
import { BrandCard } from '@/components/brand/BrandCard';
import { CategoryCard } from '@/components/category/CategoryCard';
import { CategoryNavigation } from '@/components/category/CategoryNavigation';
import FeaturedBrands from '@/components/brand/FeaturedBrands';

/**
 * Generate metadata for SEO
 */
export const metadata: Metadata = {
  title: 'Smart Technologies Bangladesh - Premier Technology Solutions',
  description: 'Your premier destination for quality technology products and solutions in Bangladesh. Browse featured products, new arrivals, and best sellers.',
  keywords: 'technology, electronics, gadgets, Bangladesh, smart technologies, products',
  openGraph: {
    title: 'Smart Technologies Bangladesh - Premier Technology Solutions',
    description: 'Your premier destination for quality technology products and solutions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Technologies Bangladesh - Premier Technology Solutions',
    description: 'Your premier destination for quality technology products and solutions.',
  },
};

/**
 * Home Page Component
 */
export default async function Home() {
  // Fetch data for home page sections with error handling
  const [featuredProducts, newArrivals, bestSellers, brandsResponse, categoriesResponse, categoryTreeResponse] = await Promise.all([
    getFeatured().catch(err => {
      console.error('Error fetching featured products:', err);
      return [];
    }),
    getNewArrivals().catch(err => {
      console.error('Error fetching new arrivals:', err);
      return [];
    }),
    getBestSellers().catch(err => {
      console.error('Error fetching best sellers:', err);
      return [];
    }),
    brandsApi.getBrands({ status: 'active', limit: 6 }).catch(err => {
      console.error('Error fetching brands:', err);
      return { brands: [], pagination: { page: 1, limit: 6, total: 0, pages: 0 } };
    }),
    categoriesApi.getCategories({ status: 'active', limit: 8 }).catch(err => {
      console.error('Error fetching categories:', err);
      return { categories: [] };
    }),
    categoriesApi.getCategoryTree('active').catch(err => {
      console.error('Error fetching category tree:', err);
      return { tree: [], total: 0 };
    }),
  ]);

  const brands = brandsResponse?.brands || [];
  const categories = categoriesResponse?.categories || [];
  const categoryTree = categoryTreeResponse?.tree || [];

  // Recursive function to transform Category to CategoryNode
  const transformCategoryToNode = (category: any): any => ({
    id: category.id,
    name: category.name,
    nameEn: category.nameEn || category.name,
    nameBn: category.nameBn ?? undefined,
    slug: category.slug,
    image: category.imageUrl ?? undefined,
    children: category.children?.map(transformCategoryToNode) || []
  });

  // Transform category tree to CategoryNode format for CategoryNavigation
  // Use categoryTree for navigation (full hierarchy) and categories for display cards
  const categoryNodes = categoryTree.map(transformCategoryToNode);

  return (
    <main className="min-h-screen">
      {/* Category Navigation */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <CategoryNavigation categories={categoryNodes} />
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to Smart Technologies Bangladesh
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Your premier destination for technology solutions and products
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Quality Products</h2>
              <p className="text-gray-600">
                Premium technology products from leading brands worldwide
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Expert Support</h2>
              <p className="text-gray-600">
                Professional technical support and consultation services
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Fast Delivery</h2>
              <p className="text-gray-600">
                Quick and reliable delivery across Bangladesh
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brands - Hidden */}
      {/* <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <FeaturedBrands />
        </div>
      </section> */}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <Link
                href="/products?isFeatured=true"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m5 4v4m0-4l4 4" />
                </svg>
              </Link>
            </div>
            <ProductGrid
              products={featuredProducts.slice(0, 8)}
              wishlistedProducts={new Set()}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 4,
              }}
            />
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
              <Link
                href="/products?isNewArrival=true"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m5 4v4m0-4l4 4" />
                </svg>
              </Link>
            </div>
            <ProductGrid
              products={newArrivals.slice(0, 8)}
              wishlistedProducts={new Set()}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 4,
              }}
            />
          </div>
        </section>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Best Sellers</h2>
              <Link
                href="/products?isBestSeller=true"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m5 4v4m0-4l4 4" />
                </svg>
              </Link>
            </div>
            <ProductGrid
              products={bestSellers.slice(0, 8)}
              wishlistedProducts={new Set()}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 4,
              }}
            />
          </div>
        </section>
      )}

      {/* Popular Brands Section */}
      {brands.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Popular Brands</h2>
              <Link
                href="/brands"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All Brands
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m5 4v4m0-4l4 4" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {brands.slice(0, 6).map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  showDescription={false}
                  showProductCount={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Popular Categories</h2>
              <Link
                href="/categories"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All Categories
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3m5 4v4m0-4l4 4" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  showDescription={true}
                  showCounts={true}
                  showSubcategories={false}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Shop?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Browse our complete collection of technology products
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
