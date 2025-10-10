-- Migration 007: Create Items Tables for Workbench Feature (Phase 1A)
-- Date: 2025-10-10
-- Creates global item library for parts, tools, and supplies

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

-- Indexes for items table
CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_added_by ON items(added_by_user_id);

-- Indexes for item_resources table
CREATE INDEX idx_item_resources_item ON item_resources(item_id);
CREATE INDEX idx_item_resources_type ON item_resources(resource_type);
