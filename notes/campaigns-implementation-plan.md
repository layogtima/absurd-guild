# Campaign System Implementation Plan

## Overview

This document outlines the implementation plan for the complete campaign system based on the existing database schema, HTML design mockups, and current codebase structure.

## Current State Analysis

### ✅ What We Have

1. **Database Schema** (Complete)
   - Full campaign tables with enhanced fields
   - User authentication and maker profiles
   - Backing system with India-first commitment structure (40/60 split)
   - Open source asset management
   - Reward system with multiple tiers
   - Campaign updates and FAQ support

2. **Server Infrastructure**
   - `app/lib/campaigns.server.ts` - Complete CRUD operations
   - `app/lib/video-utils.server.ts` - YouTube/Vimeo processing
   - Authentication system working
   - Maker profile system functional

3. **Design System**
   - Complete campaign page design in `html/campaign.html`
   - Floating backing panel with India-first UI
   - Progress tracking and social sharing
   - Dark/light theme support
   - Responsive design patterns

### 🚧 What We Need to Build

1. **Campaign Management UI** - Maker-facing creation/editing interface
2. **Public Campaign Pages** - Visitor-facing campaign display
3. **Backing Flow** - User journey for committing to campaigns
4. **Custom Content System** - Allow makers to add rich content
5. **File Upload System** - Open source asset management

## Implementation Plan

### Phase 1: Campaign Creation & Management (Priority 1)

#### 1.1 Campaign Creation Flow

**Route**: `/campaigns/create`

**Features**:
- Multi-step creation wizard
- Basic info (title, description, funding goal)
- Video integration (YouTube/Vimeo URL → embed)
- Story content (rich text/markdown)
- Reward tier configuration
- Open source asset upload
- Draft/publish workflow

**Components to Create**:
```
app/routes/campaigns.create.tsx
app/components/campaigns/
├── CampaignWizard.tsx
├── BasicInfoStep.tsx
├── StoryStep.tsx
├── RewardsStep.tsx
├── AssetsStep.tsx
└── PreviewStep.tsx
```

#### 1.2 Campaign Editing Interface

**Route**: `/campaigns/:slug/edit`

**Features**:
- Live preview while editing
- Autosave functionality
- Status management (draft → active → funded)
- Campaign analytics dashboard
- Update posting system

**Components**:
```
app/routes/campaigns.$slug.edit.tsx
app/components/campaigns/
├── CampaignEditor.tsx
├── LivePreview.tsx
├── AnalyticsDashboard.tsx
└── UpdateManager.tsx
```

#### 1.3 Maker Dashboard

**Route**: `/profile/campaigns`

**Features**:
- List all maker's campaigns
- Quick stats (funding progress, backers, views)
- Campaign status management
- Quick actions (edit, post update, view analytics)

### Phase 2: Public Campaign Pages (Priority 2)

#### 2.1 Campaign Display Page

**Route**: `/campaigns/:slug`

**Design**: Based on `html/campaign.html`

**Key Features**:
- Hero section with video embed
- Floating backing panel (mobile/desktop responsive)
- Progress tracking with India-first commitment system
- Story content display
- FAQ section
- Updates feed
- Open source file downloads
- Social sharing

**Components**:
```
app/routes/campaigns.$slug.tsx
app/components/campaigns/
├── CampaignHero.tsx
├── BackingPanel.tsx        # The floating panel from design
├── ProgressTracker.tsx
├── StorySection.tsx
├── FAQSection.tsx
├── UpdatesFeed.tsx
├── OpenSourceAssets.tsx
└── SocialShare.tsx
```

#### 2.2 Campaign Listing Page

**Route**: `/campaigns`

**Features**:
- Grid layout with campaign cards
- Filtering by category, status, funding progress
- Search functionality
- Featured campaigns section

### Phase 3: Custom Content System (Priority 3)

#### 3.1 Rich Content Editor

**Goal**: Allow makers to create rich, custom campaign content

**Options Analyzed**:

1. **Markdown Editor** (Recommended)
   - Simple, maker-friendly
   - Supports images, videos, code blocks
   - Preview mode
   - Safe HTML output

