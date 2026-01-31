# Smart Tech B2C API Reference Guide

## Phase 4 Milestone 2: Product Management APIs

This comprehensive guide documents all API endpoints for the Smart Tech B2C E-commerce Platform, specifically covering the new features added in Phase 4 Milestone 2.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Search Endpoints](#search-endpoints)
4. [Bulk Product Operations](#bulk-product-operations)
5. [Bulk Category Operations](#bulk-category-operations)
6. [Bulk Brand Operations](#bulk-brand-operations)
7. [CSV Import/Export](#csv-importexport)
8. [Data Models](#data-models)
9. [Error Handling](#error-handling)
10. [Usage Examples](#usage-examples)

---

## Overview

Phase 4 Milestone 2 introduces advanced product search capabilities powered by Elasticsearch and comprehensive bulk operations for efficient product management.

### Key Features

- **Elasticsearch Integration**: Full-text search with bilingual (English/Bangla) support
- **Faceted Search**: Filter products by category, brand, price range, and status flags
- **Autocomplete Suggestions**: Real-time search suggestions as users type
- **Search Analytics**: Track popular searches and optimize product discoverability
- **Bulk Operations**: Batch create, update, delete, and status management
- **CSV Import/Export**: Efficient bulk data management

### Performance Characteristics

- Search response time: < 300ms (p95)
- Bulk operations: Up to 100 items per request
- Elasticsearch graceful degradation to PostgreSQL fallback

---

## Authentication

### Admin-Only Endpoints

The following endpoints require admin authentication:

- All bulk operation endpoints (`/products/bulk`, `/categories/bulk`, `/brands/bulk`)
- CSV import/export endpoints
- Search analytics endpoint
- Product/Category/Brand management endpoints

### Authentication Header

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@smarttech.com",
  "password": "your-password"
}
```

---

## Search Endpoints

### 1. Advanced Product Search

**Endpoint**: `GET /api/v1/search`

Search products using Elasticsearch with full-text search, filtering, sorting, and pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | - | Search query string |
| `page` | integer | No | 1 | Page number (1-based) |
| `limit` | integer | No | 20 | Items per page (max: 100) |
| `sortBy` | string | No | createdAt | Sort field (price, name, rating, popularity, createdAt) |
| `sortOrder` | string | No | desc | Sort order (asc, desc) |
| `categoryId` | UUID | No | - | Filter by category |
| `brandId` | UUID | No | - | Filter by brand |
| `priceMin` | number | No | - | Minimum price |
| `priceMax` | number | No | - | Maximum price |
| `status` | string | No | - | Filter by status (active, inactive, draft, published, archived, out_of_stock, discontinued) |
| `visibility` | string | No | - | Filter by visibility (public, private, restricted) |
| `isFeatured` | boolean | No | - | Filter by featured flag |
| `isNewArrival` | boolean | No | - | Filter by new arrival flag |
| `isBestSeller` | boolean | No | - | Filter by best seller flag |

#### Example Request

```bash
GET /api/v1/search?q=smartphone&page=1&limit=20&categoryId=123e4567-e89b-12d3-a456-426614174000&priceMin=500&priceMax=1500&sortBy=price&sortOrder=asc
```

#### Example Response

```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sku": "SKU-001",
      "name": "iPhone 15 Pro Max",
      "nameEn": "iPhone 15 Pro Max",
      "nameBn": "আইফোন ১৫ প্রো ম্যাক্স",
      "slug": "iphone-15-pro-max",
      "shortDescription": "Latest Apple flagship smartphone",
      "basePrice": 1499.99,
      "discountPrice": null,
      "salePrice": 1399.99,
      "thumbnail": "/uploads/products/iphone-15-pro.jpg",
      "rating": 4.8,
      "reviewCount": 256,
      "inStock": true,
      "isFeatured": true,
      "isNewArrival": true,
      "isBestSeller": false,
      "categoryId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "categoryName": "Smartphones",
      "brandId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "brandName": "Apple"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "metadata": {
    "query": "smartphone",
    "executionTime": 45,
    "searchEngine": "elasticsearch"
  }
}
```

---

### 2. Search Autocomplete Suggestions

**Endpoint**: `GET /api/v1/search/suggestions`

Get real-time autocomplete suggestions as users type their search query.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Partial search query (min 2 characters) |
| `limit` | integer | No | 10 | Max suggestions (max: 50) |

#### Example Request

```bash
GET /api/v1/search/suggestions?q=iph&limit=5
```

#### Example Response

```json
{
  "suggestions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nameEn": "iPhone 15 Pro Max",
      "nameBn": "আইফোন ১৫ প্রো ম্যাক্স",
      "slug": "iphone-15-pro-max",
      "thumbnail": "/uploads/products/iphone-15-pro.jpg",
      "categoryId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "categoryNameEn": "Smartphones"
    }
  ],
  "count": 1,
  "query": "iph"
}
```

---

### 3. Faceted Search Aggregations

**Endpoint**: `GET /api/v1/search/facets`

Get aggregations for faceted search UI components.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Search query for context-aware facets |

#### Example Response

```json
{
  "facets": {
    "categories": [
      { "id": "cat-1", "count": 45, "name": "Smartphones" },
      { "id": "cat-2", "count": 32, "name": "Laptops" }
    ],
    "brands": [
      { "id": "brand-1", "count": 28, "name": "Apple" },
      { "id": "brand-2", "count": 22, "name": "Samsung" }
    ],
    "priceRanges": [
      { "key": "0-500", "count": 15, "from": 0, "to": 500 },
      { "key": "500-1000", "count": 25, "from": 500, "to": 1000 }
    ],
    "statusFlags": [
      { "key": "featured", "count": 12 },
      { "key": "newArrival", "count": 8 }
    ]
  },
  "query": "phone"
}
```

---

### 4. Search Analytics (Admin Only)

**Endpoint**: `GET /api/v1/search/analytics`

Get search analytics data including popular queries and performance metrics.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 | No | Start date for analytics period |
| `endDate` | ISO 8601 | No | End date for analytics period |
| `limit` | integer | No | Max results (default: 100, max: 1000) |

#### Example Response

```json
{
  "analytics": {
    "totalSearches": 15420,
    "uniqueQueries": 3420,
    "averageResults": 15.6,
    "averageExecutionTime": 45.2,
    "topQueries": [
      { "query": "iphone", "count": 1250, "avgResults": 8 },
      { "query": "laptop", "count": 980, "avgResults": 12 }
    ],
    "noResultQueries": [
      { "query": "smart watch pro", "count": 45 }
    ]
  },
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

---

## Bulk Product Operations

### 1. Batch Create Products

**Endpoint**: `POST /api/v1/products/bulk`

Create multiple products in a single request (max: 100).

#### Request Body

```json
{
  "products": [
    {
      "sku": "PROD-001",
      "name": "iPhone 15 Pro",
      "nameEn": "iPhone 15 Pro",
      "nameBn": "আইফোন ১৫ প্রো",
      "slug": "iphone-15-pro",
      "shortDescription": "Latest Apple flagship",
      "brandId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "categories": ["c1d2e3f4-a5b6-7890-cdef-1234567890ab"],
      "regularPrice": 999.99,
      "salePrice": 949.99,
      "costPrice": 700.00,
      "stockQuantity": 100,
      "status": "active",
      "visibility": "public",
      "isFeatured": true
    }
  ]
}
```

#### Example Response

```json
{
  "success": true,
  "created": 5,
  "failed": 0,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "created"
    }
  ]
}
```

---

### 2. Batch Update Products

**Endpoint**: `PUT /api/v1/products/bulk`

Update multiple products in a single request (max: 100).

#### Request Body

```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Updated Product Name",
      "regularPrice": 1099.99,
      "status": "published"
    }
  ]
}
```

---

### 3. Batch Delete Products

**Endpoint**: `DELETE /api/v1/products/bulk`

Delete multiple products in a single request (max: 100).

#### Request Body

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

#### Example Response

```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "results": [
    { "productId": "550e8400-e29b-41d4-a716-446655440000", "status": "deleted" }
  ]
}
```

---

### 4. Batch Update Product Status

**Endpoint**: `PATCH /api/v1/products/bulk/status`

Update the status of multiple products (max: 100).

#### Request Body

```json
{
  "productIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ],
  "status": "published"
}
```

#### Valid Status Values

- `active`
- `inactive`
- `draft`
- `published`
- `archived`
- `out_of_stock`
- `discontinued`

---

## Bulk Category Operations

### 1. Batch Create Categories

**Endpoint**: `POST /api/v1/categories/bulk`

Create multiple categories in a single request (max: 100).

#### Request Body

```json
{
  "categories": [
    {
      "name": "Smart Electronics",
      "nameEn": "Smart Electronics",
      "nameBn": "স্মার্ট ইলেকট্রনিক্স",
      "slug": "smart-electronics",
      "description": "All smart electronic devices",
      "status": "active"
    }
  ]
}
```

---

### 2. Batch Update Categories

**Endpoint**: `PUT /api/v1/categories/bulk`

Update multiple categories in a single request (max: 100).

#### Request Body

```json
{
  "categories": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Updated Category Name",
      "status": "active"
    }
  ]
}
```

---

### 3. Batch Delete Categories

**Endpoint**: `DELETE /api/v1/categories/bulk`

Delete multiple categories in a single request (max: 100).

#### Request Body

```json
{
  "categoryIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

**Note**: Cannot delete categories with products or subcategories.

---

## Bulk Brand Operations

### 1. Batch Create Brands

**Endpoint**: `POST /api/v1/brands/bulk`

Create multiple brands in a single request (max: 100).

#### Request Body

```json
{
  "brands": [
    {
      "name": "TechCorp",
      "nameEn": "TechCorp",
      "nameBn": "টেককর্প",
      "slug": "techcorp",
      "description": "Premium technology products",
      "websiteUrl": "https://techcorp.com",
      "status": "active",
      "isFeatured": true
    }
  ]
}
```

---

### 2. Batch Update Brands

**Endpoint**: `PUT /api/v1/brands/bulk`

Update multiple brands in a single request (max: 100).

#### Request Body

```json
{
  "brands": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Updated Brand Name",
      "isFeatured": true
    }
  ]
}
```

---

### 3. Batch Delete Brands

**Endpoint**: `DELETE /api/v1/brands/bulk`

Delete multiple brands in a single request (max: 100).

#### Request Body

```json
{
  "brandIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

**Note**: Cannot delete brands with products.

---

## CSV Import/Export

### Import Products from CSV

**Endpoint**: `POST /api/v1/products/import`

Import products from a CSV file (max file size: 5MB).

#### Request

```
Content-Type: multipart/form-data

file: [CSV file]
```

#### CSV Format

```csv
nameEn,nameBn,slug,shortDescription,descriptionEn,basePrice,discountPrice,categoryId,brandId,sku,status,visibility,isFeatured,isNewArrival,stockQuantity
iPhone 15 Pro,আইফোন ১৫ প্রো,iphone-15-pro,Latest Apple flagship,Full description...,999.99,949.99,cat-uuid-1,brand-uuid-1,SKU-001,active,public,true,true,100
MacBook Pro 14,ম্যাকবুক প্রো ১৪,macbook-pro-14,Professional laptop,Full description...,1999.99,,cat-uuid-2,brand-uuid-1,SKU-002,active,public,false,false,50
```

#### Example Response

```json
{
  "success": true,
  "imported": 50,
  "failed": 2,
  "total": 52,
  "errors": [
    {
      "row": 25,
      "error": "Invalid categoryId"
    }
  ]
}
```

---

### Export Products to CSV

**Endpoint**: `GET /api/v1/products/export`

Export products to a CSV file.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | UUID | Filter by category |
| `brandId` | UUID | Filter by brand |
| `status` | string | Filter by status |
| `limit` | integer | Max products (default: 1000, max: 10000) |

#### Example Response

Returns a CSV file with the following headers:

```
nameEn,nameBn,slug,shortDescription,descriptionEn,descriptionBn,basePrice,discountPrice,categoryId,categoryName,brandId,brandName,sku,status,visibility,isFeatured,isNewArrival,isBestSeller,stockQuantity,lowStockThreshold,taxRate,warrantyPeriod,warrantyType,metaTitle,metaDescription,metaKeywords
```

---

## Data Models

### Product Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Product ID |
| `sku` | string | Yes | Unique product SKU |
| `name` | string | Yes | Product name (default) |
| `nameEn` | string | Yes | Product name in English |
| `nameBn` | string | No | Product name in Bangla |
| `slug` | string | Yes | URL-friendly slug |
| `shortDescription` | string | No | Short description |
| `description` | string | No | Full description |
| `brandId` | UUID | Yes | Brand ID |
| `categories` | array[UUID] | Yes | Category IDs |
| `regularPrice` | decimal | Yes | Regular price |
| `salePrice` | decimal | No | Sale/discount price |
| `costPrice` | decimal | Yes | Cost price |
| `taxRate` | decimal | No | Tax rate (default: 0) |
| `stockQuantity` | integer | No | Stock quantity (default: 0) |
| `lowStockThreshold` | integer | No | Low stock alert threshold (default: 10) |
| `status` | enum | No | Product status (default: active) |
| `visibility` | enum | No | Visibility (default: public) |
| `isFeatured` | boolean | No | Featured flag (default: false) |
| `isNewArrival` | boolean | No | New arrival flag (default: false) |
| `isBestSeller` | boolean | No | Best seller flag (default: false) |

### Category Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Category ID |
| `name` | string | Yes | Category name |
| `nameEn` | string | No | English name |
| `nameBn` | string | No | Bangla name |
| `slug` | string | Yes | URL-friendly slug |
| `description` | string | No | Category description |
| `parentId` | UUID | No | Parent category ID |
| `displayOrder` | integer | No | Display order (default: 0) |
| `status` | enum | No | Category status (default: active) |

### Brand Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Brand ID |
| `name` | string | Yes | Brand name |
| `nameEn` | string | No | English name |
| `nameBn` | string | No | Bangla name |
| `slug` | string | Yes | URL-friendly slug |
| `description` | string | No | Brand description |
| `websiteUrl` | string | No | Brand website |
| `contactEmail` | string | No | Contact email |
| `status` | enum | No | Brand status (default: active) |
| `isFeatured` | boolean | No | Featured flag (default: false) |

### SearchLog Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Log entry ID |
| `query` | string | Search query |
| `userId` | UUID | User ID (optional) |
| `resultsCount` | integer | Number of results returned |
| `executionTime` | float | Query execution time (ms) |
| `filters` | JSON | Applied filters |
| `timestamp` | datetime | Search timestamp |

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation errors |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": "Validation failed",
  "message": "Invalid query parameters",
  "details": [
    {
      "param": "page",
      "message": "must be an integer >= 1",
      "value": "invalid"
    }
  ]
}
```

### Common Error Messages

| Error | Description |
|-------|-------------|
| "Product with this SKU already exists" | Duplicate SKU |
| "Product with this slug already exists" | Duplicate slug |
| "Category not found" | Invalid category ID |
| "Brand not found" | Invalid brand ID |
| "Cannot delete category with products" | Category has products |
| "Cannot delete brand with products" | Brand has products |
| "Duplicate SKUs in batch" | Multiple products with same SKU |
| "Invalid CSV format" | CSV parsing failed |

---

## Usage Examples

### Basic Search Implementation

```javascript
// JavaScript/TypeScript example
async function searchProducts(query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...filters
  });

  const response = await fetch(`/api/v1/search?${params}`);
  const data = await response.json();
  return data;
}

