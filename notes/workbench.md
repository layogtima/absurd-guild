# Workbench Feature - Project Management for Makers

## Original Concept

the project entity has the following:

1. list of parts, tools, supplies. parts e.g. boost convertor, led strip (stuff that will actually be on the product); tools: soldering iron, multi-meter, lcr meter, energy meter (need to make or test the product); supplies: kapton tape, solder wire, solder paste
   1. part fields:
      1. name of the part
      2. link(s) [e.g. where to buy from, datasheet, guides and other resources]
      3. notes (past experience, how to avoid common mistakes, paired with another part etc, common pitfalls)
      4. have x nos, total needed n (so need y more)
   2. tools
      1. name of the tool
      2. links (how to use etc)
      3. dependent on supplies (e.g.: solder wire for soldering station etc)
   3. supplies

2. notes (add note, list in reverse chronological order, pin note (max upto 3 per project))
3. tasks
4. keep track of bom/expenses (including shipping, parts, supplies etc, services, softwares used)
5. template checklist (include all tasks, like breadboard design, schematics, )

let's imagine you're a maker developing and iterating on a hardware product, how can you keep track of your progress and keep track of the process using this tool.

what features would a maker need to have a smooth process? think of mise-en-place. also, as the maker goes through the process they should be able to create documentation (software, hardware, assembly, precautions, specs, ratings etc)

---

## Analysis & Critique

### Strengths
1. **Mise-en-place Approach**: Excellent focus on preparation - knowing what you have vs what you need before starting
2. **Holistic Tracking**: Covers parts, tools, supplies, tasks, notes, and expenses - comprehensive
3. **Knowledge Capture**: Notes field for parts allows capturing tribal knowledge and mistakes
4. **Inventory Management**: "have x, need n" approach is practical for makers
5. **Tool-Supply Dependencies**: Recognizing that tools need supplies is insightful

### Areas for Enhancement
1. **Version Control**: Hardware projects iterate - need to track versions/revisions of designs
2. **Testing & Validation**: Missing test results, measurements, validation steps
3. **Assembly Steps**: No clear assembly instruction/sequence tracking
4. **Media Attachments**: Photos, videos, diagrams crucial for hardware documentation
5. **Supplier/Vendor Info**: Beyond links - track reliability, shipping times, alternatives
6. **Reusability**: Parts/tools/supplies library that can be reused across projects
7. **Collaboration**: If working with others, need to assign tasks, share notes
8. **Milestones**: Track major phases (prototype v1, v2, production-ready, etc.)

---

## Recommended Implementation Plan

### Phase 1: Core Workbench Structure
**Goal**: Enable makers to create projects and track basic inventory

#### Database Schema Changes Required

**New Tables:**

```sql
-- Workbench Projects (extends existing products table conceptually)
CREATE TABLE workbench_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER, -- Link to products table if this becomes a product
  title TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT 'v1.0', -- Track iterations
  status TEXT DEFAULT 'planning', -- planning, prototyping, testing, completed, archived
  thumbnail_key TEXT,
  thumbnail_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Project Parts (BOM items that go into the final product)
CREATE TABLE project_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  quantity_have INTEGER NOT NULL DEFAULT 0,
  unit_cost INTEGER, -- in paise
  total_cost INTEGER, -- in paise (quantity * unit_cost + shipping)
  category TEXT, -- electronics, mechanical, fasteners, etc.
  notes TEXT, -- tips, gotchas, compatibility notes
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES workbench_projects(id) ON DELETE CASCADE
);

-- Part Resources (links for datasheets, suppliers, guides)
CREATE TABLE part_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL,
  title TEXT NOT NULL, -- "Datasheet", "Buy from DigiKey", "Tutorial"
  url TEXT NOT NULL,
  resource_type TEXT, -- datasheet, supplier, guide, video, alternative
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES project_parts(id) ON DELETE CASCADE
);

-- Project Tools (needed to build/test, not consumed)
CREATE TABLE project_tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_available BOOLEAN DEFAULT FALSE, -- Do I have this tool?
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES workbench_projects(id) ON DELETE CASCADE
);

-- Tool Resources (how to use, where to buy/rent)
CREATE TABLE tool_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT, -- guide, rental, purchase, video
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES project_tools(id) ON DELETE CASCADE
);

-- Tool Supply Dependencies
CREATE TABLE tool_supply_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  supply_id INTEGER NOT NULL,
  notes TEXT, -- "Use 0.8mm diameter solder wire"
  FOREIGN KEY (tool_id) REFERENCES project_tools(id) ON DELETE CASCADE,
  FOREIGN KEY (supply_id) REFERENCES project_supplies(id) ON DELETE CASCADE
);

-- Project Supplies (consumables like solder, tape)
CREATE TABLE project_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity_needed INTEGER,
  quantity_have INTEGER DEFAULT 0,
  unit TEXT, -- meters, grams, pieces, ml
  unit_cost INTEGER, -- in paise
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES workbench_projects(id) ON DELETE CASCADE
);

-- Project Notes (chronological log with pinning)
CREATE TABLE project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  note_type TEXT DEFAULT 'general', -- general, issue, solution, idea, milestone
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES workbench_projects(id) ON DELETE CASCADE
);

-- Project Tasks (with template support)
CREATE TABLE project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, blocked
  priority TEXT DEFAULT 'medium', -- low, medium, high
  due_date DATE,
  completed_at DATETIME,
  is_milestone BOOLEAN DEFAULT FALSE,
  is_template_task BOOLEAN DEFAULT FALSE, -- For checklist templates
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES workbench_projects(id) ON DELETE CASCADE
);

-- Expenses Tracking
CREATE TABLE project_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  part_id INTEGER, -- Link to part if expense is for a part
  supply_id INTEGER, -- Link to supply if expense is for a supply
  tool_id INTEGER, -- Link to tool if expense is for a tool
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in paise
  expense_type TEXT NOT NULL, -- part, supply, tool, service, software, shipping, other
  vendor TEXT, -- Where purchased from
  receipt_url TEXT, -- Link to receipt/invoice
  purchased_at DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES workbench_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES project_parts(id) ON DELETE SET NULL,
  FOREIGN KEY (supply_id) REFERENCES project_supplies(id) ON DELETE SET NULL,
  FOREIGN KEY (tool_id) REFERENCES project_tools(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_workbench_projects_user ON workbench_projects(user_id);
CREATE INDEX idx_workbench_projects_status ON workbench_projects(status);
CREATE INDEX idx_project_parts_project ON project_parts(project_id);
CREATE INDEX idx_project_tools_project ON project_tools(project_id);
CREATE INDEX idx_project_supplies_project ON project_supplies(project_id);
CREATE INDEX idx_project_notes_project ON project_notes(project_id);
CREATE INDEX idx_project_notes_pinned ON project_notes(is_pinned);
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_expenses_project ON project_expenses(project_id);
```

