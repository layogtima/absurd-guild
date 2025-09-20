// Remove this import as it's causing issues - D1Database is available in the global context

import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductStatus,
  ParsedProduct,
} from "~/types/product";
import { PROJECT_STATUSES, isProject, isReadyForSale } from "~/types/product";

export async function getUserProducts(
  db: D1Database,
  userId: number
): Promise<Product[]> {
  const result = await db
    .prepare(
      `SELECT * FROM products
       WHERE creator_id = ? AND is_active = TRUE
       ORDER BY created_at DESC`
    )
    .bind(userId)
    .all();

  return result.results as unknown as Product[];
}

export async function getReadyProducts(
  db: D1Database,
  userId: number
): Promise<Product[]> {
  const result = await db
    .prepare(
      `SELECT * FROM products
       WHERE creator_id = ? AND is_active = TRUE AND status = 'active'
       ORDER BY created_at DESC`
    )
    .bind(userId)
    .all();

  return result.results as unknown as Product[];
}

export async function getDevelopmentProjects(
  db: D1Database,
  userId: number
): Promise<Product[]> {
  const placeholders = PROJECT_STATUSES.map(() => '?').join(',');
  const result = await db
    .prepare(
      `SELECT * FROM products
       WHERE creator_id = ? AND is_active = TRUE AND status IN (${placeholders})
       ORDER BY created_at DESC`
    )
    .bind(userId, ...PROJECT_STATUSES)
    .all();

  return result.results as unknown as Product[];
}

export async function getProductById(
  db: D1Database,
  userId: number,
  productId: number
): Promise<Product | null> {
  const result = await db
    .prepare(
      `SELECT * FROM products
       WHERE id = ? AND creator_id = ? AND is_active = TRUE`
    )
    .bind(productId, userId)
    .first();

  return (result as unknown as Product) || null;
}

export async function createProduct(
  db: D1Database,
  userId: number,
  productData: CreateProductData
): Promise<Product> {
  // Generate slug from title
  const slug = generateSlug(productData.title);

  // Check if slug already exists for this user
  const existingProduct = await db
    .prepare(`SELECT id FROM products WHERE slug = ? AND creator_id = ?`)
    .bind(slug, userId)
    .first();

  if (existingProduct) {
    throw new Error("A product with this title already exists");
  }

  // Prepare JSON fields
  const imagesJson = productData.images ? JSON.stringify(productData.images) : null;
  const featuresJson = productData.features ? JSON.stringify(productData.features) : null;
  const specificationsJson = productData.specifications ? JSON.stringify(productData.specifications) : null;

  const result = await db
    .prepare(
      `INSERT INTO products (
        creator_id, title, slug, description, price,
        shopify_url, image_url, image_key, category, status,
        images, features, specifications, shipping_weight, stock_quantity,
        is_open_source, github_repo, documentation_url,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`
    )
    .bind(
      userId,
      productData.title,
      slug,
      productData.description || null,
      productData.price || 0,
      productData.shopify_url || "",
      productData.image_url || null,
      productData.image_key || null,
      productData.category || null,
      productData.status || 'active',
      imagesJson,
      featuresJson,
      specificationsJson,
      productData.shipping_weight || null,
      productData.stock_quantity || null,
      productData.is_open_source || false,
      productData.github_repo || null,
      productData.documentation_url || null
    )
    .first();

  if (!result) {
    throw new Error("Failed to create product");
  }

  return result as unknown as Product;
}

