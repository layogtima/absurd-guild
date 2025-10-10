# Phase 1B Testing Guide - Projects + BOM (Core Workbench)

## What was built:

### 1. Database Migration
- File: `db/migrations/0008_create_projects.sql`
- Tables: `projects`, `project_items`
- Indexes for performance

### 2. Server Functions
- File: `app/lib/workbench.server.ts`
- Functions:
  - `getUserProjects(db, userId, filters?)` - Get user's projects
  - `getProjectById(db, projectId)` - Get project details
  - `getProjectItems(db, projectId)` - Get project BOM with item details
  - `createProject(db, data)` - Create new project
  - `updateProject(db, id, data)` - Update project
  - `addItemToProject(db, data)` - Add item to BOM
  - `updateProjectItem(db, id, data)` - Update quantities, status, etc.
  - `removeProjectItem(db, id)` - Remove item from BOM

### 3. Routes
- `/workbench` - List all user's projects (app/routes/workbench.tsx)
- `/workbench/new` - Create new project (app/routes/workbench.new.tsx)
- `/workbench/:projectId` - View/edit project + manage BOM (app/routes/workbench.$projectId.tsx)

### 4. Route Registration
- Updated `app/routes.ts` to register all workbench routes

---

## How to test Phase 1B:

### Step 1: Apply Migration

```bash
# Apply the migration to create tables
wrangler d1 execute absurd-guild-db --file=./db/migrations/0008_create_projects.sql

# Verify tables were created
wrangler d1 execute absurd-guild-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects', 'project_items');"
```

### Step 2: Ensure Phase 1A is Working

Make sure you have at least a few items in the global library from Phase 1A testing.
If not, add some items at `/items/new`.

### Step 3: Test Workbench List Page

1. Navigate to `http://localhost:5173/workbench`
2. **Expected:** Login required (redirects to `/auth/login` if not logged in)
3. **Expected:** After login, see "My Workbench" page
4. **Expected:** Empty state with "No projects yet" message
5. **Expected:** "+ New Project" button visible

### Step 4: Test Create Project

1. Click "+ New Project" button
2. Fill out form:
   - **Title:** e.g., "Arduino Temperature Monitor"
   - **Description:** e.g., "Monitor room temperature using DHT22 sensor"
   - **Category:** e.g., "IoT"
   - **Status:** Select "Planning"
   - **Visibility:** Select "Private"
3. Click "Create Project"
4. **Expected:** Redirect to project detail page
5. **Expected:** See project title, status badges, description
6. **Expected:** Progress bar showing 0% (no items yet)
7. **Expected:** Empty BOM section with "+ Add Item" button

### Step 5: Test Add Item to Project

1. On project detail page, click "+ Add Item"
2. **Expected:** Form appears with:
   - Dropdown of all available items from global library
   - Quantity needed field (default: 1)
   - "Add to BOM" button
   - "Cancel" button
   - "+ Create New Item" link
3. Select an item from dropdown
4. Set quantity needed (e.g., 2)
5. Click "Add to BOM"
6. **Expected:** Item appears in BOM list
7. **Expected:** Shows quantity "0 / 2" (have 0, need 2)
8. **Expected:** Status badge shows "needed"
9. **Expected:** Progress bar still at 0%

### Step 6: Test Add Multiple Items

1. Click "+ Add Item" again
2. Add 2-3 more items with different quantities
3. **Expected:** All items appear in BOM list
4. **Expected:** Each shows correct quantity needed

### Step 7: Test Update Item Quantities

1. Click "Edit" on an item in the BOM
2. **Expected:** Inline edit form appears with fields:
   - Quantity Have
   - Status (needed, ordered, received)
   - Vendor
   - Cost
   - Notes
3. Update "Quantity Have" to match "Quantity Needed"
4. Change status to "received"
5. Add vendor (e.g., "Robu.in")
6. Add cost (e.g., 250.00)
7. Add notes (e.g., "Bought during sale")
8. Click "Save"
9. **Expected:** Item updates, shows "Ready" badge (green)
10. **Expected:** Progress bar increases
11. **Expected:** Shows vendor and cost information

### Step 8: Test Item Status Tracking