2. **Block-based Editor** (Advanced)
   - Notion-style blocks
   - Custom component blocks
   - Drag & drop interface

3. **HTML Paste** (Simple)
   - Allow raw HTML paste (with sanitization)
   - Preview mode
   - Security concerns require strict sanitization

**Recommendation**: Start with **Markdown Editor** for MVP, upgrade to block-based later.

**Implementation**:
```typescript
// Enhanced campaign schema usage
interface Campaign {
  // ... existing fields
  story_content: string;        // Markdown content
  risk_disclosure: string;      // Markdown content
  shipping_info: string;        // Markdown content
  faq_data: string;            // JSON array of {question, answer}
}
```

**Components**:
```
app/components/editor/
├── MarkdownEditor.tsx
├── MarkdownPreview.tsx
├── ImageUploader.tsx
└── VideoEmbedder.tsx
```

#### 3.2 Custom Blocks System (Future)

For advanced makers who want more control:

**Custom Block Types**:
- Product showcase gallery
- Technical specifications table
- Interactive 3D model viewer
- Video testimonials
- Timeline/roadmap
- Comparison tables

### Phase 4: Backing System (Priority 4)

#### 4.1 Floating Backing Panel

**Design**: Exact replica of `html/campaign.html` panel

**Features**:
- Responsive (desktop/mobile different behavior)
- Reward selection
- India-first commitment calculation (40% now, 60% later)
- Progress ring visualization
- Campaign stats display

#### 4.2 Backing Flow

**Flow**:
1. User selects reward tier
2. Commitment amount calculated (40% of reward price)
3. Shipping address collection
4. Payment processing (Razorpay integration)
5. Confirmation and post-backing experience

**Routes**:
```
/campaigns/:slug/back          # Main backing page
/campaigns/:slug/back/confirm  # Payment confirmation
/campaigns/:slug/back/success  # Success page
```

#### 4.3 Payment Integration

**India-First System**:
- 40% payment upfront (configurable by admin)
- 60% payment on delivery
- Full refund if project doesn't deliver
- Razorpay integration for Indian market

### Phase 5: File Upload & Asset Management (Priority 5)

#### 5.1 Cloudflare R2 Integration

**Asset Types**:
- Campaign images and videos
- Open source files (3D models, schematics, code)
- Maker profile photos
- Product galleries

**Implementation**:
```typescript
// File upload utility
export interface UploadedFile {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

// Upload to R2 with automatic optimization
export async function uploadFile(
  r2: R2Bucket,
  file: File,
  folder: string
): Promise<UploadedFile>
```

#### 5.2 Open Source Asset Management

**Required Asset Types** (from guild.md):
- 3D files for enclosure and parts
- Circuit design files (KiCad, etc.)
- Software/firmware repository links
- Parts list (BOM)
- Assembly guide
- Prototype photos and videos

**UI Features**:
- Drag & drop upload interface
- File type validation
- Progress indicators
- Asset organization by type
- Download tracking and analytics

## Technical Implementation Details

### Database Schema Utilization

**No new migrations needed!** Current schema supports everything:

```sql
-- campaigns table has enhanced fields
story_content TEXT,           -- Markdown/HTML content
risk_disclosure TEXT,         -- Risks and challenges
shipping_info TEXT,          -- Shipping timeline
faq_data TEXT,               -- JSON FAQs
tags TEXT,                   -- JSON tags array
featured BOOLEAN,            -- Homepage featuring
views_count INTEGER          -- Analytics

-- campaign_assets table ready for file uploads
type TEXT,                   -- Asset category
file_url TEXT,               -- R2 URLs
external_url TEXT,           -- GitHub repos
```

### Component Architecture

**Design System Reuse**:
- Port CSS variables and themes from `campaign.html`
- Reuse animation classes and styling patterns
- Maintain responsive behavior
- Keep floating panel UX identical

**State Management Pattern** (following CLAUDE.md):
- Use URL params for UI state: `?edit=true`, `?step=2`
- POST forms for data mutations only
- Success/error messages via URL params
- Progressive enhancement principles

### Security Considerations

#### Content Security
- Markdown sanitization for user content
- HTML allowlist for safe rendering
- XSS prevention in custom content
- File upload validation and scanning

