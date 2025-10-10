-- Migration: Create project_links, project_images, and project_notes tables
-- Phase 1C: Project Enhancement

-- Project Links (GitHub, docs, shop links, etc - normalized!)
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

-- Project Images (normalized instead of JSON array)
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

-- Project Notes (timeline/log)
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

-- Indexes
CREATE INDEX idx_project_links_project ON project_links(project_id);
CREATE INDEX idx_project_images_project ON project_images(project_id);
CREATE INDEX idx_project_images_primary ON project_images(is_primary);
CREATE INDEX idx_project_notes_project ON project_notes(project_id);
CREATE INDEX idx_project_notes_pinned ON project_notes(is_pinned);
