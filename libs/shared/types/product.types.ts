/**
 * Product Response Types
 * Based on Product và Category models trong product-app Prisma schema
 */

// Product response types for API responses
export type ProductResponse = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  priceInt: number; // Price in cents (e.g., 1999 = $19.99)
  stock: number;
  description: string | null;
  imageUrls: string[];
  categoryId: string | null;
  attributes: Record<string, unknown> | null; // Json field trong Prisma
  model3dUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: CategoryResponse | null; // Populated từ relation
};

// Category response types for API responses
export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: CategoryResponse | null;
  children?: CategoryResponse[];
};

// Paginated list response for products
export type PaginatedProductsResponse = {
  products: ProductResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Paginated list response for categories
export type PaginatedCategoriesResponse = {
  categories: CategoryResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Product with category details
export type ProductWithCategory = ProductResponse & {
  category: CategoryResponse | null;
};

// Category with children and products
export type CategoryWithRelations = CategoryResponse & {
  children: CategoryResponse[];
  products?: ProductResponse[];
  parent?: CategoryResponse | null;
};

// Stock change result
export type StockChangeResult = {
  productId: string;
  previousStock: number;
  newStock: number;
  quantityChanged: number;
};
