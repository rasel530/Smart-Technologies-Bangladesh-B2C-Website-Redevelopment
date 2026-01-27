import { Brand } from './brand';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

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
  brands?: Brand[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface CategoryPath {
  id: string;
  name: string;
  slug: string;
}

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

export interface CategorySEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CategoryListResponse {
  categories: Category[];
  tree?: CategoryTree[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryTreeResponse {
  tree: CategoryTree[];
  total: number;
}

export interface CategoryDetailResponse {
  category: Category;
  path: CategoryPath[];
}

export interface CategoryProductsResponse {
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryReorderRequest {
  id: string;
  displayOrder: number;
}

export interface CategoryMoveRequest {
  parentId?: string;
}

export interface CategoryWithRelations extends Category {
  subcategories?: Category[];
  _count?: {
    products?: number;
    subcategories?: number;
  };
  bannerImage?: string;
  iconUrl?: string;
  isActive?: boolean;
}
