-- Migration 003: Enhanced campaign features
-- Add fields for richer campaign content and management

-- Add fields for campaign media and content
ALTER TABLE campaigns ADD COLUMN story_content TEXT; -- Detailed campaign story (markdown/HTML)
ALTER TABLE campaigns ADD COLUMN risk_disclosure TEXT; -- Risks and challenges
ALTER TABLE campaigns ADD COLUMN shipping_info TEXT; -- Shipping details and timeline
ALTER TABLE campaigns ADD COLUMN faq_data TEXT; -- JSON array of FAQs
ALTER TABLE campaigns ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE campaigns ADD COLUMN featured BOOLEAN DEFAULT FALSE; -- Featured on homepage
ALTER TABLE campaigns ADD COLUMN views_count INTEGER DEFAULT 0; -- Page view counter

-- Enhanced Products Table
ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'; -- active, out_of_stock, discontinued
ALTER TABLE products ADD COLUMN images TEXT; -- JSON array of image URLs
ALTER TABLE products ADD COLUMN features TEXT; -- JSON array of features
ALTER TABLE products ADD COLUMN specifications TEXT; -- JSON object of specs
ALTER TABLE products ADD COLUMN shipping_weight INTEGER; -- in grams
ALTER TABLE products ADD COLUMN stock_quantity INTEGER;
ALTER TABLE products ADD COLUMN is_open_source BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN github_repo TEXT;
ALTER TABLE products ADD COLUMN documentation_url TEXT;

-- Add indexes for enhanced features
CREATE INDEX idx_campaigns_featured ON campaigns(featured);
CREATE INDEX idx_campaigns_tags ON campaigns(tags);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_open_source ON products(is_open_source);