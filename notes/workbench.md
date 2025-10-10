# Workbench Feature - Project Management for Makers

## Overview

A project management system for makers to track hardware projects from conception to completion. Key features:

- **Mise-en-place approach**: Know what you have vs what you need before starting
- **Global item library**: Reusable parts/tools/supplies across all projects
- **Project lifecycle**: Private workbench → public product → crowdfunding campaign
- **Knowledge sharing**: Community-contributed items with links, notes, and tips

---

## Final Simplified Schema

### Key Design Decisions:

1. ✅ **"Items"** instead of "components" - simpler, more inclusive terminology
2. ✅ **Merged `projects` table** - combines workbench projects, products, and campaigns using `status` and `visibility` fields
3. ✅ **Normalized links** - single `project_links` table instead of hardcoded columns (github_repo, docs_url, etc.)
4. ✅ **Normalized images** - `project_images` table instead of JSON array
5. ✅ **Community-first** - no verification/moderation for items (can add later if needed)
6. ✅ **Item status tracking** - track project items through: needed → ordered → received

### Core Tables (5 total):

```sql
-- 1. Global Items Library (parts, tools, supplies)
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'part', 'tool', 'supply'
  category TEXT, -- electronics, mechanical, fasteners, soldering, measurement
  description TEXT,
  manufacturer TEXT,
  model_number TEXT,
  typical_unit_cost INTEGER, -- in paise
  unit TEXT, -- pieces, meters, grams, ml
  specifications TEXT, -- JSON: {"voltage": "5V", "current": "500mA"}
  tags TEXT, -- JSON: ["arduino", "sensor", "i2c"]
  image_key TEXT,
  image_url TEXT,
  added_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by_user_id) REFERENCES users(id)
);

-- 2. Item Resources (datasheets, suppliers, guides for global items)
CREATE TABLE item_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  title TEXT NOT NULL, -- "Datasheet", "Buy from DigiKey"
  url TEXT NOT NULL,
  resource_type TEXT, -- datasheet, supplier, guide, video, alternative, other
  price INTEGER, -- in paise (if supplier link)
  notes TEXT,
  added_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by_user_id) REFERENCES users(id)
);

-- 3. Projects (combines workbench projects, products, and basis for campaigns)
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE, -- For public URLs (null if private)
  description TEXT,
  long_description TEXT, -- Detailed markdown content
  version TEXT DEFAULT 'v1.0',
  status TEXT DEFAULT 'planning',
    -- planning, prototyping, testing (private workbench)
    -- completed (published product)
    -- campaign (active crowdfunding)
    -- archived
  visibility TEXT DEFAULT 'private', -- private, unlisted, public
  price INTEGER, -- in paise (if selling)
  category TEXT,
  tags TEXT, -- JSON array
  features TEXT, -- JSON array
  specifications TEXT, -- JSON object
  is_open_source BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER,
  shipping_weight INTEGER, -- in grams
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME, -- When it became public
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Project Items (items used in a specific project)
CREATE TABLE project_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL, -- Reference to global item
  quantity_needed INTEGER DEFAULT 1,
  quantity_have INTEGER DEFAULT 0,
  item_status TEXT DEFAULT 'needed', -- needed, ordered, received
  actual_unit_cost INTEGER, -- in paise (what I paid)
  vendor TEXT, -- Where I bought it
  purchased_at DATE,
  notes TEXT, -- Project-specific notes
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 5. Project Links (GitHub, docs, shop links, etc - normalized!)
CREATE TABLE project_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL, -- "Source Code", "Documentation", "Buy Now"
  url TEXT NOT NULL,
  link_type TEXT, -- code, docs, shop, demo, video, article, other
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_item_resources_item ON item_resources(item_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_project_items_project ON project_items(project_id);
CREATE INDEX idx_project_items_item ON project_items(item_id);
CREATE INDEX idx_project_links_project ON project_links(project_id);
```

### Optional Tables (add if needed):

```sql
-- 6. Project Images (normalized instead of JSON array)
CREATE TABLE project_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  image_key TEXT,
  image_url TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 7. Project Notes (timeline/log)
CREATE TABLE project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  note_type TEXT DEFAULT 'general', -- general, issue, solution, idea
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 8. Project Tasks (if task management needed)
CREATE TABLE project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  sort_order INTEGER DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Add indexes for optional tables
CREATE INDEX idx_project_images_project ON project_images(project_id);
CREATE INDEX idx_project_images_primary ON project_images(is_primary);
CREATE INDEX idx_project_notes_project ON project_notes(project_id);
CREATE INDEX idx_project_notes_pinned ON project_notes(is_pinned);
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
```

---

## Schema Summary

