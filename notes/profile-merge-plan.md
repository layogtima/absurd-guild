# Profile Merge Plan: Ada.html + Maker-Profile-Complete.html

## Analysis Summary

### Ada.html Features

- **Static HTML** with vanilla JavaScript
- **Tab-based navigation** (Featured, Activity, Campaigns, Products, Tools, Projects, Experiments, Showcase)
- **Card-based content sections** with rich imagery and metadata
- **Timeline in Activity tab** with timestamps
- **Product cards** with pricing and "Buy Now" CTAs
- **Hero section** with:
  - Avatar with glow effect animation
  - "Currently Obsessed With" section
  - Skill tags (hover effects, clickable)
  - Quick links (external sites)
- **Smooth scroll animations** using Intersection Observer
- **Console easter egg**

### Maker-Profile-Complete.html Features

- **Vue.js 3** reactive application
- **Modal system** for project details (click card → modal with full info)
- **Detailed project structure**:
  - Full description
  - Problem solved
  - Tools used (with categories)
  - Skills learned
  - Links (GitHub, docs, video)
- **Tool filtering system** by category (All, Electronics, Measuring, etc.)
- **Future Projects section** with status badges (Idea, Planning, In Progress)
- **Skills with context** - shows which projects used each skill (clickable)
- **Richer data model** with structured tool/skill relationships
- **Hero section** with:
  - Avatar
  - Bio paragraph
  - Social links in grid layout

---

## Questions for You

### 1. **Framework Choice**

- Do you want to keep **Vue.js** (reactive, modal system) or switch to **vanilla JS** (simpler, static)? simple vanilla js
- Or would you prefer **React** (since the codebase uses React Router)?

### 2. **Navigation Structure**

Which tab structure do you prefer?

- **Option A (Ada)**: Featured, Activity, Campaigns, Products, Tools, Projects, Experiments, Showcase
- **Option B (Maker-Complete)**: What I've Built, My Workshop, What's Next, Skills & Expertise
- **Option C (Hybrid)**: Featured, Projects, Tools, Future Projects, Skills, Activity, Showcase

Hybrid:

- rename Showcase to Resources
- Combine Projects and Experiments into Projects

The navigation: Have the sectiion work such that we jump to a specific section using internal (#) links and don't hide other sections when switching (so that the user can scroll through instead)

### 3. **Project Display**

How should projects be displayed?

- **Option A**: Card grid + modal (like Maker-Complete) - click for full details (this, but also allow to jump to a dedicated page; but we will implement the dedicated page later; for now point to dummy links)
- **Option B**: Card grid only (like Ada) - all info visible on cards
- **Option C**: Hybrid - cards with basic info, expandable sections (no modal)

### 4. **"Currently Obsessed With" Section**

- Keep this prominent callout in the hero? Yes (Ada has it, Maker-Complete doesn't)
- If yes, should it be:
  - Static content
  - Pulled from latest activity/project
  - Editable field [this]

### 5. **Tools Section**

Which approach for tools?

- **Option A (Ada)**: Detailed cards with images, "Why" explanations, no filtering
- **Option B (Maker-Complete)**: Compact cards with category filter, "Used For" text, "Using since" dates (this but add an image thing like in Ada) [can link out to an individual tool page; but we'll skin the the individual tool page out later]
- **Option C**: Hybrid - detailed cards WITH category filtering

### 6. **Skills Section**

- Keep the "Skills with Context" approach (shows which projects used each skill)?
- Or just display skill tags without project relationships?
- Should clicking a skill filter/highlight related projects?

Keep it simplest for now

### 7. **Activity/Timeline**

- Include the Activity tab with timestamps (3 days ago, 1 week ago)? yes
- Should this be auto-generated from project dates or manually curated? yes, using updatedAt field in the db for projects/products

### 8. **Future Projects**

- Keep this section with status badges (Idea, Planning, In Progress)? yes
- Include "Tools Needed" and "Skills Needed" fields? yes

but combine this section into the projects section

### 9. **Products Section**

- Keep the Products tab with pricing and "Buy Now" buttons? (Ada has this) yes, if the maker add these (if they at least put a link to a shop)
- Or skip it if not selling products?

### 10. **Social Links**

Which style for social links?

- **Option A (Ada)**: Horizontal row of bordered boxes with icons; this
- **Option B (Maker-Complete)**: 2x2 grid with icon + label + external link indicator

### 11. **Campaigns & Showcase**

- Keep these sections from Ada? (Campaigns for major initiatives, Showcase for talks/awards) keep campaigns; rename showcase to be resources
- These aren't in Maker-Complete

### 12. **Animations**

- Keep Intersection Observer scroll animations (Ada)? yes
- Keep Vue transition animations (Maker-Complete)? no
- Both? Neither?

---

## Proposed Hybrid Structure (Draft)

### Hero Section

```
- Avatar with glow animation (Ada style)
- Name + Tagline
- "Currently Obsessed With" callout box (Ada)
- Skill tags with hover effects (both have this)
- Social links in grid (Maker-Complete style but Ada's hover effects)
```

### Tab Navigation

```
1. Featured - curated highlights
2. Projects - all past projects (Maker-Complete's detailed data + Ada's visual style)
3. Tools - filterable tool grid (hybrid approach)
4. Future Projects - with status badges (Maker-Complete)
5. Skills - with project relationships (Maker-Complete)
6. Activity - timeline view (Ada)
7. Showcase - talks, awards, media (Ada)
```

### Project Cards

```
- Grid display (both)
- Click → Modal with full details (Maker-Complete)
- Modal contains:
  - Image
  - Full description (Maker-Complete)
  - Problem solved (Maker-Complete)
  - Tools used with categories (Maker-Complete)
  - Skills learned (Maker-Complete)
  - Links (GitHub, docs, video)
  - Tags (Ada style pills)
```

---

## Technical Decisions Needed

### A. Data Management

- Should profile data be in:
  - **Embedded in HTML** (like both current versions)
  - **Separate JSON file** loaded at runtime: this
  - **Database** with API endpoint (more dynamic)

### B. Responsive Design

Both use Tailwind with similar breakpoints. Keep this approach? yes

### C. Theme System

Both have dark/light mode. Keep this? (Yes, I assume)

### D. Accessibility

- Add proper ARIA labels? yes, but in phase 2
- Keyboard navigation for modals? yes, but in phase 2
- Focus management? yes, but in phase 2

---

## Next Steps

1. **Answer the questions above**
2. **Review the proposed structure** - modify as needed
3. **I'll create a detailed implementation plan** with file structure
4. **Get your approval** before coding

---

## Notes

- Both files use the same color scheme (CSS variables)
- Both use Jura font and similar animation styles
- Both have the spinning Absurd Industries logo
- Both are single-file HTML (no build process)

What would you like to adjust in this plan?
