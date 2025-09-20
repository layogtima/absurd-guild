-- Migration 006: Add video embed and thumbnail columns
-- Add missing columns for video processing

-- Add video embed and thumbnail columns to campaigns table
ALTER TABLE campaigns ADD COLUMN hero_video_embed TEXT; -- Processed embed URL
ALTER TABLE campaigns ADD COLUMN hero_video_thumbnail TEXT; -- Processed thumbnail URL

-- Create indexes for video fields
CREATE INDEX idx_campaigns_video_embed ON campaigns(hero_video_embed);
CREATE INDEX idx_campaigns_video_thumbnail ON campaigns(hero_video_thumbnail);