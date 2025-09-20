-- Migration 006: Add image key columns for R2 storage
-- Enables custom domain support by separating storage keys from URLs

-- Add key columns to store R2 object keys separately from URLs
-- These columns are nullable initially for backwards compatibility

-- Users table - add avatar_key for avatar_url
ALTER TABLE users ADD COLUMN avatar_key TEXT;

-- Products table - add image_key for image_url
ALTER TABLE products ADD COLUMN image_key TEXT;

-- Campaigns table - add hero_image_key for hero_image_url
ALTER TABLE campaigns ADD COLUMN hero_image_key TEXT;

-- Campaign assets table - add file_key for file_url
ALTER TABLE campaign_assets ADD COLUMN file_key TEXT;

-- Add indexes for the new key columns to improve query performance
CREATE INDEX idx_users_avatar_key ON users(avatar_key) WHERE avatar_key IS NOT NULL;
CREATE INDEX idx_products_image_key ON products(image_key) WHERE image_key IS NOT NULL;
CREATE INDEX idx_campaigns_hero_image_key ON campaigns(hero_image_key) WHERE hero_image_key IS NOT NULL;
CREATE INDEX idx_campaign_assets_file_key ON campaign_assets(file_key) WHERE file_key IS NOT NULL;