### Phase 2: Enhanced Features
- **Media Attachments**: Add table for photos/videos attached to notes, parts, assembly steps
- **Assembly Instructions**: Step-by-step assembly guide builder
- **Test Results**: Track measurements, test data, validation results
- **Version History**: Track design iterations and changes
- **Templates**: Save project structures as templates for reuse

### Phase 3: Documentation & Publishing
- **Auto-generate BOM**: Export complete bill of materials
- **Assembly Guide Export**: Generate PDF/web assembly instructions
- **Documentation Builder**: Create product documentation from project data
- **Publish to Product**: Convert workbench project to public product/campaign

---

## Questions Before Implementation

### 1. Project Scope
- **Q1**: Should workbench projects be private by default (vs products which are public)?
- **Q2**: Do we want makers to be able to convert a workbench project into a product or campaign later?
- **Q3**: Should there be a "project template library" where makers can start from common project types (e.g., "Arduino-based IoT device", "LED matrix project")?

### 2. Inventory Management
- **Q4**: Should we have a global "user inventory" (parts/tools I own) separate from per-project tracking? This would help with reusability across projects.
- **Q5**: For parts with multiple suppliers - do we want price comparison features or just list multiple links?
- **Q6**: How should we handle part alternatives/substitutions? (e.g., "Can use BC547 or 2N2222 transistor")

### 3. Collaboration & Sharing
- **Q7**: Should makers be able to share read-only access to projects with collaborators?
- **Q8**: Do we want a "fork project" feature where someone can copy another maker's workbench project as their starting point?

### 4. Task Management
- **Q9**: What common task templates should we provide? (breadboard prototype, schematic design, PCB layout, 3D modeling, testing, documentation, etc.)
- **Q10**: Should tasks support sub-tasks or dependencies (e.g., "can't test until parts arrive")?
- **Q11**: Should tasks be assignable to specific dates or just a general sequence?

### 5. Documentation Features
- **Q12**: What documentation types are most important? (Assembly guide, user manual, safety warnings, specifications, design files, source code, test reports)
- **Q13**: Should documentation be markdown-based or a structured form builder?
- **Q14**: Do we want version control for documentation (track changes over iterations)?

### 6. Expense Tracking
- **Q15**: Should we calculate total project cost automatically from all expenses?
- **Q16**: Do makers want to track "budgeted vs actual" costs?
- **Q17**: Should we support multiple currencies or just INR?

### 7. UI/UX Priorities
- **Q18**: What's the most important view for a maker's workflow? (Overview dashboard, parts checklist, task list, notes timeline, expenses summary)
- **Q19**: Should the workbench be a separate section in the dashboard or integrated with products?
- **Q20**: Mobile experience - what features are most critical for mobile (adding notes/photos on the go, checking parts list, updating tasks)?

### 8. Mise-en-place Features
- **Q21**: Should there be a "ready check" feature that validates if all parts/tools/supplies are available before starting?
- **Q22**: Do we want a "shopping list generator" that creates a combined list of everything needed but not yet acquired?
- **Q23**: Should we track estimated build time and actual time spent?

---

## Next Steps

Please review and answer the questions above. Based on your answers, we'll:
1. Finalize the database schema
2. Create migration files
3. Build server-side functions for CRUD operations
4. Design the UI/UX flows
5. Implement the workbench feature in phases
