import type { D1Database } from "@cloudflare/workers-types";
import type { Item } from "./items.server";

export interface Project {
  id: number;
  user_id: number;
  title: string;
  slug: string | null;
  description: string | null;
  long_description: string | null;
  version: string;
  status: string;
  visibility: string;
  price: number | null;
  category: string | null;
  tags: string | null; // JSON array
  features: string | null; // JSON array
  specifications: string | null; // JSON object
  is_open_source: boolean;
  stock_quantity: number | null;
  shipping_weight: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ProjectItem {
  id: number;
  project_id: number;
  item_id: number;
  quantity_needed: number;
  quantity_have: number;
  item_status: string;
  actual_unit_cost: number | null;
  vendor: string | null;
  purchased_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectItemWithDetails extends ProjectItem {
  item: Item;
}

export interface CreateProjectData {
  user_id: number;
  title: string;
  description?: string;
  status?: string;
  visibility?: string;
  category?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  long_description?: string;
  version?: string;
  status?: string;
  visibility?: string;
  price?: number;
  category?: string;
  tags?: string;
  features?: string;
  specifications?: string;
  is_open_source?: boolean;
  stock_quantity?: number;
  shipping_weight?: number;
}

export interface AddItemToProjectData {
  project_id: number;
  item_id: number;
  quantity_needed?: number;
  quantity_have?: number;
  item_status?: string;
  actual_unit_cost?: number;
  vendor?: string;
  purchased_at?: string;
  notes?: string;
  sort_order?: number;
}

export interface ProjectLink {
  id: number;
  project_id: number;
  title: string;
  url: string;
  link_type: string | null;
  sort_order: number;
  created_at: string;
}

export interface CreateProjectLinkData {
  project_id: number;
  title: string;
  url: string;
  link_type?: string;
  sort_order?: number;
}

export interface ProjectImage {
  id: number;
  project_id: number;
  image_key: string | null;
  image_url: string | null;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface CreateProjectImageData {
  project_id: number;
  image_key?: string;
  image_url?: string;
  caption?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProjectNote {
  id: number;
  project_id: number;
  content: string;
  is_pinned: boolean;
  note_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectNoteData {
  project_id: number;
  content: string;
  is_pinned?: boolean;
  note_type?: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  status: string;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
}

export interface CreateProjectTaskData {
  project_id: number;
  title: string;
  status?: string;
  sort_order?: number;
}

/**
 * Get all projects for a specific user
 * Optionally filter by status and/or visibility
 */
export async function getUserProjects(
  db: D1Database,
  userId: number,
  filters?: {
    status?: string;
    visibility?: string;
  }
): Promise<Project[]> {
  let query = "SELECT * FROM projects WHERE user_id = ?";
  const params: any[] = [userId];

  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters?.visibility) {
    query += " AND visibility = ?";
    params.push(filters.visibility);
  }

  query += " ORDER BY updated_at DESC";

  const result = await db.prepare(query).bind(...params).all<Project>();
  return result.results || [];
}

/**
 * Get a single project by ID
 */
export async function getProjectById(
  db: D1Database,
  projectId: number
): Promise<Project | null> {
  const result = await db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .bind(projectId)
    .first<Project>();

  return result;
}

/**
 * Get all items for a specific project with full item details
 */
export async function getProjectItems(
  db: D1Database,
  projectId: number
): Promise<ProjectItemWithDetails[]> {
  const result = await db
    .prepare(
      `SELECT
        pi.*,
        i.id as item_id,
        i.name as item_name,
        i.item_type,
        i.category as item_category,
        i.description as item_description,
        i.manufacturer,
        i.model_number,
        i.typical_unit_cost,
        i.unit,
        i.specifications as item_specifications,
        i.tags as item_tags,
        i.image_key,
        i.image_url,
        i.added_by_user_id,
        i.created_at as item_created_at,
        i.updated_at as item_updated_at
      FROM project_items pi
      JOIN items i ON pi.item_id = i.id
      WHERE pi.project_id = ?
      ORDER BY pi.sort_order ASC, pi.created_at ASC`
    )
    .bind(projectId)
    .all();

  const items = (result.results || []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    item_id: row.item_id,
    quantity_needed: row.quantity_needed,
    quantity_have: row.quantity_have,
    item_status: row.item_status,
    actual_unit_cost: row.actual_unit_cost,
    vendor: row.vendor,
    purchased_at: row.purchased_at,
    notes: row.notes,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    item: {
      id: row.item_id,
      name: row.item_name,
      item_type: row.item_type,
      category: row.item_category,
      description: row.item_description,
      manufacturer: row.manufacturer,
      model_number: row.model_number,
      typical_unit_cost: row.typical_unit_cost,
      unit: row.unit,
      specifications: row.item_specifications,
      tags: row.item_tags,
      image_key: row.image_key,
      image_url: row.image_url,
      added_by_user_id: row.added_by_user_id,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at,
    },
  }));

  return items;
}

/**
 * Create a new project
 */
export async function createProject(
  db: D1Database,
  data: CreateProjectData
): Promise<Project> {
  const result = await db
    .prepare(
      `INSERT INTO projects (
        user_id, title, description, status, visibility, category
      ) VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      data.user_id,
      data.title,
      data.description || null,
      data.status || "planning",
      data.visibility || "private",
      data.category || null
    )
    .first<Project>();

  if (!result) {
    throw new Error("Failed to create project");
  }

  return result;
}

/**
 * Update an existing project
 */
export async function updateProject(
  db: D1Database,
  projectId: number,
  data: UpdateProjectData
): Promise<Project> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    params.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.long_description !== undefined) {
    updates.push("long_description = ?");
    params.push(data.long_description);
  }
  if (data.version !== undefined) {
    updates.push("version = ?");
    params.push(data.version);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);
  }
  if (data.visibility !== undefined) {
    updates.push("visibility = ?");
    params.push(data.visibility);
  }
  if (data.price !== undefined) {
    updates.push("price = ?");
    params.push(data.price);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    params.push(data.category);
  }
  if (data.tags !== undefined) {
    updates.push("tags = ?");
    params.push(data.tags);
  }
  if (data.features !== undefined) {
    updates.push("features = ?");
    params.push(data.features);
  }
  if (data.specifications !== undefined) {
    updates.push("specifications = ?");
    params.push(data.specifications);
  }
  if (data.is_open_source !== undefined) {
    updates.push("is_open_source = ?");
    params.push(data.is_open_source);
  }
  if (data.stock_quantity !== undefined) {
    updates.push("stock_quantity = ?");
    params.push(data.stock_quantity);
  }
  if (data.shipping_weight !== undefined) {
    updates.push("shipping_weight = ?");
    params.push(data.shipping_weight);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(projectId);

  const result = await db
    .prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...params)
    .first<Project>();

  if (!result) {
    throw new Error("Failed to update project");
  }

  return result;
}

/**
 * Add an item to a project
 */
export async function addItemToProject(
  db: D1Database,
  data: AddItemToProjectData
): Promise<ProjectItem> {
  const result = await db
    .prepare(
      `INSERT INTO project_items (
        project_id, item_id, quantity_needed, quantity_have, item_status,
        actual_unit_cost, vendor, purchased_at, notes, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      data.project_id,
      data.item_id,
      data.quantity_needed || 1,
      data.quantity_have || 0,
      data.item_status || "needed",
      data.actual_unit_cost || null,
      data.vendor || null,
      data.purchased_at || null,
      data.notes || null,
      data.sort_order || 0
    )
    .first<ProjectItem>();

  if (!result) {
    throw new Error("Failed to add item to project");
  }

  return result;
}

/**
 * Update a project item
 */
export async function updateProjectItem(
  db: D1Database,
  projectItemId: number,
  data: Partial<AddItemToProjectData>
): Promise<ProjectItem> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.quantity_needed !== undefined) {
    updates.push("quantity_needed = ?");
    params.push(data.quantity_needed);
  }
  if (data.quantity_have !== undefined) {
    updates.push("quantity_have = ?");
    params.push(data.quantity_have);
  }
  if (data.item_status !== undefined) {
    updates.push("item_status = ?");
    params.push(data.item_status);
  }
  if (data.actual_unit_cost !== undefined) {
    updates.push("actual_unit_cost = ?");
    params.push(data.actual_unit_cost);
  }
  if (data.vendor !== undefined) {
    updates.push("vendor = ?");
    params.push(data.vendor);
  }
  if (data.purchased_at !== undefined) {
    updates.push("purchased_at = ?");
    params.push(data.purchased_at);
  }
  if (data.notes !== undefined) {
    updates.push("notes = ?");
    params.push(data.notes);
  }
  if (data.sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(data.sort_order);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(projectItemId);

  const result = await db
    .prepare(
      `UPDATE project_items SET ${updates.join(", ")} WHERE id = ? RETURNING *`
    )
    .bind(...params)
    .first<ProjectItem>();

  if (!result) {
    throw new Error("Failed to update project item");
  }

  return result;
}

/**
 * Remove an item from a project
 */
export async function removeProjectItem(
  db: D1Database,
  projectItemId: number
): Promise<void> {
  await db
    .prepare("DELETE FROM project_items WHERE id = ?")
    .bind(projectItemId)
    .run();
}

/**
 * Delete a project (and all its items via CASCADE)
 */
export async function deleteProject(
  db: D1Database,
  projectId: number
): Promise<void> {
  await db.prepare("DELETE FROM projects WHERE id = ?").bind(projectId).run();
}

// ===== PROJECT LINKS =====

/**
 * Get all links for a project
 */
export async function getProjectLinks(
  db: D1Database,
  projectId: number
): Promise<ProjectLink[]> {
  const result = await db
    .prepare(
      "SELECT * FROM project_links WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC"
    )
    .bind(projectId)
    .all<ProjectLink>();

  return result.results || [];
}

/**
 * Create a new project link
 */
export async function createProjectLink(
  db: D1Database,
  data: CreateProjectLinkData
): Promise<ProjectLink> {
  const result = await db
    .prepare(
      `INSERT INTO project_links (project_id, title, url, link_type, sort_order)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(
      data.project_id,
      data.title,
      data.url,
      data.link_type || null,
      data.sort_order || 0
    )
    .first<ProjectLink>();

  if (!result) {
    throw new Error("Failed to create project link");
  }

  return result;
}

/**
 * Update a project link
 */
export async function updateProjectLink(
  db: D1Database,
  linkId: number,
  data: Partial<CreateProjectLinkData>
): Promise<ProjectLink> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    params.push(data.title);
  }
  if (data.url !== undefined) {
    updates.push("url = ?");
    params.push(data.url);
  }
  if (data.link_type !== undefined) {
    updates.push("link_type = ?");
    params.push(data.link_type);
  }
  if (data.sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(data.sort_order);
  }

  params.push(linkId);

  const result = await db
    .prepare(`UPDATE project_links SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...params)
    .first<ProjectLink>();

  if (!result) {
    throw new Error("Failed to update project link");
  }

  return result;
}

/**
 * Delete a project link
 */
export async function deleteProjectLink(
  db: D1Database,
  linkId: number
): Promise<void> {
  await db.prepare("DELETE FROM project_links WHERE id = ?").bind(linkId).run();
}

// ===== PROJECT IMAGES =====

/**
 * Get all images for a project
 */
export async function getProjectImages(
  db: D1Database,
  projectId: number
): Promise<ProjectImage[]> {
  const result = await db
    .prepare(
      "SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC"
    )
    .bind(projectId)
    .all<ProjectImage>();

  return result.results || [];
}

/**
 * Create a new project image
 */
export async function createProjectImage(
  db: D1Database,
  data: CreateProjectImageData
): Promise<ProjectImage> {
  const result = await db
    .prepare(
      `INSERT INTO project_images (project_id, image_key, image_url, caption, is_primary, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(
      data.project_id,
      data.image_key || null,
      data.image_url || null,
      data.caption || null,
      data.is_primary || false,
      data.sort_order || 0
    )
    .first<ProjectImage>();

  if (!result) {
    throw new Error("Failed to create project image");
  }

  return result;
}

/**
 * Update a project image
 */
export async function updateProjectImage(
  db: D1Database,
  imageId: number,
  data: Partial<CreateProjectImageData>
): Promise<ProjectImage> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.image_key !== undefined) {
    updates.push("image_key = ?");
    params.push(data.image_key);
  }
  if (data.image_url !== undefined) {
    updates.push("image_url = ?");
    params.push(data.image_url);
  }
  if (data.caption !== undefined) {
    updates.push("caption = ?");
    params.push(data.caption);
  }
  if (data.is_primary !== undefined) {
    updates.push("is_primary = ?");
    params.push(data.is_primary);
  }
  if (data.sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(data.sort_order);
  }

  params.push(imageId);

  const result = await db
    .prepare(`UPDATE project_images SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...params)
    .first<ProjectImage>();

  if (!result) {
    throw new Error("Failed to update project image");
  }

  return result;
}

/**
 * Delete a project image
 */
export async function deleteProjectImage(
  db: D1Database,
  imageId: number
): Promise<void> {
  await db.prepare("DELETE FROM project_images WHERE id = ?").bind(imageId).run();
}

// ===== PROJECT NOTES =====

/**
 * Get all notes for a project
 */
export async function getProjectNotes(
  db: D1Database,
  projectId: number
): Promise<ProjectNote[]> {
  const result = await db
    .prepare(
      `SELECT * FROM project_notes
       WHERE project_id = ?
       ORDER BY is_pinned DESC, created_at DESC`
    )
    .bind(projectId)
    .all<ProjectNote>();

  return result.results || [];
}

/**
 * Create a new project note
 */
export async function createProjectNote(
  db: D1Database,
  data: CreateProjectNoteData
): Promise<ProjectNote> {
  const result = await db
    .prepare(
      `INSERT INTO project_notes (project_id, content, is_pinned, note_type)
       VALUES (?, ?, ?, ?)
       RETURNING *`
    )
    .bind(
      data.project_id,
      data.content,
      data.is_pinned || false,
      data.note_type || "general"
    )
    .first<ProjectNote>();

  if (!result) {
    throw new Error("Failed to create project note");
  }

  return result;
}

/**
 * Update a project note
 */
export async function updateProjectNote(
  db: D1Database,
  noteId: number,
  data: Partial<CreateProjectNoteData>
): Promise<ProjectNote> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.content !== undefined) {
    updates.push("content = ?");
    params.push(data.content);
  }
  if (data.is_pinned !== undefined) {
    updates.push("is_pinned = ?");
    params.push(data.is_pinned);
  }
  if (data.note_type !== undefined) {
    updates.push("note_type = ?");
    params.push(data.note_type);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(noteId);

  const result = await db
    .prepare(`UPDATE project_notes SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...params)
    .first<ProjectNote>();

  if (!result) {
    throw new Error("Failed to update project note");
  }

  return result;
}

/**
 * Delete a project note
 */
export async function deleteProjectNote(
  db: D1Database,
  noteId: number
): Promise<void> {
  await db.prepare("DELETE FROM project_notes WHERE id = ?").bind(noteId).run();
}

// ===== PROJECT TASKS =====

/**
 * Get all tasks for a project
 */
export async function getProjectTasks(
  db: D1Database,
  projectId: number
): Promise<ProjectTask[]> {
  const result = await db
    .prepare(
      `SELECT * FROM project_tasks
       WHERE project_id = ?
       ORDER BY sort_order ASC, created_at ASC`
    )
    .bind(projectId)
    .all<ProjectTask>();

  return result.results || [];
}

/**
 * Create a new project task
 */
export async function createProjectTask(
  db: D1Database,
  data: CreateProjectTaskData
): Promise<ProjectTask> {
  const result = await db
    .prepare(
      `INSERT INTO project_tasks (project_id, title, status, sort_order)
       VALUES (?, ?, ?, ?)
       RETURNING *`
    )
    .bind(
      data.project_id,
      data.title,
      data.status || "pending",
      data.sort_order || 0
    )
    .first<ProjectTask>();

  if (!result) {
    throw new Error("Failed to create project task");
  }

  return result;
}

/**
 * Update a project task
 */
export async function updateProjectTask(
  db: D1Database,
  taskId: number,
  data: Partial<CreateProjectTaskData> & { status?: string; completed_at?: string }
): Promise<ProjectTask> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    params.push(data.title);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);

    // Set completed_at when status changes to completed
    if (data.status === "completed") {
      updates.push("completed_at = CURRENT_TIMESTAMP");
    } else if (data.status !== "completed") {
      updates.push("completed_at = NULL");
    }
  }
  if (data.sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(data.sort_order);
  }

  params.push(taskId);

  const result = await db
    .prepare(`UPDATE project_tasks SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...params)
    .first<ProjectTask>();

  if (!result) {
    throw new Error("Failed to update project task");
  }

  return result;
}

/**
 * Delete a project task
 */
export async function deleteProjectTask(
  db: D1Database,
  taskId: number
): Promise<void> {
  await db.prepare("DELETE FROM project_tasks WHERE id = ?").bind(taskId).run();
}