**Core Tables (5):** `items`, `item_resources`, `projects`, `project_items`, `project_links`

**Optional Tables (3):** `project_images`, `project_notes`, `project_tasks`

### Key Benefits:

1. ✅ **50% fewer tables** than original design
2. ✅ **Unified project lifecycle** - workbench → product → campaign in one table
3. ✅ **Global item library** - reusable across all users and projects
4. ✅ **Flexible extensibility** - no schema changes when adding new link/image types
5. ✅ **Consistent patterns** - items, links, images all follow same normalization approach

---

## Migration Strategy

### How to handle existing `products` table:

**Option 1: Migrate products to projects table**

```sql
-- Migrate existing products to projects
INSERT INTO projects (
  user_id, title, slug, description, status, visibility, price,
  category, is_open_source, created_at, updated_at, published_at
)
SELECT
  creator_id, title, slug, description,
  CASE
    WHEN status = 'draft' THEN 'planning'
    ELSE 'completed'
  END,
  'public', price,
  category, is_open_source, created_at, updated_at, created_at
FROM products;

-- Migrate product images to project_images
INSERT INTO project_images (project_id, image_key, image_url, is_primary, sort_order)
SELECT id, image_key, image_url, TRUE, 0
FROM products
WHERE image_key IS NOT NULL OR image_url IS NOT NULL;

-- Migrate product links (github_repo, documentation_url, shopify_url)
INSERT INTO project_links (project_id, title, url, link_type)
SELECT id, 'Source Code', github_repo, 'code' FROM products WHERE github_repo IS NOT NULL
UNION ALL
SELECT id, 'Documentation', documentation_url, 'docs' FROM products WHERE documentation_url IS NOT NULL
UNION ALL
SELECT id, 'Buy Now', shopify_url, 'shop' FROM products WHERE shopify_url IS NOT NULL;

-- Drop old products table
DROP TABLE products;
```

**Option 2: Keep products table, add projects for workbench**

- Less disruptive
- Run both in parallel initially
- Gradually migrate

**Recommendation: Option 1** - Clean slate, better long-term

---

## Implementation Decisions

### Phase 1: Core Tables

**All Confirmed Decisions:**

1. ✅ Use "item" instead of "component"
2. ✅ Merge products + projects into `projects` table
3. ✅ Normalize all links into `project_links`
4. ✅ Normalize images into `project_images`
5. ✅ Include optional tables (notes, tasks, images) in Phase 1
6. ✅ Migration strategy: Clean slate (Option 1)

### Schema Decisions:

#### Global Item Library Access

- **Decision:** All items visible to all users (fully public, community-driven)
- **Note:** Can add moderation/review feature later if abuse occurs
- **Removed:** `is_verified` and `usage_count` fields (deferred for future iteration)

#### Project Visibility & Status

- **Visibility transitions:** Projects can go from `public` back to `private`
- **Status flexibility:** All statuses allowed for all visibility levels (e.g., campaign can be private for soft launch)
- **Published timestamp:** `published_at` is immutable (records first time going public)
- **Note:** Projects can be public even while in progress (planning, prototyping, etc.)

#### Project Items Inventory

- **Quantity tracking:** `quantity_have` updated manually by user
- **Item status:** Track status per project item: `needed`, `ordered`, `received` (no "installed")
- **Auto-ready:** When `quantity_have >= quantity_needed`, item automatically marked as ready/complete

#### Existing Products Migration

- **Draft products:** Map `status = 'draft'` to `'planning'`, others to `'completed'`
- **Images:** Migrate all product images to `project_images` table with `is_primary = true`
- **Links:** Migrate github_repo, documentation_url, shopify_url to normalized `project_links`

### Routes & Pages for Phase 1

**Final Routes:**

- `/workbench` - All my projects (private and public)
- `/workbench/new` - Create new project
- `/workbench/:projectId` - View/edit project details + manage BOM inline
- `/items` - Browse global item library
- `/items/new` - Add new item to library (also accessible from within project page)
- `/items/:itemId` - View item details
- `/projects` - Browse all public projects (renamed from `/shop`)
- `/projects/:slug` - View public project page

**Notes:**

- BOM management integrated into `/workbench/:projectId` (no separate `/items` subroute)
- Item creation modal accessible from project page for quick additions
- `/shop` renamed to `/projects` for consistency

### UI/UX Build Order (Atomic Phases)

**Phase 1A: Items Foundation (First Priority)** ✅ COMPLETE

- [x] Migration: `items` + `item_resources` tables only
- [x] Route: `/items` - Browse all items (simple list)
- [x] Route: `/items/new` - Add new item to global library
- [x] Route: `/items/:itemId` - View item details
- [x] Server: `items.server.ts` with basic queries
- [ ] **Test:** Can browse, create, and view items

