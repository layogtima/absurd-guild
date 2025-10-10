-- Migration 008: Create Projects Tables for Workbench Feature (Phase 1B)
-- Date: 2025-10-10
-- Creates projects and project_items for core workbench functionality

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

-- Indexes for projects table
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_slug ON projects(slug);

-- Indexes for project_items table
CREATE INDEX idx_project_items_project ON project_items(project_id);
CREATE INDEX idx_project_items_item ON project_items(item_id);
CREATE INDEX idx_project_items_status ON project_items(item_status);