export async function updateProduct(
  db: D1Database,
  userId: number,
  productId: number,
  productData: UpdateProductData
): Promise<Product> {
  // Check if product exists and belongs to user
  const existingProduct = await getProductById(db, userId, productId);
  if (!existingProduct) {
    throw new Error("Product not found");
  }

  // If title is being updated, generate new slug and check uniqueness
  let slug = existingProduct.slug;
  if (productData.title && productData.title !== existingProduct.title) {
    slug = generateSlug(productData.title);

    const slugExists = await db
      .prepare(
        `SELECT id FROM products
         WHERE slug = ? AND creator_id = ? AND id != ?`
      )
      .bind(slug, userId, productId)
      .first();

    if (slugExists) {
      throw new Error("A product with this title already exists");
    }
  }

  // Prepare JSON fields
  const imagesJson = productData.images !== undefined
    ? (productData.images ? JSON.stringify(productData.images) : null)
    : undefined;
  const featuresJson = productData.features !== undefined
    ? (productData.features ? JSON.stringify(productData.features) : null)
    : undefined;
  const specificationsJson = productData.specifications !== undefined
    ? (productData.specifications ? JSON.stringify(productData.specifications) : null)
    : undefined;

  const result = await db
    .prepare(
      `UPDATE products SET
        title = COALESCE(?, title),
        slug = ?,
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        shopify_url = COALESCE(?, shopify_url),
        image_url = COALESCE(?, image_url),
        image_key = COALESCE(?, image_key),
        category = COALESCE(?, category),
        status = COALESCE(?, status),
        images = COALESCE(?, images),
        features = COALESCE(?, features),
        specifications = COALESCE(?, specifications),
        shipping_weight = COALESCE(?, shipping_weight),
        stock_quantity = COALESCE(?, stock_quantity),
        is_open_source = COALESCE(?, is_open_source),
        github_repo = COALESCE(?, github_repo),
        documentation_url = COALESCE(?, documentation_url),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND creator_id = ?
      RETURNING *`
    )
    .bind(
      productData.title || null,
      slug,
      productData.description !== undefined ? productData.description : null,
      productData.price || null,
      productData.shopify_url !== undefined ? (productData.shopify_url || "") : null,
      productData.image_url !== undefined ? productData.image_url : null,
      productData.image_key !== undefined ? productData.image_key : null,
      productData.category !== undefined ? productData.category : null,
      productData.status || null,
      imagesJson !== undefined ? imagesJson : null,
      featuresJson !== undefined ? featuresJson : null,
      specificationsJson !== undefined ? specificationsJson : null,
      productData.shipping_weight !== undefined ? productData.shipping_weight : null,
      productData.stock_quantity !== undefined ? productData.stock_quantity : null,
      productData.is_open_source !== undefined ? productData.is_open_source : null,
      productData.github_repo !== undefined ? productData.github_repo : null,
      productData.documentation_url !== undefined ? productData.documentation_url : null,
      productData.is_active !== undefined ? productData.is_active : null,
      productId,
      userId
    )
    .first();

  if (!result) {
    throw new Error("Failed to update product");
  }

  return result as unknown as Product;
}

export async function deleteProduct(
  db: D1Database,
  userId: number,
  productId: number
): Promise<void> {
  // Soft delete by setting is_active to false
  const result = await db
    .prepare(
      `UPDATE products SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND creator_id = ?`
    )
    .bind(productId, userId)
    .run();

  if (result.meta.rows_written === 0) {
    throw new Error("Product not found or already deleted");
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function parsePrice(priceString: string): number {
  // Remove currency symbols and parse as float, then convert to paise
  const cleanPrice = priceString.replace(/[₹,\s]/g, "");
  const price = parseFloat(cleanPrice);
  if (isNaN(price) || price < 0) {
    throw new Error("Invalid price format");
  }
  return Math.round(price * 100); // Convert to paise
}

// Helper function to parse JSON fields in products
export function parseProductFields(product: Product): ParsedProduct {
  return {
    ...product,
    images: product.images ? JSON.parse(product.images) : null,
    features: product.features ? JSON.parse(product.features) : null,
    specifications: product.specifications ? JSON.parse(product.specifications) : null,
  };
}

// Helper function to validate product status transitions
export function validateStatusTransition(currentStatus: ProductStatus, newStatus: ProductStatus): boolean {
  // Define allowed transitions
  const allowedTransitions: Record<ProductStatus, ProductStatus[]> = {
    'concept': ['development', 'active', 'discontinued'],
    'development': ['prototype', 'active', 'discontinued'],
    'prototype': ['testing', 'active', 'discontinued'],
    'testing': ['active', 'development', 'discontinued'],
    'active': ['out_of_stock', 'discontinued', 'development'],
    'out_of_stock': ['active', 'discontinued'],
    'discontinued': ['development', 'concept'] // Allow revival
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
}
