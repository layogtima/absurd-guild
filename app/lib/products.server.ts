// Remove this import as it's causing issues - D1Database is available in the global context

import type {
  Product,
  CreateProductData,
  UpdateProductData,
} from "~/types/product";

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

  const result = await db
    .prepare(
      `INSERT INTO products (
        creator_id, title, slug, description, price,
        shopify_url, image_url, category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`
    )
    .bind(
      userId,
      productData.title,
      slug,
      productData.description || null,
      productData.price,
      productData.shopify_url || null,
      productData.image_url || null,
      productData.category || null
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

  const result = await db
    .prepare(
      `UPDATE products SET
        title = COALESCE(?, title),
        slug = ?,
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        shopify_url = COALESCE(?, shopify_url),
        image_url = COALESCE(?, image_url),
        category = COALESCE(?, category),
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
      productData.shopify_url !== undefined ? productData.shopify_url : null,
      productData.image_url !== undefined ? productData.image_url : null,
      productData.category !== undefined ? productData.category : null,
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
