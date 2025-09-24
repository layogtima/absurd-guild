# R2 Image Storage Key Separation Plan

## Current Issue

Currently, when uploading files to R2, we save the complete URL in the database:

- Example: `https://9aa603db8b4ff3924b801a2c0f0c49fb.r2.cloudflarestorage.com/absurd-maker-platform/profile/1/1758314839786-e4jmmd.jpg`
- This makes it difficult to use custom domains and change CDN configurations

## Goal

Separate storage key from URL generation to enable custom domain usage via `R2_CUSTOM_DOMAIN` in environment.

## Current Implementation Analysis

### Upload Flow

1. `handleImageUpload()` in `app/routes/profile.tsx` calls `uploadImage()`
2. `uploadImage()` in `app/lib/upload.server.ts` returns both `url` and `key`
3. Only the `url` is currently used and saved to database

### Database Fields Affected

- `users.avatar_url` (profile avatars)
- `users.maker_avatar_url` (maker profile avatars)
- `products.image_url` (product images)
- `campaigns.hero_image_url` (campaign hero images)
- `campaign_assets.file_url` (campaign asset files)

## Implementation Plan

### Phase 1: Database Schema Updates

1. **Add new key fields to existing tables:**
   - `users.avatar_key` (for avatar_url)
   - `products.image_key` (for image_url)
   - `campaigns.hero_image_key` (for hero_image_url)
   - `campaign_assets.file_key` (for file_url)

   Note: Skipping `users.maker_avatar_key` since `maker_avatar_url` will be removed in the future.

2. **Create migration file** to add these columns as nullable initially

### Phase 2: Update Upload Functions

1. **Modify `handleImageUpload()` in profile.tsx:**
   - Return both URL and key from `uploadImage()`
   - Pass both values to database update functions

2. **Update database service functions:**
   - `createMakerProfile()` - accept and save both avatarUrl and avatarKey
   - `updateMakerProfile()` - accept and save both avatarUrl and avatarKey
   - `createProduct()` - accept and save both image_url and image_key
   - `updateProduct()` - accept and save both image_url and image_key

### Phase 3: URL Generation Utility

1. **Create `generateImageUrl()` utility function:**
   - Input: storage key
   - Check if `R2_CUSTOM_DOMAIN` is set in environment
   - If custom domain exists: `${R2_CUSTOM_DOMAIN}/${key}`
   - If no custom domain: use existing R2 URL pattern
   - Return complete URL

2. **Update all image display locations** to use this utility instead of stored URLs

### Phase 4: Backwards Compatibility & Migration

1. **Create data migration script** to extract keys from existing URLs
2. **Update URL generation to fallback:**
   - If key exists: use `generateImageUrl(key)`
   - If no key but URL exists: use existing URL (backwards compatibility)

### Phase 5: Cleanup (Future)

1. Eventually remove URL columns once all data is migrated
2. Make key columns NOT NULL

## Files to Modify

### New Files

- `db/migrations/0006_add_image_keys.sql` - Add key columns
- `app/lib/images.server.ts` - Image URL generation utilities
- `scripts/migrate-image-keys.ts` - Data migration script

### Existing Files to Update

- `app/routes/profile.tsx` - Update handleImageUpload function
- `app/lib/makers.server.ts` - Update profile creation/update functions
- `app/lib/products.server.ts` - Update product creation/update functions
- `app/lib/upload.server.ts` - Ensure key is always returned
- All components displaying images - Use new URL generation

## Benefits

1. **Custom Domain Support:** Easy to switch to custom domain for image serving
2. **CDN Flexibility:** Can change CDN/storage backend without database updates
3. **Performance:** Custom domain can have better caching/geographic distribution
4. **Branding:** Images served from your domain instead of cloudflarestorage.com
5. **Future-proof:** Easier to migrate to different storage providers

## Environment Variables Used

- `R2_CUSTOM_DOMAIN` - Custom domain for serving images (e.g., `https://atom.absurd.industries`)
- Existing R2 configuration variables for fallback

## Migration Strategy

1. Deploy schema changes (backwards compatible)
2. Deploy code changes (works with both old and new data)
3. Run data migration script in background
4. Monitor and verify everything works
5. Future cleanup to remove URL columns


This approach ensures zero downtime and backwards compatibility while enabling the custom domain functionality.
