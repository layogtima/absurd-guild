-- Migration 002: Add maker profile functionality
-- Extends users table and adds maker-specific features

-- Add maker-specific fields to users table
ALTER TABLE users ADD COLUMN is_maker BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN maker_name TEXT; -- Public name (different from display_name)
ALTER TABLE users ADD COLUMN maker_tagline TEXT; -- "LED Whisperer", "Hardware Necromancer"
ALTER TABLE users ADD COLUMN maker_bio TEXT; -- Long bio
ALTER TABLE users ADD COLUMN maker_avatar_url TEXT; -- Profile photo
ALTER TABLE users ADD COLUMN maker_cover_image_url TEXT; -- Cover/banner image
ALTER TABLE users ADD COLUMN maker_location TEXT; -- City, Country
-- Note: Using flexible profile links table instead of specific social media columns
ALTER TABLE users ADD COLUMN maker_skills TEXT; -- JSON array of skills
ALTER TABLE users ADD COLUMN maker_verified BOOLEAN DEFAULT FALSE; -- Verification status
ALTER TABLE users ADD COLUMN maker_status TEXT DEFAULT 'active'; -- active, inactive, suspended
ALTER TABLE users ADD COLUMN created_campaigns_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN created_products_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_raised INTEGER DEFAULT 0; -- in paise

-- Profile Links Table (for any type of links makers want to add)
CREATE TABLE maker_profile_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL, -- 'GitHub', 'My Blog', 'YouTube Channel', 'Portfolio', etc.
  url TEXT NOT NULL,
  description TEXT, -- Optional description
  icon TEXT, -- Optional icon class (fas fa-globe, fab fa-github, etc.)
  is_featured BOOLEAN DEFAULT FALSE, -- Show prominently on profile
  sort_order INTEGER DEFAULT 0, -- For custom ordering
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add indexes for maker profile queries
CREATE INDEX idx_users_is_maker ON users(is_maker);
CREATE INDEX idx_users_maker_name ON users(maker_name);
CREATE INDEX idx_users_maker_status ON users(maker_status);
CREATE INDEX idx_maker_profile_links_user ON maker_profile_links(user_id);
CREATE INDEX idx_maker_profile_links_featured ON maker_profile_links(is_featured);
CREATE INDEX idx_maker_profile_links_order ON maker_profile_links(user_id, sort_order);

-- Add unique constraint for maker_name (public usernames)
CREATE UNIQUE INDEX idx_users_maker_name_unique ON users(maker_name) WHERE maker_name IS NOT NULL;