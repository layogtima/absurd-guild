okay, now we want people to sign up as a maker. create a basic profile (name required) allow them to add a photo.

we need enough info so that they can later:

1. add products they want to sell
2. create campaigns for productions that they're developing.

so here are the steps:

1. let's make the minimum profile (create, edit)
2. campaigns: makers can create and edit
3. products: makers can create and edit

for details on these look at HTML mockups in html/

## Implementation Plan

### Phase 1: Maker Profile System

#### 1.1 Database Schema Updates

**Maker Profiles Extension** (extend existing users table):
```sql
-- Add maker-specific fields to users table
ALTER TABLE users ADD COLUMN is_maker BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN maker_name TEXT; -- Public name (different from display_name)
ALTER TABLE users ADD COLUMN maker_tagline TEXT; -- "LED Whisperer", "Hardware Necromancer"
ALTER TABLE users ADD COLUMN maker_bio TEXT; -- Long bio
ALTER TABLE users ADD COLUMN maker_avatar_url TEXT; -- Profile photo
ALTER TABLE users ADD COLUMN maker_cover_image_url TEXT; -- Cover/banner image
ALTER TABLE users ADD COLUMN maker_location TEXT; -- City, Country
ALTER TABLE users ADD COLUMN maker_website TEXT; -- Personal website
ALTER TABLE users ADD COLUMN maker_github TEXT; -- GitHub username
ALTER TABLE users ADD COLUMN maker_twitter TEXT; -- Twitter handle
ALTER TABLE users ADD COLUMN maker_instagram TEXT; -- Instagram handle
ALTER TABLE users ADD COLUMN maker_skills TEXT; -- JSON array of skills
ALTER TABLE users ADD COLUMN maker_verified BOOLEAN DEFAULT FALSE; -- Verification status
ALTER TABLE users ADD COLUMN maker_status TEXT DEFAULT 'active'; -- active, inactive, suspended
ALTER TABLE users ADD COLUMN created_campaigns_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN created_products_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_raised INTEGER DEFAULT 0; -- in paise
```

