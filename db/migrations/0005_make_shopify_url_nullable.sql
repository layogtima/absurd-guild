-- Migration 005: Make shopify_url nullable and price nullable for development projects
-- Development projects don't need a shop URL or final pricing

PRAGMA foreign_keys = OFF;

-- Recreate products table with nullable shopify_url and price
CREATE TABLE products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0, -- Made nullable/default 0 for development projects
  shopify_product_id TEXT,
  shopify_url TEXT, -- Made nullable for development projects
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Enhanced fields from migration 003
  status TEXT DEFAULT 'active',
  images TEXT,
  features TEXT,
  specifications TEXT,
  shipping_weight INTEGER,
  stock_quantity INTEGER,
  is_open_source BOOLEAN DEFAULT FALSE,
  github_repo TEXT,
  documentation_url TEXT,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data, handling any existing NULL values
INSERT INTO products_new SELECT
  id, creator_id, title, slug, description,
  COALESCE(price, 0), shopify_product_id,
  COALESCE(shopify_url, ''), image_url, category,
  is_active, created_at, updated_at, status,
  images, features, specifications, shipping_weight,
  stock_quantity, is_open_source, github_repo, documentation_url
FROM products;

-- Drop old table and rename new one
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_open_source ON products(is_open_source);

PRAGMA foreign_keys = ON;