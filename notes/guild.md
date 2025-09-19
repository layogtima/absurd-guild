Absurd Guild Platform

Open-source hardware platform for makers.

Features:

- Makers can run a campaign, like Kickstarter to raise money for a product under development
  - There are a few differences however
    - The backer gets to put in a % of the product’s sale price. the % can be controlled by the super admin (say right now it’s default 40%). The rest can be put in later.
    - The product has to be open source (so that someone can make the whole thing from scratch if they want to; they don’t have to buy the product)
      - So all the necessary files and documentation should be provided by the maker
        - 3D files for the enclosure and parts
        - Circuit design files
        - Software/firmware code (as a repository hosted online)
        - List of all the parts needed for the build
        - Step-by-step Assembly guide
        - Photos of the prototype if available.
        - Video of a functioning prototype.
- Makers can list and sell their existing products through the platform (for now we have an existing shopify installation, so we will simply redirect to the respective shopify page)
- So we will need a login system
  - Google
  - Email with OTP
  - Persist the user for as long as possible.
- Stack:
  - React router v7 (already setup)
  - Cloudflare D1
  - Cloudflare R2
  - For anything else we need let’s stay within cloudflare as much as possible

The reference mockups are in @html/ folder so let's first create a db structure to be able to acheive this.

Before you implement anything, make an implementation plan and save it to this document itself in new sections.

## Implementation Plan

### Database Schema Design

Based on the HTML mockups, we need the following core entities:

#### 1. Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  tagline TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 2. Campaigns Table

```sql
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
```

#### 3. Campaign Assets Table (Open Source Files)

```sql
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
```

#### 4. Rewards Table

```sql
CREATE TABLE rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in paise
  commitment_amount INTEGER GENERATED ALWAYS AS (price * commitment_percentage / 100) STORED,
  estimated_shipping_date DATE,
  max_backers INTEGER,
  current_backers INTEGER DEFAULT 0,
  is_limited_edition BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

#### 5. Backers Table

```sql
CREATE TABLE backers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  reward_id INTEGER NOT NULL,
  commitment_amount INTEGER NOT NULL, -- amount paid upfront (40%)
  remaining_amount INTEGER NOT NULL, -- amount to pay on delivery (60%)
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'committed', -- committed, shipped, delivered, refunded
  payment_intent_id TEXT, -- Stripe/Razorpay payment intent
  shipping_address_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (reward_id) REFERENCES rewards(id),
  FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id)
);
```

#### 6. Products Table (for existing shop items)

```sql
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
```

#### 7. Campaign Updates Table

```sql
CREATE TABLE campaign_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT, -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

#### 8. Shipping Addresses Table

```sql
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
```

#### 9. User Sessions Table

```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 10. Site Settings Table

```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings
INSERT INTO site_settings (key, value, description) VALUES
('default_commitment_percentage', '40', 'Default percentage for upfront commitment'),
('platform_fee_percentage', '5', 'Platform fee percentage'),
('minimum_funding_amount', '50000', 'Minimum funding goal in paise');
```

### Application Architecture

#### 1. File Structure

```
app/
├── root.tsx                 # Root layout with theme, navigation
├── routes/
│   ├── _index.tsx          # Homepage (campaigns grid + hero)
│   ├── auth.google.tsx     # Google OAuth callback
│   ├── auth.logout.tsx     # Logout handler
│   ├── campaigns/
│   │   ├── $slug.tsx       # Campaign detail page
│   │   ├── create.tsx      # Create new campaign
│   │   └── edit.$id.tsx    # Edit campaign
│   ├── makers/
│   │   └── $username.tsx   # Maker profile page
│   ├── shop/
│   │   └── _index.tsx      # Shop products listing
│   └── api/
│       ├── auth.ts         # Authentication endpoints
│       ├── campaigns.ts    # Campaign CRUD
│       └── payments.ts     # Payment processing
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── CampaignCard.tsx    # Campaign preview card
│   ├── BackingPanel.tsx    # Floating backing panel
│   └── Navigation.tsx      # Main navigation
└── lib/
    ├── db.server.ts        # Database connection and utilities
    ├── auth.server.ts      # Authentication logic
    └── payments.server.ts  # Payment processing
