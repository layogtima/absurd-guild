// Product status types
export type ProductStatus =
  | 'active'          // Ready for sale
  | 'out_of_stock'    // Temporarily unavailable
  | 'discontinued'    // No longer available
  | 'concept'         // Early idea stage
  | 'development'     // Actively being developed
  | 'prototype'       // Prototype stage
  | 'testing';        // Testing phase

// Helper functions for status handling
export const PROJECT_STATUSES: ProductStatus[] = ['concept', 'development', 'prototype', 'testing'];
export const SHOP_STATUSES: ProductStatus[] = ['active', 'out_of_stock', 'discontinued'];

export function isProject(status: ProductStatus): boolean {
  return PROJECT_STATUSES.includes(status);
}

export function isReadyForSale(status: ProductStatus): boolean {
  return status === 'active';
}

export function getStatusDisplayName(status: ProductStatus): string {
  const displayNames: Record<ProductStatus, string> = {
    active: 'In Stock',
    out_of_stock: 'Out of Stock',
    discontinued: 'Discontinued',
    concept: 'Concept',
    development: 'Development',
    prototype: 'Prototype',
    testing: 'Testing'
  };
  return displayNames[status];
}

export interface Product {
  id: number;
  creator_id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number; // in paise
  shopify_product_id: string | null;
  shopify_url: string | null;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Enhanced fields from migration 003
  status: ProductStatus;
  images: string | null; // JSON array of image URLs
  features: string | null; // JSON array of features
  specifications: string | null; // JSON object of specs
  shipping_weight: number | null; // in grams
  stock_quantity: number | null;
  is_open_source: boolean;
  github_repo: string | null;
  documentation_url: string | null;
}

export interface CreateProductData {
  title: string;
  description?: string;
  price?: number; // in paise - optional for development projects
  shopify_url?: string;
  image_url?: string;
  category?: string;
  status?: ProductStatus;
  // Enhanced fields
  images?: string[]; // Array of image URLs (will be JSON stringified)
  features?: string[]; // Array of features (will be JSON stringified)
  specifications?: Record<string, string>; // Specs object (will be JSON stringified)
  shipping_weight?: number; // in grams
  stock_quantity?: number;
  is_open_source?: boolean;
  github_repo?: string;
  documentation_url?: string;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number; // in paise
  shopify_url?: string;
  image_url?: string;
  category?: string;
  is_active?: boolean;
  status?: ProductStatus;
  // Enhanced fields
  images?: string[]; // Array of image URLs (will be JSON stringified)
  features?: string[]; // Array of features (will be JSON stringified)
  specifications?: Record<string, string>; // Specs object (will be JSON stringified)
  shipping_weight?: number; // in grams
  stock_quantity?: number;
  is_open_source?: boolean;
  github_repo?: string;
  documentation_url?: string;
}

// Helper types for working with parsed JSON fields
export interface ParsedProduct extends Omit<Product, 'images' | 'features' | 'specifications'> {
  images: string[] | null;
  features: string[] | null;
  specifications: Record<string, string> | null;
}
