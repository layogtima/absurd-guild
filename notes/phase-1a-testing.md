# Phase 1A Testing Guide - Items Foundation

## What was built:

### 1. Database Migration

- File: `db/migrations/0007_create_items.sql`
- Tables: `items`, `item_resources`
- Indexes for performance

### 2. Server Functions

- File: `app/lib/items.server.ts`
- Functions:
  - `getAllItems(db, filters?)` - Browse with search/filter
  - `getItemById(db, id)` - Get item + resources
  - `createItem(db, data)` - Add new item
  - `updateItem(db, id, data)` - Edit item
  - `createItemResource(db, data)` - Add resource link
  - `deleteItemResource(db, id)` - Remove resource

### 3. Routes

- `/items` - Browse all items (app/routes/items.tsx)
- `/items/new` - Add new item (app/routes/items.new.tsx)
- `/items/:itemId` - View item details (app/routes/items.$itemId.tsx)

### 4. Route Registration

- Updated `app/routes.ts` to register all item routes

---

## How to test Phase 1A:

### Step 1: Apply Migration

```bash
# Apply the migration to create tables
wrangler d1 execute absurd-guild-db --file=./db/migrations/0007_create_items.sql

# Verify tables were created
wrangler d1 execute absurd-guild-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('items', 'item_resources');"
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Test Items List Page

1. Navigate to `http://localhost:5173/items`
2. **Expected:** Empty state with "No items found" message: Test result: ✅
3. **Expected:** "Add Item" button visible if logged in: Test result: ✅
4. **Expected:** Filter form visible (search, type, category)

### Step 4: Test Add Item

1. Click "Add Item" button (requires login)
2. Fill out form:
   - **Type:** Select "part", "tool", or "supply"
   - **Name:** e.g., "Arduino Uno R3"
   - **Category:** e.g., "electronics"
   - **Description:** Brief description
   - **Manufacturer:** e.g., "Arduino"
   - **Model Number:** e.g., "A000066"
   - **Typical Cost:** e.g., 250.00
   - **Unit:** e.g., "piece"
   - **Image URL:** Optional image link
3. Click "Add Item"
4. **Expected:** Redirect to item detail page with success message

Test result: ✅

### Step 5: Test Item Detail Page

1. **Expected:** Item name, type badge, category badge
2. **Expected:** All filled fields displayed correctly
3. **Expected:** Price formatted as ₹250.00 / piece
4. **Expected:** Empty resources section

Test result: ✅

### Step 6: Test Add Resource

1. On item detail page, click "+ Add Resource"
2. Fill out resource form:
   - **Title:** e.g., "Buy from Robu.in"
   - **URL:** e.g., "https://robu.in/product/arduino-uno-r3/"
   - **Type:** Select "supplier"
   - **Price:** e.g., 249.00
   - **Notes:** Optional notes
3. Click "Add Resource"
4. **Expected:** Resource appears in list with delete button

Test result: ✅

### Step 7: Test Filters

1. Navigate to `/items`
2. Add multiple items with different types/categories
3. Test search: Enter text in search box, click Filter
4. **Expected:** Only matching items shown
5. Test type filter: Select "part", click Filter
6. **Expected:** Only parts shown
7. Test category filter: Enter category, click Filter
8. **Expected:** Only items in that category shown
9. Click "Clear" button
10. **Expected:** All filters cleared, all items shown

### Step 8: Test Delete Resource

1. On item detail page with resources
2. Click "Delete" on a resource
3. Confirm deletion
4. **Expected:** Resource removed from list with success message

---

## Success Criteria (Phase 1A Checklist):

- ✅ Migration applies without errors
- ✅ Tables `items` and `item_resources` exist in database
- ✅ Can view items list at `/items`
- ✅ Can create new item at `/items/new`
- ✅ Can view item details at `/items/:itemId`
- ✅ Can add resources to items
- ✅ Can delete resources
- ✅ Search and filters work correctly
- ✅ Images display when provided
- ✅ Price formatting works (paise → rupees)
- ✅ All navigation works (back to list, cancel, etc.)

---

## Next Steps After Phase 1A Success:

Once all tests pass, we'll move to **Phase 1B: Projects + BOM**

This will include:

- Migration: `projects` + `project_items` tables
- Routes: `/workbench`, `/workbench/new`, `/workbench/:projectId`
- Feature: Create projects and add items from global library

---

## Sample Test Data

Here are some sample items you can add for testing:

**Part 1:**

- Type: part
- Name: Arduino Uno R3
- Category: electronics
- Manufacturer: Arduino
- Model: A000066
- Cost: 250.00
- Unit: piece

**Tool 1:**

- Type: tool
- Name: Soldering Iron 60W
- Category: soldering
- Manufacturer: Soldron
- Cost: 350.00
- Unit: piece

**Supply 1:**

- Type: supply
- Name: Lead-Free Solder Wire
- Category: soldering
- Model: 100g Roll
- Cost: 150.00
- Unit: roll

**Resource Examples:**

- Datasheet: Link to PDF spec sheet
- Supplier: Robu.in product page
- Guide: Tutorial video URL
