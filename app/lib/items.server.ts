import type { D1Database } from "@cloudflare/workers-types";

export interface Item {
  id: number;
  name: string;
  item_type: "part" | "tool" | "supply";
  category: string | null;
  description: string | null;
  manufacturer: string | null;
  model_number: string | null;
  typical_unit_cost: number | null;
  unit: string | null;
  specifications: string | null; // JSON string
  tags: string | null; // JSON array string
  image_key: string | null;
  image_url: string | null;
  added_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ItemResource {
  id: number;
  item_id: number;
  title: string;
  url: string;
  resource_type: string | null;
  price: number | null;
  notes: string | null;
  added_by_user_id: number | null;
  created_at: string;
}

export interface CreateItemData {
  name: string;
  item_type: "part" | "tool" | "supply";
  category?: string;
  description?: string;
  manufacturer?: string;
  model_number?: string;
  typical_unit_cost?: number;
  unit?: string;
  specifications?: string; // JSON string
  tags?: string; // JSON array string
  image_key?: string;
  image_url?: string;
  added_by_user_id?: number;
}

export interface CreateItemResourceData {
  item_id: number;
  title: string;
  url: string;
  resource_type?: string;
  price?: number;
  notes?: string;
  added_by_user_id?: number;
}

/**
 * Get all items from the global library
 * Supports optional filtering by type and category
 */
export async function getAllItems(
  db: D1Database,
  filters?: {
    item_type?: "part" | "tool" | "supply";
    category?: string;
    search?: string;
  }
): Promise<Item[]> {
  let query = "SELECT * FROM items";
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.item_type) {
    conditions.push("item_type = ?");
    params.push(filters.item_type);
  }

  if (filters?.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }

  if (filters?.search) {
    conditions.push(
      "(name LIKE ? OR description LIKE ? OR manufacturer LIKE ? OR model_number LIKE ?)"
    );
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY name ASC";

  const result = await db.prepare(query).bind(...params).all<Item>();
  return result.results || [];
}

/**
 * Get a single item by ID with its resources
 */
export async function getItemById(
  db: D1Database,
  id: number
): Promise<{ item: Item; resources: ItemResource[] } | null> {
  const item = await db
    .prepare("SELECT * FROM items WHERE id = ?")
    .bind(id)
    .first<Item>();

  if (!item) {
    return null;
  }

  const resources = await getItemResources(db, id);

  return { item, resources };
}

/**
 * Get all resources for a specific item
 */
export async function getItemResources(
  db: D1Database,
  itemId: number
): Promise<ItemResource[]> {
  const result = await db
    .prepare(
      "SELECT * FROM item_resources WHERE item_id = ? ORDER BY created_at ASC"
    )
    .bind(itemId)
    .all<ItemResource>();

  return result.results || [];
}

/**
 * Create a new item in the global library
 */
export async function createItem(
  db: D1Database,
  data: CreateItemData
): Promise<Item> {
  const result = await db
    .prepare(
      `INSERT INTO items (
        name, item_type, category, description, manufacturer, model_number,
        typical_unit_cost, unit, specifications, tags, image_key, image_url,
        added_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      data.name,
      data.item_type,
      data.category || null,
      data.description || null,
      data.manufacturer || null,
      data.model_number || null,
      data.typical_unit_cost || null,
      data.unit || null,
      data.specifications || null,
      data.tags || null,
      data.image_key || null,
      data.image_url || null,
      data.added_by_user_id || null
    )
    .first<Item>();

  if (!result) {
    throw new Error("Failed to create item");
  }

  return result;
}

/**
 * Update an existing item
 */
export async function updateItem(
  db: D1Database,
  id: number,
  data: Partial<CreateItemData>
): Promise<Item> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.item_type !== undefined) {
    updates.push("item_type = ?");
    params.push(data.item_type);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    params.push(data.category);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.manufacturer !== undefined) {
    updates.push("manufacturer = ?");
    params.push(data.manufacturer);
  }
  if (data.model_number !== undefined) {
    updates.push("model_number = ?");
    params.push(data.model_number);
  }
  if (data.typical_unit_cost !== undefined) {
    updates.push("typical_unit_cost = ?");
    params.push(data.typical_unit_cost);
  }
  if (data.unit !== undefined) {
    updates.push("unit = ?");
    params.push(data.unit);
  }
  if (data.specifications !== undefined) {
    updates.push("specifications = ?");
    params.push(data.specifications);
  }
  if (data.tags !== undefined) {
    updates.push("tags = ?");
    params.push(data.tags);
  }
  if (data.image_key !== undefined) {
    updates.push("image_key = ?");
    params.push(data.image_key);
  }
  if (data.image_url !== undefined) {
    updates.push("image_url = ?");
    params.push(data.image_url);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");

  params.push(id);

  const result = await db
    .prepare(
      `UPDATE items SET ${updates.join(", ")} WHERE id = ? RETURNING *`
    )
    .bind(...params)
    .first<Item>();

  if (!result) {
    throw new Error("Failed to update item");
  }

  return result;
}

/**
 * Add a resource to an item
 */
export async function createItemResource(
  db: D1Database,
  data: CreateItemResourceData
): Promise<ItemResource> {
  const result = await db
    .prepare(
      `INSERT INTO item_resources (
        item_id, title, url, resource_type, price, notes, added_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      data.item_id,
      data.title,
      data.url,
      data.resource_type || null,
      data.price || null,
      data.notes || null,
      data.added_by_user_id || null
    )
    .first<ItemResource>();

  if (!result) {
    throw new Error("Failed to create item resource");
  }

  return result;
}

/**
 * Delete an item resource
 */
export async function deleteItemResource(
  db: D1Database,
  id: number
): Promise<void> {
  await db.prepare("DELETE FROM item_resources WHERE id = ?").bind(id).run();
}
