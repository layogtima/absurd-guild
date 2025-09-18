-- Migration 004: Add CASCADE behavior to foreign key constraints
-- SQLite doesn't support ALTER TABLE for foreign keys, so we use the table recreation method
-- This is the standard approach for SQLite schema changes

-- Note: Unfortunately, SQLite doesn't support:
-- 1. ALTER TABLE ... DROP CONSTRAINT
-- 2. ALTER TABLE ... ADD CONSTRAINT with CASCADE
-- 3. Modifying existing foreign key constraints
--
-- The table recreation method is the official SQLite approach for this type of change.
-- This ensures data integrity while adding the CASCADE behavior you need for user deletion.

PRAGMA foreign_keys = OFF;

-- 1. User sessions - cascade delete when user is deleted
CREATE TABLE user_sessions_new (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_sessions_new SELECT * FROM user_sessions;
DROP TABLE user_sessions;
ALTER TABLE user_sessions_new RENAME TO user_sessions;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- 2. Shipping addresses - cascade delete when user is deleted
CREATE TABLE shipping_addresses_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  phone TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO shipping_addresses_new SELECT * FROM shipping_addresses;
DROP TABLE shipping_addresses;
ALTER TABLE shipping_addresses_new RENAME TO shipping_addresses;

-- 3. Maker profile links - cascade delete when user is deleted
CREATE TABLE maker_profile_links_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO maker_profile_links_new SELECT * FROM maker_profile_links;
DROP TABLE maker_profile_links;
ALTER TABLE maker_profile_links_new RENAME TO maker_profile_links;
CREATE INDEX IF NOT EXISTS idx_maker_profile_links_user ON maker_profile_links(user_id);
CREATE INDEX IF NOT EXISTS idx_maker_profile_links_featured ON maker_profile_links(is_featured);
CREATE INDEX IF NOT EXISTS idx_maker_profile_links_order ON maker_profile_links(user_id, sort_order);

-- 4. Campaigns - cascade delete when user (creator) is deleted
CREATE TABLE campaigns_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  hero_video_url TEXT,
  hero_image_url TEXT,
  funding_goal INTEGER NOT NULL,
  current_funding INTEGER DEFAULT 0,
  commitment_percentage INTEGER DEFAULT 40,
  status TEXT DEFAULT 'draft',
  category TEXT,
  estimated_shipping_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ends_at DATETIME,
  story_content TEXT,
  risk_disclosure TEXT,
  shipping_info TEXT,
  faq_data TEXT,
  tags TEXT,
  featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO campaigns_new SELECT * FROM campaigns;
DROP TABLE campaigns;
ALTER TABLE campaigns_new RENAME TO campaigns;
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON campaigns(featured);
CREATE INDEX IF NOT EXISTS idx_campaigns_tags ON campaigns(tags);

-- 5. Products - cascade delete when user (creator) is deleted
CREATE TABLE products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  shopify_product_id TEXT,
  shopify_url TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

INSERT INTO products_new SELECT * FROM products;
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_open_source ON products(is_open_source);

-- Now handle campaign-related cascades (these depend on campaigns existing)

-- 6. Campaign assets - cascade delete when campaign is deleted
CREATE TABLE campaign_assets_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

INSERT INTO campaign_assets_new SELECT * FROM campaign_assets;
DROP TABLE campaign_assets;
ALTER TABLE campaign_assets_new RENAME TO campaign_assets;

-- 7. Rewards - cascade delete when campaign is deleted
CREATE TABLE rewards_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  estimated_shipping_date DATE,
  max_backers INTEGER,
  current_backers INTEGER DEFAULT 0,
  is_limited_edition BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

INSERT INTO rewards_new SELECT * FROM rewards;
DROP TABLE rewards;
ALTER TABLE rewards_new RENAME TO rewards;

-- 8. Campaign updates - cascade delete when campaign is deleted
CREATE TABLE campaign_updates_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

INSERT INTO campaign_updates_new SELECT * FROM campaign_updates;
DROP TABLE campaign_updates;
ALTER TABLE campaign_updates_new RENAME TO campaign_updates;

-- 9. Backers - cascade delete for user/campaign, SET NULL for shipping address
CREATE TABLE backers_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  reward_id INTEGER NOT NULL,
  commitment_amount INTEGER NOT NULL,
  remaining_amount INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'committed',
  payment_intent_id TEXT,
  shipping_address_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id) ON DELETE SET NULL
);

INSERT INTO backers_new SELECT * FROM backers;
DROP TABLE backers;
ALTER TABLE backers_new RENAME TO backers;
CREATE INDEX IF NOT EXISTS idx_backers_user ON backers(user_id);
CREATE INDEX IF NOT EXISTS idx_backers_campaign ON backers(campaign_id);

-- Recreate remaining indexes that aren't table-specific (these should already exist, but ensuring they do)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_users_is_maker ON users(is_maker);
CREATE INDEX IF NOT EXISTS idx_users_maker_name ON users(maker_name);
CREATE INDEX IF NOT EXISTS idx_users_maker_status ON users(maker_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_maker_name_unique ON users(maker_name) WHERE maker_name IS NOT NULL;

PRAGMA foreign_keys = ON;