// Usage
const results = await searchProducts('smartphone', {
  categoryId: 'cat-uuid',
  priceMin: 500,
  priceMax: 1500,
  sortBy: 'price',
  sortOrder: 'asc'
});
```

### Bulk Product Creation

```javascript
async function bulkCreateProducts(products) {
  const response = await fetch('/api/v1/products/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ products })
  });

  return response.json();
}

// Usage
const products = [
  { sku: 'P001', name: 'Product 1', nameEn: 'Product 1', slug: 'product-1', brandId: 'brand-uuid', categories: ['cat-uuid'], regularPrice: 99.99, costPrice: 50 },
  { sku: 'P002', name: 'Product 2', nameEn: 'Product 2', slug: 'product-2', brandId: 'brand-uuid', categories: ['cat-uuid'], regularPrice: 149.99, costPrice: 75 }
];

const result = await bulkCreateProducts(products);
console.log(`Created: ${result.created}, Failed: ${result.failed}`);
```

### CSV Import

```javascript
async function importProductsCSV(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/products/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
}

// Usage
const fileInput = document.getElementById('csvFile');
const result = await importProductsCSV(fileInput.files[0]);
console.log(`Imported: ${result.imported}, Failed: ${result.failed}`);
```

### Error Handling Example

```javascript
async function handleBulkOperation(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Operation failed');
    }

    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    // Handle specific errors
    if (error.message.includes('already exists')) {
      // Handle duplicate entry
    }
    throw error;
  }
}
```

---

## Performance Recommendations

### Search Optimization

1. **Use Pagination**: Always use pagination for large result sets
2. **Limit Query Length**: Keep search queries under 100 characters
3. **Cache Facets**: Cache faceted search results on the client side
4. **Debounce Input**: Debounce search input to reduce API calls

### Bulk Operations

1. **Batch Size**: Limit bulk operations to 100 items per request
2. **Handle Errors**: Check the `failed` count and `results` array
3. **Monitor Progress**: Large imports may take time - consider async processing
4. **Validate First**: Validate data before sending bulk requests

---

## Changelog

See [CHANGELOG_MILESTONE2.md](CHANGELOG_MILESTONE2.md) for detailed changes.

---

## Support

For API support, contact: api-support@smarttech.com

**Version**: 4.2.0  
**Last Updated**: 2024
