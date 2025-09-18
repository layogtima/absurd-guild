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
}

export interface CreateProductData {
  title: string;
  description?: string;
  price: number; // in paise
  shopify_url?: string;
  image_url?: string;
  category?: string;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number; // in paise
  shopify_url?: string;
  image_url?: string;
  category?: string;
  is_active?: boolean;
}
