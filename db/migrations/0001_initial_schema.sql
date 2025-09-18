-- Initial Absurd Guild Database Schema
-- Migration 001: Base tables for authentication and core functionality

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  tagline TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Magic link tokens for authentication
CREATE TABLE magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User sessions (stored in D1 as backup, primary in KV)
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Campaigns table
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  hero_video_url TEXT,
  hero_image_url TEXT,
  funding_goal INTEGER NOT NULL, -- in paise
  current_funding INTEGER DEFAULT 0, -- in paise
  commitment_percentage INTEGER DEFAULT 40, -- configurable by admin
  status TEXT DEFAULT 'draft', -- draft, active, funded, shipped, cancelled
  category TEXT,
  estimated_shipping_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ends_at DATETIME,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Campaign assets (open source files)
CREATE TABLE campaign_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- '3d_files', 'circuit_design', 'software_repo', 'parts_list', 'assembly_guide', 'prototype_photos', 'prototype_video'
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT, -- R2 URL for files
  external_url TEXT, -- GitHub repo URL for software
  file_size INTEGER,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Rewards for campaigns
CREATE TABLE rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in paise
  estimated_shipping_date DATE,
  max_backers INTEGER,
  current_backers INTEGER DEFAULT 0,
  is_limited_edition BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Backers table
CREATE TABLE backers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  reward_id INTEGER NOT NULL,
  commitment_amount INTEGER NOT NULL, -- amount paid upfront (40%)
  remaining_amount INTEGER NOT NULL, -- amount to pay on delivery (60%)
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'committed', -- committed, shipped, delivered, refunded
  payment_intent_id TEXT, -- Razorpay payment intent
  shipping_address_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (reward_id) REFERENCES rewards(id),
  FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id)
);

-- Products (for existing shop items)
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in paise
  shopify_product_id TEXT,
  shopify_url TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Campaign updates
CREATE TABLE campaign_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT, -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Shipping addresses
CREATE TABLE shipping_addresses (
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
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Site settings
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_backers_user ON backers(user_id);
CREATE INDEX idx_backers_campaign ON backers(campaign_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);

-- Initial settings
INSERT INTO site_settings (key, value, description) VALUES
('default_commitment_percentage', '40', 'Default percentage for upfront commitment'),
('platform_fee_percentage', '5', 'Platform fee percentage'),
('minimum_funding_amount', '50000', 'Minimum funding goal in paise'),
('magic_link_expiry_minutes', '15', 'Magic link expiry time in minutes');