#### Payment Security
- Razorpay PCI compliance
- Webhook signature verification
- Idempotent payment processing
- Secure session management

#### File Upload Security
- File type validation
- Size limits enforcement
- Virus scanning via Cloudflare
- CDN delivery through R2

## Implementation Priority & Timeline

### Sprint 1 (Week 1-2): Campaign Creation Core
- [ ] Campaign creation form (`/campaigns/create`)
- [ ] Basic campaign editing (`/campaigns/:slug/edit`)
- [ ] Maker dashboard (`/profile/campaigns`)
- [ ] Video URL processing integration

### Sprint 2 (Week 3-4): Public Campaign Pages
- [ ] Campaign display page (`/campaigns/:slug`)
- [ ] Campaign listing (`/campaigns`)
- [ ] Port design system from HTML mockup
- [ ] Floating backing panel (UI only)

### Sprint 3 (Week 5-6): Content System
- [ ] Markdown editor integration
- [ ] Rich content preview
- [ ] Image upload to R2
- [ ] Open source asset upload

### Sprint 4 (Week 7-8): Backing System
- [ ] Backing flow implementation
- [ ] Razorpay payment integration
- [ ] India-first commitment system
- [ ] Post-backing user experience

## Routes to Add

Update `app/routes.ts`:

```typescript
// Campaign management (maker-facing)
route("campaigns/create", "routes/campaigns.create.tsx"),
route("campaigns/:slug/edit", "routes/campaigns.$slug.edit.tsx"),
route("profile/campaigns", "routes/profile.campaigns.tsx"),

// Public campaign pages
route("campaigns", "routes/campaigns._index.tsx"),
route("campaigns/:slug", "routes/campaigns.$slug.tsx"),

// Backing flow
route("campaigns/:slug/back", "routes/campaigns.$slug.back.tsx"),
route("campaigns/:slug/back/confirm", "routes/campaigns.$slug.back.confirm.tsx"),
route("campaigns/:slug/back/success", "routes/campaigns.$slug.back.success.tsx"),
```

## Key Design Decisions

### 1. Content System Choice
**Decision**: Start with Markdown editor, upgrade to blocks later
**Rationale**:
- Faster to implement
- Familiar to makers (GitHub-like)
- Safe and secure
- Easily upgradeable

### 2. Asset Upload Strategy
**Decision**: Direct R2 upload with presigned URLs
**Rationale**:
- Better performance
- Reduced server load
- Cloudflare integration
- Automatic CDN delivery

### 3. India-First Commitment UI
**Decision**: Exact replication of HTML mockup design
**Rationale**:
- Design is already tested and polished
- User experience is well-thought-out
- Responsive behavior already defined
- Maintains visual consistency

### 4. Progressive Enhancement
**Decision**: Follow CLAUDE.md patterns
**Rationale**:
- Better SEO
- Works without JS
- Bookmarkable states
- Server-side validation

## Success Metrics

### MVP Success Criteria
- [ ] Makers can create and publish campaigns
- [ ] Campaigns display correctly on public pages
- [ ] Basic backing flow works (UI, no payment yet)
- [ ] Open source assets can be uploaded and downloaded
- [ ] Design matches HTML mockup quality

### Full Launch Criteria
- [ ] Payment integration working
- [ ] Rich content editor functional
- [ ] File upload system robust
- [ ] Mobile experience polished
- [ ] Search and discovery features

## Risk Mitigation

### Technical Risks
- **File upload complexity**: Start with simple uploads, add features iteratively
- **Payment integration**: Use Razorpay test mode extensively
- **Content security**: Implement strict sanitization from day 1

### User Experience Risks
- **Complex creation flow**: Provide clear progress indicators and save states
- **Mobile backing experience**: Test extensively on real devices
- **File download experience**: Ensure reliable and fast delivery

## Next Steps

1. **Review and approve** this implementation plan
2. **Set up development environment** for campaign features
3. **Create base components** and route structure
4. **Implement Sprint 1 features** (campaign creation)
5. **User testing** at each sprint completion

This plan provides a comprehensive roadmap for implementing the complete campaign system while leveraging existing infrastructure and maintaining design consistency with the HTML mockups.