```

#### 2. Technology Stack Implementation

**Frontend:**

- React Router v7 (already configured)
- TailwindCSS with the existing design system from HTML mockups
- TypeScript for type safety
- Existing design tokens and CSS variables

**Backend:**

- Cloudflare D1 for database
- Cloudflare R2 for file storage (campaign assets, user uploads)
- Cloudflare Workers for serverless functions
- Session-based authentication with persistent cookies

**Authentication:**

- Google OAuth 2.0
- Email + OTP for users without Google accounts
- Long-lived sessions (30 days default)

**Payments:**

- Razorpay for Indian market
- Two-phase payment: commitment (40%) + delivery payment (60%)

### Implementation Phases

#### Phase 1: Core Foundation (Week 1-2)

1. **Database Setup**
   - Create D1 database and run migrations
   - Set up connection utilities and ORM-like helpers
   - Create seed data for testing

2. **Authentication System**
   - Google OAuth integration
   - Email/OTP authentication
   - Session management
   - Protected route middleware

3. **Basic UI Components**
   - Port existing design system from HTML mockups
   - Create reusable components (buttons, cards, forms)
   - Set up navigation and layout

#### Phase 2: Campaign Management (Week 3-4)

1. **Campaign Creation Flow**
   - Multi-step campaign creation form
   - File upload to R2 for open-source assets
   - Draft/publish workflow

2. **Campaign Display**
   - Campaign detail pages
   - Campaign grid/listing
   - Search and filtering

3. **User Profiles**
   - Maker profile pages
   - Campaign management dashboard

#### Phase 3: Backing System (Week 5-6)

1. **Payment Integration**
   - Razorpay integration for commitment payments
   - Payment tracking and status management
   - Refund handling

2. **Backing Flow**
   - Floating backing panel (from campaign.html)
   - Reward selection
   - Shipping address collection
   - Payment processing

#### Phase 4: Advanced Features (Week 7-8)

1. **Campaign Updates**
   - Update creation and display
   - Notification system for backers

2. **Shop Integration**
   - Product listing from Shopify
   - Redirect to Shopify for purchases

3. **Community Features**
   - Comments and discussions (post-backing)
   - Maker verification system

### Key Features Implementation

#### 1. India-First Commitment System

- 40% upfront payment to secure the product
- 60% payment on delivery/shipping
- Full refund if project doesn't deliver
- Configurable percentage by super admin

#### 2. Open Source Requirements

- Mandatory file uploads for campaigns:
  - 3D files for enclosure and parts
  - Circuit design files (KiCad, etc.)
  - Software/firmware repository link
  - Parts list (BOM)
  - Assembly guide
  - Prototype photos and videos

#### 3. Campaign States

- **Draft**: Creator working on campaign
- **Active**: Live and accepting backers
- **Funded**: Goal reached, preparation for production
- **Shipped**: Products being delivered
- **Completed**: All products delivered
- **Cancelled**: Campaign cancelled, refunds processed

#### 4. User Roles

- **Visitors**: Can browse, must sign up to back
- **Users**: Can back campaigns, create profiles
- **Makers**: Can create campaigns and products
- **Super Admin**: Can configure platform settings

### Security Considerations

1. **File Upload Security**
   - File type validation
   - Size limits
   - Virus scanning (Cloudflare)
   - CDN delivery through R2

2. **Payment Security**
   - PCI compliance through Razorpay
   - Secure webhook handling
   - Idempotent payment processing

3. **Data Protection**
   - GDPR compliance
   - Data encryption at rest
   - Secure session management
   - Rate limiting on APIs

### Performance Optimizations

1. **Database**
   - Proper indexing on frequently queried fields
   - Pagination for large datasets
   - Efficient joins and queries

2. **Frontend**
   - Image optimization and lazy loading
   - Component code splitting
   - Progressive enhancement

3. **Caching**
   - Cloudflare CDN for static assets
   - Cache campaign data with appropriate TTL
   - Edge caching for product listings

This implementation plan provides a solid foundation for building the Absurd Guild platform while maintaining the design aesthetic and functionality shown in the HTML mockups.
