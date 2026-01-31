# Multi-Level Category Hierarchy Guide

This comprehensive guide covers the multi-level category hierarchy system implemented in the Smart Tech B2C Website. It provides detailed information about the architecture, implementation, and usage of category hierarchies in the admin panel.

---

## Table of Contents

1. [Overview of Multi-Level Category Hierarchy](#1-overview-of-multi-level-category-hierarchy)
2. [Database Schema](#2-database-schema)
3. [Backend API Endpoints](#3-backend-api-endpoints)
4. [Frontend Implementation](#4-frontend-implementation)
5. [Step-by-Step Guide](#5-step-by-step-guide)
6. [Best Practices](#6-best-practices)
7. [Troubleshooting](#7-troubleshooting)
8. [API Reference](#8-api-reference)

---

## 1. Overview of Multi-Level Category Hierarchy

### What is Multi-Level Category Hierarchy?

A multi-level category hierarchy is a tree-like structure where categories can have parent-child relationships. This allows you to organize products into nested categories with unlimited depth, creating a logical and intuitive navigation structure for your e-commerce store.

**Key Concepts:**

- **Root Categories**: Categories that have no parent (top-level categories)
- **Subcategories**: Categories that have a parent category
- **Parent-Child Relationship**: A link between a category and its parent
- **Category Tree**: The complete hierarchical structure of all categories
- **Descendants**: All categories that are nested under a given category
- **Ancestors**: All categories that are above a given category in the hierarchy

### Benefits of Using Category Hierarchy

1. **Improved Navigation**: Customers can easily find products through logical category paths
2. **Better SEO**: Hierarchical URLs (e.g., `/electronics/computers/laptops`) improve search engine rankings
3. **Organized Content**: Products are grouped logically for better user experience
4. **Flexible Organization**: Create complex category structures to match your product catalog
5. **Scalability**: Add unlimited levels of subcategories as your product catalog grows
6. **Efficient Filtering**: Users can narrow down product searches by navigating through categories

### How It Works in the System

The category hierarchy system consists of three main components:

1. **Database Layer**: Stores category data with parent-child relationships using `parentId` foreign key
2. **Backend API**: Provides RESTful endpoints for CRUD operations and hierarchy management
3. **Frontend Components**: Displays category tree and provides admin interface for management

```
Frontend (React)
    │
    ├── CategoryList.tsx     ──► Tree view with expand/collapse
    ├── CategoryForm.tsx     ──► Form for create/edit with parent selection
    └── CategoryTreeEditor.tsx ──► Drag-and-drop hierarchy editor

Backend (Express/Prisma)
    │
    ├── GET /categories/tree ──► Returns hierarchical tree structure
    ├── POST /categories     ──► Create with optional parentId
    ├── PUT /categories/:id  ──► Update parent relationship
    └── PUT /categories/:id/move ──► Move category to new parent

Database (PostgreSQL/Prisma)
    │
    └── Category Table
        ├── id (UUID)
        ├── parentId (UUID, nullable) ──► Self-referencing FK
        ├── name, slug, description...
        └── children (relation)
```

---

## 2. Database Schema

### Category Model Structure

The category model supports parent-child relationships through a self-referencing foreign key.

```prisma
model Category {
  id              String    @id @default(uuid())
  name            String
  nameEn          String?   // English name (optional)
  nameBn          String?   // Bengali name (optional)
  slug            String    @unique
  description     String?
  
  // Parent-Child Relationship
  parentId        String?   // UUID, nullable for root categories
  parent          Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[] @relation("CategoryHierarchy")
  
  // Media
  imageUrl        String?
  iconUrl         String?
  
  // Ordering & Status
  displayOrder    Int       @default(0)
  sortOrder       Int       @default(0)
  status          CategoryStatus @default(ACTIVE)
  
  // SEO Fields
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  products        ProductCategory[]
  brands          Brand[]
  
  @@index([parentId])
  @@index([status])
  @@index([slug])
}

enum CategoryStatus {
  ACTIVE
  INACTIVE
}
```

### Key Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier for the category |
| `parentId` | UUID (nullable) | Reference to parent category. Null = root category |
| `parent` | Relation | The parent category object (if exists) |
| `children` | Relation[] | Array of child categories |
| `slug` | String | URL-friendly identifier (unique) |
| `displayOrder` | Integer | Controls display order within siblings |
| `status` | Enum | `active` or `inactive` |

### Cascade Delete Behavior

**Important:** The system prevents deletion of categories that have:

1. **Subcategories**: You cannot delete a category if it has child categories
2. **Products**: You cannot delete a category if products are assigned to it

This safety mechanism prevents accidental data loss. To delete a category:
1. First, move or delete all subcategories
2. Then, move or delete all products from the category
3. Finally, delete the category

---

## 3. Backend API Endpoints

### Category Hierarchy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories/tree` | Get full category tree structure |
| GET | `/api/v1/categories` | List all categories (with optional tree format) |
| GET | `/api/v1/categories/:id` | Get category by ID with details |
| POST | `/api/v1/categories` | Create new category |
| PUT | `/api/v1/categories/:id` | Update category (including parent) |
| DELETE | `/api/v1/categories/:id` | Delete category |
| POST | `/api/v1/categories/:id/subcategories` | Create subcategory under parent |
| PUT | `/api/v1/categories/:id/move` | Move category to new parent |
| PATCH | `/api/v1/categories/:id/reorder` | Update display order |
| PATCH | `/api/v1/categories/reorder-batch` | Batch reorder categories |

### Detailed Endpoint Documentation

#### GET /api/v1/categories/tree

Returns the complete category hierarchy as a nested tree structure.

**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)

**Response:**
```json
{
  "tree": [
    {
      "id": "uuid-1",
      "name": "Electronics",
      "slug": "electronics",
      "parentId": null,
      "children": [
        {
          "id": "uuid-2",
          "name": "Computers",
          "slug": "computers",
          "parentId": "uuid-1",
          "children": [
            {
              "id": "uuid-3",
              "name": "Laptops",
              "slug": "laptops",
              "parentId": "uuid-2",
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "total": 3
}
```

#### GET /api/v1/categories

Returns a flat or tree list of categories with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status
- `parentId` (optional): Filter by parent
- `tree` (optional): Return tree structure (`true` or `false`)
- `includeProducts` (optional): Include product counts

#### POST /api/v1/categories

Create a new category. Can be a root category (no parent) or subcategory.

**Request Body:**
```json
{
  "name": "Smartphones",
  "slug": "smartphones",
  "nameEn": "Mobile Phones",
  "nameBn": "মোবাইল ফোন",
  "description": "Latest smartphones and mobile devices",
  "parentId": "uuid-of-electronics",  // Omit for root category
  "displayOrder": 0,
  "status": "active",
  "metaTitle": "Smartphones - Buy Online",
  "metaDescription": "Shop for smartphones",
  "metaKeywords": "mobile, phone, smartphone"
}
```

**Response (201 Created):**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "uuid-new",
    "name": "Smartphones",
    "slug": "smartphones",
    "parentId": "uuid-of-electronics",
    "status": "active",
    "createdAt": "2026-01-30T20:00:00Z"
  }
}
```

#### PUT /api/v1/categories/:id

Update an existing category. Can change the parent to reorganize hierarchy.

**Request Body:**
```json
{
  "name": "Mobile Phones",
  "parentId": "uuid-of-new-parent",  // Move to different parent
  "displayOrder": 2
}
```

**Response:**
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": "uuid-3",
    "name": "Mobile Phones",
    "parentId": "uuid-of-new-parent",
    "updatedAt": "2026-01-30T20:30:00Z"
  }
}
```

#### PUT /api/v1/categories/:id/move

Move a category to a new parent without modifying other fields.

**Request Body:**
```json
{
  "parentId": "uuid-of-new-parent"  // Omit to make root category
}
```

#### DELETE /api/v1/categories/:id

Delete a category. Only succeeds if the category has no subcategories or products.

**Response (200 OK):**
```json
{
  "message": "Category deleted successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Cannot delete category with subcategories",
  "suggestion": "Delete or move subcategories first"
}
```

### Circular Reference Prevention

The backend implements automatic circular reference detection to prevent creating invalid hierarchies:

```javascript
// Helper function to check circular reference
const checkCircularReference = async (categoryId, newParentId) => {
  let current = await prisma.category.findUnique({
    where: { id: newParentId },
    select: { id: true, parentId: true }
  });

  while (current && current.parentId) {
    if (current.parentId === categoryId) {
      return true;  // Circular reference detected
    }
    current = await prisma.category.findUnique({
      where: { id: current.parentId },
      select: { id: true, parentId: true }
    });
  }

  return false;
};
```

---

## 4. Frontend Implementation

### CategoryForm Component

The [`CategoryForm`](frontend/src/components/admin/CategoryForm.tsx) component provides a comprehensive form for creating and editing categories.

**Location:** `frontend/src/components/admin/CategoryForm.tsx`

**Features:**
- Creates both root and subcategories
- Displays parent selection with hierarchical indentation
- Prevents circular references when editing
- Validates slug uniqueness
- Supports multi-language names (EN/BN)

**Component Props:**
```typescript
interface CategoryFormProps {
  categoryId?: string;      // Omit for new category
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
}
```

**Key Functionality:**

```typescript
// Parent category dropdown with hierarchy indentation
const renderParentOptions = (categories: Category[], parentId: string | null = null, level: number = 0): JSX.Element[] => {
  const options: JSX.Element[] = [];
  const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level); // Non-breaking spaces

  categories
    .filter((cat) => cat.parentId === parentId)
    .forEach((cat) => {
      options.push(
        <option key={cat.id} value={cat.id}>
          {indent}{cat.name}
        </option>
      );
      // Recursively render children
      options.push(...renderParentOptions(categories, cat.id, level + 1));
    });

  return options;
};
```

### CategoryList Component

The [`CategoryList`](frontend/src/components/admin/CategoryList.tsx) component displays categories in an expandable tree view.

**Location:** `frontend/src/components/admin/CategoryList.tsx`

**Features:**
- Expandable/collapsible tree structure
- Visual hierarchy with indentation
- Search functionality
- Status filtering
- Inline editing and deletion
- Display order management

**Visual Structure:**
```
📁 Electronics (expanded)
   ├── 📁 Computers
   │    ├── 💻 Laptops
   │    └── 🖥️ Desktops
   ├── 📱 Smartphones
   └── 📷 Cameras

📁 Clothing
   └── 👕 Men's Fashion
```

### CategoryTreeEditor Component

The [`CategoryTreeEditor`](frontend/src/components/admin/CategoryTreeEditor.tsx) provides drag-and-drop functionality for reorganizing categories.

**Location:** `frontend/src/components/admin/CategoryTreeEditor.tsx`

**Features:**
- Drag and drop to move categories
- Visual hierarchy representation
- Status badges
- Subcategory counts

---

## 5. Step-by-Step Guide

### Creating a Root-Level Category

1. **Navigate to Admin Panel**
   - Go to `http://localhost:3000/admin/categories`
   - Click "Add Category" button

2. **Fill in Basic Information**
   - **Name**: Enter the category name (e.g., "Electronics")
   - **Slug**: Auto-generates from name or enter manually (e.g., "electronics")
   - **Name (English)**: Optional English name
   - **Name (Bengali)**: Optional Bengali name

3. **Set as Root Category**
   - In "Parent Category" dropdown, select "None (Root Category)"
   - Leave the field blank

4. **Configure Additional Settings**
   - **Description**: Add category description
   - **Display Order**: Set order (0 = first)
   - **Status**: Set to "Active"

5. **Add SEO Information** (Optional)
   - **Meta Title**: Title for search engines
   - **Meta Description**: Description for search engines
   - **Meta Keywords**: Comma-separated keywords

6. **Save Category**
   - Click "Create Category"
   - Success message appears

### Creating a Subcategory

1. **Navigate to Parent Category**
   - Go to `http://localhost:3000/admin/categories`
   - Find the parent category (e.g., "Electronics")
   - Click "Add Category"

2. **Fill in Subcategory Details**
   - **Name**: e.g., "Computers"
   - **Slug**: e.g., "computers"

3. **Select Parent Category**
   - In "Parent Category" dropdown, select "Electronics"
   - The dropdown shows hierarchy with indentation

4. **Save Subcategory**
   - Click "Create Category"
   - The subcategory is now nested under Electronics

### Creating Nested Subcategories (Multi-Level)

Continue the pattern to create deeper levels:

```
Electronics (root)
└── Computers (level 1)
    └── Laptops (level 2)
        └── Gaming Laptops (level 3)
```

**Notes:**
- There is no strict limit on hierarchy depth
- Each level adds visual indentation in the UI
- Use display order to control positioning within siblings

### Editing Category Hierarchy

1. **Edit Mode**
   - Click the edit icon next to the category
   - Or navigate to `/admin/categories/:id/edit`

2. **Change Parent**
   - Select a different parent from the dropdown
   - The category and all its children will move

3. **Prevent Circular References**
   - The system prevents setting a category as its own descendant
   - Invalid moves are blocked with an error message

### Moving Categories to Different Parents

**Method 1: Using the Edit Form**
1. Edit the category
2. Change the "Parent Category" selection
3. Save changes

**Method 2: Using Tree Editor (Drag-and-Drop)**
1. Navigate to `/admin/categories/tree`
2. Drag a category and drop it onto another category
3. The dragged category becomes a child of the target

### Deleting Categories

**Important Considerations:**

1. **Prerequisites**
   - Category must have no subcategories
   - Category must have no products assigned

2. **Deletion Process**
   ```
   If category has subcategories:
   ├── Option 1: Delete all subcategories first
   └── Option 2: Move subcategories to another parent
   
   If category has products:
   ├── Option 1: Delete products first
   └── Option 2: Move products to another category
   ```

3. **Cascade Delete**
   - Deleting a parent does NOT automatically delete children
   - You must delete or move children first

---

## 6. Best Practices

### Recommended Category Hierarchy Structure

**Balanced Tree Structure:**
```
Root Categories (3-7)
└── Subcategories (5-15 per parent)
    └── Sub-subcategories (as needed)
```

**Example for Electronics Store:**
```
Electronics
├── Phones & Tablets
│   ├── Smartphones
│   ├── Tablets
│   └── Accessories
├── Computers & Laptops
│   ├── Laptops
│   ├── Desktop PCs
│   ├── Monitors
│   └── Accessories
├── TV & Home Theater
│   ├── TVs
│   ├── Sound Systems
│   └── Streaming Devices
├── Cameras & Drones
│   ├── Cameras
│   ├── Drones
│   └── Accessories
└── Gaming
    ├── Consoles
    ├── Games
    └── Accessories
```

### Naming Conventions

1. **Category Names**
   - Use clear, descriptive names
   - Keep names concise (1-3 words for root categories)
   - Avoid special characters

2. **URL Slugs**
   - Use lowercase letters
   - Separate words with hyphens
   - Be descriptive and SEO-friendly
   - Examples: `smartphones`, `laptop-accessories`, `gaming-laptops`

3. **Multi-Language Support**
   - Use `nameEn` for English names
   - Use `nameBn` for Bengali names
   - Keep translations consistent

### Depth Considerations

| Depth Level | Recommendation | Use Case |
|-------------|----------------|----------|
| Level 0 (Root) | 3-7 categories | Major product divisions |
| Level 1 | 5-15 per parent | Product types |
| Level 2 | 5-20 per parent | Product categories |
| Level 3+ | Use sparingly | Specific attributes |

**Tips:**
- Most customers navigate 2-3 levels deep
- Avoid going beyond 4-5 levels
- Use filters instead of deep hierarchies when possible

### Performance Tips

1. **Limit Root Categories**
   - Too many root categories (20+) can slow down the tree view

2. **Use Display Order**
   - Set explicit display orders for predictable sorting
   - Use intervals (10, 20, 30) to allow inserting between existing items

3. **Inactive vs. Delete**
   - Use "Inactive" status to hide categories without deleting
   - Easier to reactivate later

4. **Bulk Operations**
   - Use bulk create/update endpoints for importing categories
   - Maximum 100 categories per bulk operation

---

## 7. Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot set category as its own parent"

**Cause:** You tried to set a category as its own parent or move it under one of its descendants.

**Solution:** Choose a different parent category that is not a descendant of the current category.

#### Issue: "Cannot delete category with subcategories"

**Cause:** The category has child categories.

**Solution:**
1. First, delete or move all subcategories
2. Then delete the parent category

#### Issue: "Cannot delete category with products"

**Cause:** Products are assigned to this category.

**Solution:**
1. Go to Products management
2. Either delete products or move them to another category
3. Then delete the category

#### Issue: "Category with this slug already exists"

**Cause:** The slug you entered is already used by another category.

**Solution:**
1. Use a different slug
2. Or edit the existing category to change its slug first

#### Issue: Parent dropdown is empty

**Cause:** When editing, the current category and its descendants are excluded.

**Solution:** This is expected behavior to prevent circular references. Select a category that is not a descendant.

#### Issue: Category tree not displaying correctly

**Cause:** Database query or frontend rendering issue.

**Solution:**
1. Check browser console for errors
2. Verify API is returning correct tree structure
3. Clear browser cache and reload

### Error Messages and Their Meanings

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| "Category not found" | Invalid category ID | Verify the category exists |
| "Parent category not found" | Parent ID doesn't exist | Check parent category ID |
| "Cannot move category to its own descendant" | Circular reference | Select a valid parent |
| "Slug must contain only lowercase letters" | Invalid slug format | Use lowercase and hyphens |
| "Name is required" | Missing category name | Enter a name |
| "Validation failed" | Invalid input data | Check all required fields |

### Debug Mode

Enable detailed logging by checking the browser console:

```javascript
// API client logs requests and responses
console.log('[API Client] Making request:', { method, url, ... });
console.log('[API Client] Response received:', { status, ok, ... });
```

---

## 8. API Reference

### TypeScript Interfaces

```typescript
// Category status enum
export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Category model
export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  nameBn?: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  imageUrl?: string;
  iconUrl?: string;
  displayOrder: number;
  sortOrder: number;
  status: CategoryStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

// Category with children for tree
export interface CategoryTree extends Category {
  children: CategoryTree[];
}

// Create category request
export interface CreateCategoryRequest {
  name: string;
  nameEn?: string;
  nameBn?: string;
  slug: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  sortOrder?: number;
  status?: CategoryStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// Update category request
export interface UpdateCategoryRequest {
  name?: string;
  nameEn?: string;
  nameBn?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  sortOrder?: number;
  status?: CategoryStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// Move category request
export interface CategoryMoveRequest {
  parentId?: string;
}

// List response
export interface CategoryListResponse {
  categories: Category[] | CategoryTree[];
  tree?: CategoryTree[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Tree response
export interface CategoryTreeResponse {
  tree: CategoryTree[];
  total: number;
}

// Detail response
export interface CategoryDetailResponse {
  category: Category;
  path: CategoryPath[];
}

// Category path element
export interface CategoryPath {
  id: string;
  name: string;
  slug: string;
}
```

### Frontend API Client Functions

Located in `frontend/src/lib/api/categories.ts`:

```typescript
// Get all categories
export const getCategories = async (filters?: {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  parentId?: string;
  tree?: boolean;
  includeProducts?: boolean;
}): Promise<CategoryListResponse>

// Get category by ID
export const getCategoryById = async (id: string): Promise<CategoryDetailResponse>

// Get category tree
export const getCategoryTree = async (status?: 'active' | 'inactive'): Promise<CategoryTreeResponse>

// Create category
export const createCategory = async (data: CreateCategoryRequest): Promise<Category>

// Update category
export const updateCategory = async (id: string, data: Partial<UpdateCategoryRequest>): Promise<Category>

// Delete category
export const deleteCategory = async (id: string): Promise<void>

// Create subcategory
export const createSubcategory = async (
  parentId: string,
  data: Omit<CreateCategoryRequest, 'parentId'>
): Promise<Category>

// Move category
export const moveCategory = async (
  id: string,
  data: CategoryMoveRequest
): Promise<Category>

// Reorder single category
export const reorderCategory = async (id: string, displayOrder: number): Promise<Category>

// Batch reorder
export const reorderCategoriesBatch = async (
  orders: CategoryReorderRequest[]
): Promise<Category[]>
```

### Example API Calls

#### cURL Examples

```bash
# Get category tree
curl -X GET "http://localhost:3001/api/v1/categories/tree?status=active" \
  -H "Authorization: Bearer <token>"

# Create root category
curl -X POST "http://localhost:3001/api/v1/categories" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "slug": "electronics",
    "status": "active"
  }'

# Create subcategory
curl -X POST "http://localhost:3001/api/v1/categories" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartphones",
    "slug": "smartphones",
    "parentId": "uuid-of-electronics"
  }'

# Move category
curl -X PUT "http://localhost:3001/api/v1/categories/uuid-of-category/move" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "parentId": "uuid-of-new-parent"
  }'

# Delete category
curl -X DELETE "http://localhost:3001/api/v1/categories/uuid-of-category" \
  -H "Authorization: Bearer <token>"
```

#### JavaScript/TypeScript Examples

```typescript
import { createCategory, getCategories, moveCategory } from '@/lib/api/categories';

// Create a root category
const rootCategory = await createCategory({
  name: 'Electronics',
  slug: 'electronics',
  status: 'active'
});

// Create a subcategory
const subcategory = await createCategory({
  name: 'Smartphones',
  slug: 'smartphones',
  parentId: rootCategory.id
});

// Get all categories as tree
const response = await getCategories({ tree: true });
const categoryTree = response.categories;

// Move category to new parent
const moved = await moveCategory(subcategory.id, {
  parentId: 'new-parent-id'
});
```

---

## Additional Resources

### Related Files

- **Backend Route**: [`backend/routes/categories.js`](backend/routes/categories.js)
- **Frontend API**: [`frontend/src/lib/api/categories.ts`](frontend/src/lib/api/categories.ts)
- **Category Types**: [`frontend/src/types/category.ts`](frontend/src/types/category.ts)
- **CategoryForm Component**: [`frontend/src/components/admin/CategoryForm.tsx`](frontend/src/components/admin/CategoryForm.tsx)
- **CategoryList Component**: [`frontend/src/components/admin/CategoryList.tsx`](frontend/src/components/admin/CategoryList.tsx)
- **CategoryTreeEditor**: [`frontend/src/components/admin/CategoryTreeEditor.tsx`](frontend/src/components/admin/CategoryTreeEditor.tsx)

### Admin Panel URLs

| Page | URL |
|------|-----|
| Categories List | `http://localhost:3000/admin/categories` |
| New Category | `http://localhost:3000/admin/categories/new` |
| Edit Category | `http://localhost:3000/admin/categories/:id/edit` |
| Tree Editor | `http://localhost:3000/admin/categories/tree` |

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-30  
**System Version:** Smart Tech B2C Website Redevelopment