**Phase 1B: Projects + Project Items (Core Workbench)** ✅ COMPLETE

- [x] Migration: `projects` + `project_items` tables
- [x] Route: `/workbench` - List user's projects
- [x] Route: `/workbench/new` - Create new project
- [x] Route: `/workbench/:projectId` - View project + add items from global library
- [x] Server: `workbench.server.ts` with project + project_items queries
- [ ] **Test:** Can create project and populate it with items from library

**Phase 1C: Project Enhancement**

- [x] Migration: `project_links` + `project_images` + `project_notes` tables
- [x] Add links management to project page
- [x] Add image upload to project page
- [x] Add basic notes to project page
- [x] Add tasks notes to project page
- [ ] **Test:** Can add links, images, and notes to projects

**Phase 1D: Item Status & Quantities**

- [ ] Add quantity tracking UI (needed vs have)
- [ ] Add item status updates (needed → ordered → received)
- [ ] Add auto-ready indication when `quantity_have >= quantity_needed`
- [ ] **Test:** Can track project progress through item status

**Phase 1E: Public Projects**

- [ ] Route: `/projects` - Browse public projects
- [ ] Route: `/projects/:slug` - View public project page
- [ ] Server: `projects.server.ts` with public project queries
- [ ] **Test:** Can view public projects with BOM

**Phase 1F: Migration & Cleanup**

- [ ] Migration: Migrate existing products → projects
- [ ] Update `/dashboard` to link to `/workbench`
- [ ] Rename `/shop` → `/projects` with redirects
- [ ] Update Navigation component
- [ ] **Test:** Existing products work as projects

### Data Layer Strategy

**Approach:** Queries tailored to specific pages/components (not generic CRUD)

Each route will have custom queries optimized for its needs, e.g.:

- `/workbench` loader: Get user's projects with item counts, completion stats
- `/workbench/:projectId` loader: Get project + items + links + images + notes in single query
- `/items` loader: Get all items with resource counts, sorted by relevance
- `/projects` loader: Get public projects with primary images, stats

---

## Next Steps - Atomic Implementation Plan

### Phase 1A: Items Foundation ✅ COMPLETE

**Goal:** Global item library functional - browse, create, view items

1. **Migration:** Create `0007_create_items.sql`
   - [x] CREATE TABLE items
   - [x] CREATE TABLE item_resources
   - [x] Add indexes

2. **Server Functions:** Create `app/lib/items.server.ts`
   - [x] getAllItems(db, filters?) // For /items page with search/filter
   - [x] getItemById(db, id) // For /items/:itemId page
   - [x] createItem(db, data) // For /items/new action
   - [x] getItemResources(db, itemId) // For item details
   - [x] createItemResource(db, data) // Add resource links
   - [x] deleteItemResource(db, id) // Remove resources

3. **Routes:**
   - [x] `app/routes/items.tsx` - List all items
   - [x] `app/routes/items.new.tsx` - Create new item form
   - [x] `app/routes/items.$itemId.tsx` - View item details

4. **Test:**
   - [ ] Can view items list at `/items`
   - [ ] Can create new item at `/items/new`
   - [ ] Can view item details at `/items/:itemId`
   - [ ] Can add/delete resources
   - [ ] Search and filters work

---

### Phase 1B: Projects + BOM ✅ COMPLETE

**Goal:** Create projects and populate them with items from library

1. **Migration:** Create `0008_create_projects.sql`
   - [x] CREATE TABLE projects
   - [x] CREATE TABLE project_items
   - [x] Add indexes

2. **Server Functions:** Create `app/lib/workbench.server.ts`
   - [x] getUserProjects(db, userId) // For /workbench
   - [x] getProjectById(db, projectId) // For /workbench/:projectId
   - [x] getProjectItems(db, projectId) // Get project BOM
   - [x] createProject(db, userId, data)
   - [x] addItemToProject(db, projectId, itemId, data)
   - [x] updateProjectItem(db, id, data)
   - [x] removeProjectItem(db, id)

3. **Routes:**
   - [x] `app/routes/workbench.tsx` - List user's projects
   - [x] `app/routes/workbench.new.tsx` - Create new project
   - [x] `app/routes/workbench.$projectId.tsx` - View/edit project + manage BOM

4. **Test:**
   - [ ] Can create project at `/workbench/new`
   - [ ] Can view project at `/workbench/:projectId`
   - [ ] Can add items from library to project
   - [ ] Can view project BOM
   - [ ] Can update item quantities and status
   - [ ] Can remove items from project

---

### Subsequent Phases (1C-1F)

Will be detailed once Phase 1A and 1B are complete and tested.
