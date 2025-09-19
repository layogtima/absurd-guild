we need the ability for people to add more details about the product (optional) @app/components/profile/ProductForm.tsx

we also need to take into account if a product is under development (is a project) and not ready for sale

also, when we're showing such projects, we show them in a "Workbench" section in @app/routes/m.$id.tsx

refer to all the .sql files in @db/migrations/ folder to know more about the products

first make a plan and write it to @notes/project.md in new sections. let's implement after i have reviewed it

---

## Implementation Plan: Enhanced Product Details & Project/Workbench System

### Current State Analysis

From analyzing the database schema and existing code:

1. **Products table** (from migrations) has these enhanced fields already available:
   - `status` (active, out_of_stock, discontinued)
   - `images` (JSON array)
   - `features` (JSON array)
   - `specifications` (JSON object)
   - `shipping_weight` (integer, in grams)
   - `stock_quantity` (integer)
   - `is_open_source` (boolean)
   - `github_repo` (text)
   - `documentation_url` (text)

2. **Current Product interface** only includes basic fields, missing the enhanced ones
3. **ProductForm** only captures basic product info
4. **Profile display** (`m.$id.tsx`) shows products in a "Shop" section

### Phase 1: Database Schema Extension

**Goal**: Leverage existing database fields for project/development status

**No new migration needed!** The existing schema already has what we need:

- **`status`** field: Extend values to include project statuses
  - Current: `'active', 'out_of_stock', 'discontinued'`
  - Add: `'concept', 'development', 'prototype', 'testing'`
  - Products with these new statuses = projects in development
  - `'active'` = ready for sale

- **`description`** field: Use for development notes
- **Existing enhanced fields**: Already available from migration 003

### Phase 2: Type System Updates

**Goal**: Update TypeScript interfaces to match database schema

**Files to update**:
- `app/types/product.ts`: Add all missing fields from database schema
- Define project status types and helper functions

### Phase 3: Product Form Enhancement

**Goal**: Extend ProductForm to capture additional details

**New form sections**:

1. **Status Section**
   - Status dropdown: `'active', 'concept', 'development', 'prototype', 'testing', 'out_of_stock', 'discontinued'`
   - Smart labeling: Development statuses show as "Project Status", others as "Product Status"

2. **Enhanced Product Details** (optional/expandable)
   - Multiple images (JSON array input)
   - Features list (dynamic array input)
   - Specifications (key-value pairs)
   - Technical details (weight, stock, open source info, GitHub repo)

**UX Approach**:

- Use progressive disclosure (collapsible sections)
- Make enhanced details optional
- Clear visual distinction between basic and advanced fields

### Phase 4: Server-Side Logic Updates

**Goal**: Update product server functions for new fields

**Files to update**:

- `app/lib/products.server.ts`:
  - Add `getReadyProducts()` function (status = 'active')
  - Add `getDevelopmentProjects()` function (status in development statuses)
  - Update `createProduct` and `updateProduct` for enhanced fields
  - Add status validation helper functions

### Phase 5: Profile Display Enhancement

**Goal**: Split products into "Shop" and "Workbench" sections

**Changes to `app/routes/m.$id.tsx`**:

1. **Data Loading**:
   - Separate products by status
   - Ready products: `status = 'active'`
   - Development projects: `status in ['concept', 'development', 'prototype', 'testing']`

2. **UI Sections**:
   - **Shop Section**: Products with `status = 'active'`
   - **Workbench Section**: Products with development statuses

3. **Project Display**:
   - Different visual treatment (no "In Stock" badge, different CTA)
   - Show status badge (Concept, Development, Prototype, Testing)
   - "Follow Progress" instead of "GET ONE" button
   - Display development notes from description

### Phase 6: Enhanced Product Display

**Goal**: Show additional product details when available

**Enhancements**:

- Image gallery (if multiple images)
- Feature list display
- Specifications table
- Open source badges and links
- Technical specifications

### Implementation Order & Dependencies

1. **Phase 2** (Types) - Update interfaces first
2. **Phase 4** (Server) - Can be done in parallel with Phase 3
3. **Phase 3** (Form) - Depends on Phase 2
4. **Phase 5** (Profile) - Depends on Phases 2 & 4
5. **Phase 6** (Display) - Enhancement, can be done last

**Phase 1 eliminated** - No database changes needed!

### Key Design Decisions

1. **Reuse Existing Schema**: Leverage `status` field instead of new columns
2. **Status-Based Logic**: Use status values to distinguish products vs projects
3. **Backward Compatibility**: All enhanced fields already exist and are optional
4. **Simple Implementation**: No migrations, just UI and logic updates
5. **Flexible Status System**: Easy to add new statuses later

### Testing Considerations

- Ensure existing products (status='active') continue to work
- Test new status values and form handling
- Validate form with both simple and enhanced product data
- Test profile display with mixed product/project content
- Verify status-based filtering works correctly

---