**Social Links Table** (for flexible social media links):
```sql
CREATE TABLE maker_social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL, -- 'github', 'twitter', 'instagram', 'youtube', 'linkedin', 'website', 'discord'
  url TEXT NOT NULL,
  display_name TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 1.2 Profile Routes & Components

**Routes to Create:**
- `/profile/setup` - Initial maker profile setup (after first login)
- `/profile/edit` - Edit existing profile
- `/makers/:username` - Public maker profile view
- `/dashboard` - Maker dashboard (profile + campaigns + products)
- `/profile/preview` - Preview how profile looks to others

**Components to Create:**
- `MakerProfileForm` - Profile creation/editing form
- `MakerProfileDisplay` - Public profile display (based on profile.html)
- `ImageUploader` - Photo upload component with R2 integration
- `SocialLinksManager` - Add/edit social media links
- `ProfilePreview` - Live preview during editing

#### 1.3 Profile Features

**Minimum Required Fields:**
- Email (already have)
- Maker name (public name)
- Avatar photo

**Optional Fields:**
- Tagline (e.g., "LED Whisperer")
- Bio (long description)
- Location
- Cover image
- Social media links
- Skills/expertise tags
- Website

**Profile Features:**
- Live edit mode (like profile.html demonstrates)
- Photo upload to Cloudflare R2
- Social media integration
- Public profile URL (/makers/username)
- Profile verification system
- Skills/tags system

### Phase 2: Campaign Management

#### 2.1 Database Schema (already exists, minor updates)

**Update Campaigns Table:**
```sql
-- Add fields for campaign media and content
ALTER TABLE campaigns ADD COLUMN hero_video_embed TEXT; -- YouTube/Vimeo embed code
ALTER TABLE campaigns ADD COLUMN hero_video_thumbnail TEXT;
ALTER TABLE campaigns ADD COLUMN story_content TEXT; -- Detailed campaign story
ALTER TABLE campaigns ADD COLUMN risk_disclosure TEXT; -- Risks and challenges
ALTER TABLE campaigns ADD COLUMN shipping_info TEXT; -- Shipping details
ALTER TABLE campaigns ADD COLUMN faq_data TEXT; -- JSON array of FAQs
ALTER TABLE campaigns ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE campaigns ADD COLUMN featured BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN views_count INTEGER DEFAULT 0;
```

#### 2.2 Campaign Routes

**Campaign Management Routes:**
- `/campaigns/create` - Create new campaign (multi-step)
- `/campaigns/:slug/edit` - Edit existing campaign
- `/campaigns/:slug` - Public campaign view (based on campaign.html)
- `/campaigns/:slug/dashboard` - Campaign analytics/management
- `/campaigns/:slug/updates` - Manage campaign updates

#### 2.3 Campaign Features

**Campaign Creation Flow:**
1. Basic info (title, description, funding goal)
2. Story & media (hero video, images, detailed description)
3. Rewards setup (tiers, pricing, shipping)
4. Open source assets upload
5. Review & launch

**Campaign Page Features:**
- Floating backing panel (from campaign.html)
- Progress tracking with India-first commitment system
- Updates feed
- FAQ section
- Open source file downloads
- Social sharing
- Community access (post-backing)

### Phase 3: Product Management

#### 3.1 Products Integration

**Enhanced Products Table:**
```sql
-- Update existing products table
ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'; -- active, out_of_stock, discontinued
ALTER TABLE products ADD COLUMN images TEXT; -- JSON array of image URLs
ALTER TABLE products ADD COLUMN features TEXT; -- JSON array of features
ALTER TABLE products ADD COLUMN specifications TEXT; -- JSON object of specs
ALTER TABLE products ADD COLUMN shipping_weight INTEGER; -- in grams
ALTER TABLE products ADD COLUMN stock_quantity INTEGER;
ALTER TABLE products ADD COLUMN is_open_source BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN github_repo TEXT;
ALTER TABLE products ADD COLUMN documentation_url TEXT;
```

#### 3.2 Product Routes

**Product Management Routes:**
- `/products/create` - Create new product listing
- `/products/:slug/edit` - Edit product
- `/shop` - Public shop (all products)
- `/shop/:slug` - Product detail page
- `/makers/:username/shop` - Maker's product shop

#### 3.3 Product Features

**Product Management:**
- Product photo gallery
- Shopify integration (redirect to purchase)
- Open source documentation links
- Inventory management
- Product variants (size, color, etc.)

### Phase 4: Advanced Features

#### 4.1 File Upload System

**Cloudflare R2 Integration:**
- Profile photos and cover images
- Campaign media (images, videos)
- Open source files (3D models, schematics, code)
- Product photos

**File Management:**
- Automatic image optimization
- Multiple image sizes/thumbnails
- File type validation
- Upload progress indicators

#### 4.2 Live Edit System

**Based on profile.html:**
- Toggle edit mode
- Click-to-edit interface
- Real-time preview
- Bulk save changes
- Reset functionality

#### 4.3 Dashboard System

**Maker Dashboard Features:**
- Profile completion status
- Campaign performance metrics
- Product sales analytics
- Community engagement stats
- Earnings tracking
- Notification center

## Implementation Priority

### MVP (Minimum Viable Product):
1. **Basic Profile Creation** - Name, photo, bio
2. **Profile Display** - Public maker profiles
3. **Simple Campaign Creation** - Basic campaign with funding goal
4. **Campaign Display** - Public campaign pages with backing

### Phase 2 Enhancements:
1. **Advanced Profile Features** - Social links, skills, verification
2. **Enhanced Campaign Management** - Media uploads, updates, analytics
3. **Product Management** - Full product CRUD

### Phase 3 Polish:
1. **Live Edit System** - Real-time editing interface
2. **File Upload System** - R2 integration for all media
3. **Dashboard Analytics** - Comprehensive maker dashboard

## Technical Considerations

### Authentication Flow:
1. User signs up with magic link (existing)
2. After first login → redirect to `/profile/setup`
3. Complete maker profile setup
4. Set `is_maker = true` in database
5. Redirect to `/dashboard`

### URL Structure:
- `/makers/amit` - Public profile
- `/campaigns/t1e-smartwatch` - Campaign page
- `/shop/lampy` - Product page

### Data Validation:
- Required fields enforcement
- Image size/format validation
- URL validation for social links
- Content moderation for public profiles

This plan provides a comprehensive roadmap for implementing the maker profile system while maintaining the design aesthetic and functionality demonstrated in the HTML mockups.
