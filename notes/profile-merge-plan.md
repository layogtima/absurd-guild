# Profile Page Merge Plan

## Goal

Merge `profile.tsx` and `m.$id.tsx` so that users see the same beautiful layout for their own profile as others see, with edit capabilities added for the owner. Use `html/profile.html` as design inspiration while keeping React Router patterns.

## Current State Analysis

### html/profile.html (Design Target) - Beautiful Live Editing

- **Hero Section**: Large avatar (w-32/w-40), big typography (text-6xl/text-8xl)
- **Live Edit Mode**: Toggle button with visual edit indicators
- **Edit Experience**:
  - Dashed outlines on hover in edit mode
  - Edit icons (✎) appearing on hover
  - Modal-based editing for all content
  - Sticky editor toolbar with Save/Reset/Preview
- **Sections**: Hero, Campaigns, Products, Workbench
- **Visual Polish**: Animations, hover effects, clean spacing

### m.$id.tsx (Public View) - Close to Target

- **Hero Section**: Large avatar (w-32/w-40), big typography (text-6xl/text-8xl)
- **Clean Layout**: Hero-style centered design with fade-in animations
- **Product Sections**:
  - "Shop" section for ready products
  - "Workbench" section for development projects
- **Social Links**: Grid layout with icons and hover effects
- **Components Used**: ProductList with showcase mode

### profile.tsx (Current Owner View) - Needs Complete Redesign

- **Compact Layout**: Small avatar (w-20), regular typography
- **Card-based Design**: Everything in bg-secondary cards
- **Admin Features**:
  - Inline edit forms for profile
  - Profile links management (add/delete)
  - ProductManagement component for CRUD operations
- **Form Handling**: Complex action handlers for all operations

## Proposed Solution

### Phase 1: Adopt html/profile.html Visual Design

1. **Hero Section** (from html/profile.html)
   - Large centered avatar (w-32/w-40) with rounded corners
   - Big typography (text-6xl/text-8xl) for name
   - Tagline below name
   - Bio in larger text with max-width constraint
   - Social links in grid layout with icons
   - Same animations and spacing

2. **Edit Mode Toggle** (React Router style)
   - Use URL param: `?edit=true` (progressive enhancement)
   - Edit button in navigation area (similar to html version)
   - Visual edit indicators when in edit mode
   - Modal-based editing system

3. **Conditional Rendering Logic**
   ```tsx
   const isOwner = user.id === profile.user_id;
   const editMode = searchParams.get("edit") === "true";

   // Show beautiful hero layout always (like html/profile.html)
   // Add edit controls only for owner
   // Show edit modals when editMode && isOwner
   ```

### Phase 2: Implement Edit System (React Router Style)

1. **Visual Edit Indicators**
   - CSS classes for edit mode styling
   - Hover effects with dashed outlines
   - Edit icons (✎) on hover
   - All using CSS + conditional classes

2. **Modal-Based Editing**
   - Edit forms appear in modals (like html version)
   - Use React Router forms with proper actions
   - Different modal types: text, image, complex objects
   - Preserve all existing form validation

3. **Editor Toolbar**
   - Sticky toolbar when in edit mode
   - Save/Reset/Preview buttons
   - Use React Router navigation for state changes

### Phase 3: Product & Links Integration

1. **Product Display**
   - Use ProductList component (showcase mode) like m.$id.tsx
   - Split into "Shop" and "Workbench" sections
   - Add conditional admin actions when in edit mode
   - Keep existing CRUD operations via modals

2. **Profile Links**
   - Use html/profile.html grid layout design
   - Beautiful cards with icons and hover effects
   - Add/delete functionality only visible to owner
   - Edit existing links via modal system

## Implementation Steps

### Step 1: Create New Hero Section

- [ ] Replace compact profile card with html/profile.html hero design
- [ ] Large avatar, big typography, proper spacing
- [ ] Add edit mode CSS classes and visual indicators
- [ ] Add edit button for profile owners

### Step 2: Implement Modal Edit System

- [ ] Create edit modal component for different content types
- [ ] Add CSS for edit mode visual indicators (dashed outlines, edit icons)
- [ ] Connect modals to existing React Router actions
- [ ] Add editor toolbar for edit mode

### Step 3: Update Product & Links Sections

- [ ] Replace ProductManagement with ProductList (showcase style)
- [ ] Split products into Shop/Workbench with proper headings
- [ ] Update links section to match html/profile.html grid design
- [ ] Add conditional edit controls for both sections

### Step 4: Polish & Test

- [ ] Add animations and hover effects like html version
- [ ] Test all edit flows work with React Router
- [ ] Verify responsive design across breakpoints
- [ ] Ensure no functionality regressions

## Key Benefits

1. **Stunning Visual Design**: html/profile.html has the most beautiful profile design
2. **Consistent Experience**: Same gorgeous layout for owners and viewers
3. **Professional Edit Experience**: Modal-based editing with visual indicators
4. **Better UX**: Owners get the same great visual experience as visitors
5. **Maintainability**: Single beautiful design instead of two different layouts
6. **Progressive Enhancement**: Edit features layer on top gracefully

## Technical Approach

### React Router Integration
- Keep existing form actions and validation
- Use URL params for edit mode (`?edit=true`)
- Modal components with proper form handling
- Preserve all CRUD operations

### CSS Strategy
- Add edit mode classes for visual indicators
- Copy CSS animations and effects from html/profile.html
- Dashed outlines and edit icons on hover
- Maintain responsive design

### Component Architecture
- Create reusable edit modal component
- Keep existing ProductList and other components
- Add conditional editing overlays
- Preserve image upload functionality

## Files to Modify

- `app/routes/profile.tsx` - Complete redesign with hero layout
- Create new components:
  - `EditModal.tsx` - For modal-based editing
  - CSS styles for edit mode indicators
- Update existing:
  - Keep all form actions working
  - Preserve image upload functionality

## Design Elements to Copy from html/profile.html

1. **Hero Section Layout**: Exact spacing, typography, avatar sizing
2. **Edit Mode Styling**: Dashed outlines, edit icons, hover effects
3. **Social Links Grid**: Beautiful cards with icons and external link indicators
4. **Section Headers**: Large typography with subtle descriptions
5. **Animation Classes**: fade-in, hover-lift, etc.
6. **Color Scheme**: Consistent with existing theme system

## No Vue.js - Pure React Router

- All interactivity through React state and URL params
- Form submissions via React Router actions
- No client-side persistence (server-side only)
- Progressive enhancement patterns maintained