1. Edit another item
2. Set "Quantity Have" to 0
3. Change status to "ordered"
4. Click "Save"
5. **Expected:** Status badge shows "ordered" (orange)
6. **Expected:** Not marked as "Ready"

### Step 9: Test Progress Tracking

1. Update items until some are ready (qty have >= qty needed)
2. **Expected:** Progress bar shows percentage complete
3. **Expected:** Shows "X / Y items ready (Z%)"
4. **Expected:** When all items ready, progress shows 100%

### Step 10: Test Remove Item

1. Click "Remove" on an item
2. Confirm deletion
3. **Expected:** Item removed from BOM
4. **Expected:** Progress bar recalculates

### Step 11: Test Edit Project

1. Click "Edit Project" button
2. **Expected:** Inline form appears
3. Change title, description, status, or visibility
4. Click "Save Changes"
5. **Expected:** Project updates
6. **Expected:** Status badge updates if changed

### Step 12: Test Back to Workbench

1. Click "← Back to Workbench"
2. **Expected:** Return to `/workbench` page
3. **Expected:** See project in list with:
   - Status badge
   - Visibility badge
   - Category badge
   - Title and description
   - Last updated date

### Step 13: Test Multiple Projects

1. Create 2-3 more projects
2. **Expected:** All projects show in workbench list
3. **Expected:** Click on any project to view details

### Step 14: Test Link to Item Details

1. On project detail page, click an item name in BOM
2. **Expected:** Navigate to `/items/:itemId` page
3. **Expected:** See item details
4. Click back to return to project

### Step 15: Test Create New Item from Project

1. On project detail page, click "+ Add Item"
2. Click "+ Create New Item" link
3. **Expected:** Navigate to `/items/new`
4. Create a new item
5. **Expected:** After creating, can go back to project and add the new item

---

## Success Criteria (Phase 1B Checklist):

- [ ] Migration applies without errors
- [ ] Tables `projects` and `project_items` exist in database
- [ ] Can view workbench at `/workbench` (requires login)
- [ ] Can create new project at `/workbench/new`
- [ ] Can view project details at `/workbench/:projectId`
- [ ] Can add items from global library to project
- [ ] Can set quantity needed when adding items
- [ ] Can view project BOM with all items
- [ ] Can update item quantities (have vs needed)
- [ ] Can update item status (needed → ordered → received)
- [ ] Can add vendor, cost, and notes to items
- [ ] Items automatically marked "Ready" when qty_have >= qty_needed
- [ ] Progress bar accurately shows BOM completion
- [ ] Can remove items from project
- [ ] Can edit project details (title, description, status, visibility)
- [ ] Can navigate between workbench list and project details
- [ ] Can click item names to view item details
- [ ] Status and visibility badges display correctly

---

## Next Steps After Phase 1B Success:

Once all tests pass, we have achieved the **CORE FEATURE** of the workbench! 🎉

You can now:
- ✅ Create projects
- ✅ Add items from the global library
- ✅ Track what you need vs what you have
- ✅ Monitor project progress

**Optional next phases:**
- **Phase 1C:** Add links, images, and notes to projects
- **Phase 1D:** Enhanced item status tracking
- **Phase 1E:** Public project browsing
- **Phase 1F:** Migrate existing products

---

## Sample Test Workflow

Here's a complete workflow to test:

1. **Setup:** Add 3-4 items to global library (if not already done)
2. **Create Project:** "Arduino Weather Station"
   - Category: IoT
   - Status: Planning
   - Visibility: Private
3. **Add Items to BOM:**
   - Arduino Uno R3 (qty: 1)
   - DHT22 Temperature Sensor (qty: 1)
   - LCD Display 16x2 (qty: 1)
   - Breadboard (qty: 1)
   - Jumper Wires (qty: 20)
4. **Track Progress:**
   - Mark Arduino as "ordered" (qty_have: 0)
   - Mark DHT22 as "received" (qty_have: 1, vendor: "Robu.in", cost: 200)
   - Mark LCD as "received" (qty_have: 1)
   - Mark Breadboard as "received" (qty_have: 1)
   - Mark Jumper Wires as "received" (qty_have: 20)
5. **Verify:**
   - Progress shows 80% (4/5 items ready, Arduino still ordered)
   - Update Arduino to received (qty_have: 1)
   - Progress shows 100% ✅
