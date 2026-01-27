import { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/api/categories';
import { CategoryPage } from '@/components/category/CategoryPage';

interface PageProps {
  params: {
    slug: string;
  };
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const data = await getCategoryBySlug(params.slug);
    const category = data.category;

    return {
      title: category.metaTitle || `${category.name} | Smart Tech`,
      description: category.metaDescription || category.description || `Browse ${category.name} products at Smart Tech`,
      keywords: category.metaKeywords || `${category.name}, products, Smart Tech`,
      openGraph: {
        title: category.metaTitle || category.name,
        description: category.metaDescription || category.description,
        images: category.imageUrl ? [category.imageUrl] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: category.metaTitle || category.name,
        description: category.metaDescription || category.description,
        images: category.imageUrl ? [category.imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Category | Smart Tech',
      description: 'Browse products at Smart Tech',
    };
  }
}

/**
 * Generate structured data (JSON-LD) for SEO
 */
function generateStructuredData(category: any, path: any[]) {
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: path.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://smarttech.com/categories/${item.slug}`,
    })),
  };

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://smarttech.com/categories/${category.slug}`,
    image: category.imageUrl,
  };

  return JSON.stringify([breadcrumbList, collectionPage]);
}

/**
 * Public Category Page
 * 
 * Public category page with:
 * - CategoryPage component integration
 * - Server-side rendering for SEO
 * - Product listing with pagination
 * - Structured data (JSON-LD)
 */
export default async function CategoryPageRoute({ params }: PageProps) {
  const data = await getCategoryBySlug(params.slug);
  const category = data.category;
  const path = data.path;

  // Generate structured data
  const structuredData = generateStructuredData(category, path);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />

      {/* Category Page Component */}
      <CategoryPage slug={params.slug} />
    </>
  );
}
