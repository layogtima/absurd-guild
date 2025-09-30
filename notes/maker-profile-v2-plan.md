# Maker Profile V2 - Planning Document

## Overview

Creating a comprehensive maker profile page that includes:

- Past projects/products (what you've made)
- Tools & equipment used for each project
- Motivation/problems solved
- Skills learned from each project
- Future project ideas
- Tools & software preferences

The design will follow the aesthetic and structure of `html/profile.html`.

---

## Questions to Answer Before Implementation

### 1. Profile Structure & Sections

Looking at `profile.html`, it has these sections:

- Hero (name, tagline, bio, avatar)
- Social Links
- Campaigns (Future Hardware)
- Products (Shop)
- Workbench (current projects)

**For your maker profile, should we have:**

#### A. Past Projects Section

- **Title suggestion:** "Projects" or "What I've Built" or "Portfolio"
- Should each project card show:
  - [ ] Project name
  - [ ] Photo/video
  - [ ] Brief description
  - [ ] Detailed story (in modal/expanded view)
  - [ ] Tools used (with icons?)
  - [ ] Problem it solved
  - [ ] Skills learned
  - [ ] Year/date completed
  - [ ] Links (GitHub, docs, video, etc.)
  - [ ] Tags (e.g., "IoT", "3D Printed", "Open Source")

**Question 1:** What should each past project card display? What goes in the card vs. what shows in the detailed view? photo, tags, title

#### B. Tools & Equipment Section

- **Title suggestion:** "My Workshop" or "Tools I Use" or "Equipment"
- Should this be:
  - [ ] A categorized list (CAD software, 3D printers, soldering, etc.)
  - [ ] Cards with tool names, descriptions, and what you use them for. this
  - [ ] Integrated into each project (shown contextually)

**Question 2:** How should we display your tools? As a separate section, or should they appear in each project's details?

Currently you mentioned:

```
CAD: Fusion 360
3D Printing: Creality Ender 3
Slicing: Cura
Soldering: Goot RX 711AS
Electronics: ESP32
```

Should we have more categories like:

- Programming languages/IDEs?
- Hand tools?
- Measuring equipment?
- Materials you commonly use?

yes all of the above

#### C. Future Projects Section

- **Title suggestion:** "What's Next" or "Future Projects" or "Ideas Brewing"
- Should this show:
  - [ ] Project name
  - [ ] Brief description
  - [ ] What tools/skills needed
  - [ ] Status (idea, planning, in progress)
  - [ ] Estimated timeline?

  all except timeline

**Question 3:** What information should future project cards contain?

#### D. Skills & Learning Section

- Should skills be:
  - [ ] Listed in profile header as tags
  - [ ] Shown in a dedicated section with proficiency levels
  - [ ] Embedded in each project (showing what was learned)
  - [ ] All of the above: yes

**Question 4:** How do you want to showcase skills? Should we show progression/learning journey?
no journey. a list of skills with projects as context

---

### 2. Data Structure & Organization

#### A. Past Projects

For each past project, what fields do we need? look at the above and update the structure

**Proposed structure:**

```json
{
  "id": "lampy-lamp",
  "name": "Lampy",
  "tagline": "Modular ambient lamp",
  "thumbnail": "url",
  "images": ["url1", "url2"],
  "video": "optional-url",
  "shortDescription": "Brief 1-2 line description",
  "fullDescription": "Detailed story, challenges, solutions",
  "problemSolved": "Why I made this",
  "toolsUsed": [
    {
      "category": "CAD",
      "tool": "Fusion 360",
      "purpose": "Designed the enclosure"
    },
    {
      "category": "3D Printing",
      "tool": "Creality Ender 3",
      "purpose": "Printed the housing"
    }
  ],
  "skillsLearned": ["3D printing", "LED programming", "Power management"],
  "completedDate": "2024-01",
  "status": "completed",
  "links": {
    "shop": "url",
    "github": "url",
    "docs": "url",
    "video": "url"
  },
  "tags": ["IoT", "Lighting", "3D Printed", "Open Source"]
}
```

**Question 5:** Does this data structure work? What should we add/remove/change?

#### B. Tools Database

Should we have a tools database that can be reused across projects? yes

```json
{
  "tools": {
    "fusion360": {
      "name": "Fusion 360",
      "category": "CAD Software",
      "icon": "url-or-class",
      "description": "3D CAD/CAM software",
      "usedFor": "Designing enclosures, mechanical parts",
      "since": "2022"
    },
    "ender3": {
      "name": "Creality Ender 3",
      "category": "3D Printer",
      "icon": "url-or-class",
      "description": "FDM 3D printer",
      "usedFor": "Printing prototypes and final parts"
    }
  }
}
```

**Question 6:** Should we maintain a central tools database, or just list tools per project? central db

---

### 3. Design & Layout Questions

#### A. Section Order

Based on `profile.html` structure:

1. Hero (name, avatar, tagline, bio)
2. Social Links
3. **Where should these go?**
   - Past Projects ("Portfolio")
   - Tools & Equipment ("Workshop")
   - Future Projects ("What's Next")
   - Current Campaigns
   - Products for Sale

**Question 7:** What order should these sections appear? What's most important to show first?

#### B. Visual Design

From `profile.html`, we have:

- **Beige/cream theme** (light mode) and **dark theme**
- **Orange accent color** (#ff4500)
- **Jura font** for headings
- **Rounded cards** with borders
- **Hover lift effect** on interactive elements

**Question 8:** Should we maintain this exact design language? Any customizations?

#### C. Project Cards Layout

Looking at the existing sections:

- Campaigns: 2-column grid with video, progress bar
- Products: 2-column grid with large image, price
- Workbench: 3-column grid with icon, tags

**Question 9:** What layout for past projects?

- 2-column (more detail visible)
- 3-column (more compact, more projects visible)
- Mixed (featured projects larger)

---

### 4. Interaction & Functionality: for now don't worry about this; we focus on the ui for now. these implementation

#### A. Edit Mode

`profile.html` has a live edit mode where you click elements to edit them.

**Question 10:** Do you want this same edit functionality? Or prefer a traditional edit form?

#### B. Project Detail View

When clicking a project:

- [ ] Open modal (like the workbench modal in profile.html)
- [ ] Navigate to separate page (`/projects/project-name`)
- [ ] Expand inline (accordion style)

**Question 11:** How should project details be shown?

#### C. Filtering & Search

With multiple projects:

- [ ] Filter by category/tag (IoT, 3D Printing, etc.)
- [ ] Filter by tool used
- [ ] Filter by year
- [ ] Search by keyword

**Question 12:** Do we need filtering? If yes, which filters are most useful?

---

### 5. Content Questions

#### A. Your Past Projects

**Question 13:** Can you list 3-5 past projects you want to showcase? For each:

fill this in based on steve wozniak's work

- Name
- What it is (1 line)
- What problem it solved
- Main tools used
- Key skills learned

#### B. Your Bio & Tagline

From `profile.html`, Amit has:

- Name: "Amit"
- Tagline: "LED Whisperer"
- Bio: "Building moddable lamps, lightsabers..."

**Question 14:** What should your:

- Display name be?
- Tagline be? (e.g., "Hardware Hacker", "IoT Maker", "3D Printing Enthusiast")
- Bio say? (2-3 sentences about your maker journey)

#### C. Future Projects

**Question 15:** What are 2-3 future projects you're excited about? Just names and brief descriptions.

---

### 6. Technical Implementation; don't worry about this right now

#### A. Database Schema

Should we create new tables:

- `maker_projects` - past projects
- `maker_tools` - tools database
- `maker_future_projects` - future ideas
- Or extend the existing `users` table with JSON fields?

**Question 16:** Do you have a preference? (I recommend separate tables for better querying)

#### B. File Storage

Projects will need images/videos.

**Question 17:** Should we:

- Upload to R2 (Cloudflare storage)
- Link to external URLs
- Both options available

#### C. Progressive Enhancement

Following your CLAUDE.md guidelines:

- Use URL params for UI state (`?project=lampy`)
- Forms use POST for data mutations
- Works without JavaScript (mostly)

**Question 18:** Any specific progressive enhancement requirements?

---

## ANSWERS SUMMARY

### Confirmed Decisions:

#### Past Projects Section ("What I've Built")
- **Card shows:** Photo, title, tags
- **Detail view shows:** Full description, problem solved, tools used, skills learned, links

#### Tools & Equipment Section ("My Workshop")
- **Format:** Cards with tool names, descriptions, and what they're used for
- **Categories:** CAD, 3D Printing, Slicing, Soldering, Electronics, Programming/IDEs, Hand tools, Measuring equipment, Materials
- **Storage:** Central tools database (reusable across projects)

#### Future Projects Section ("What's Next")
- **Shows:** Project name, brief description, tools/skills needed, status (idea/planning/in progress)
- **No timeline** for now

#### Skills Section
- **Format:** List of skills with projects as context (no journey/progression)
- **Display:** In profile header as tags + dedicated section + embedded in projects

#### Section Order:
1. Hero (name, avatar, tagline, bio)
2. Social Links
3. Skills Overview (tags in header)
4. **Past Projects** - 2-column grid
5. **Tools & Equipment** - card grid
6. **Future Projects** - 3-column grid
7. **Skills** - detailed list with project context
8. Campaigns (if any)
9. Products (if any)

#### Sample Content:
- Using **Steve Wozniak's projects** as inspiration for sample data
- Need to populate: name, tagline, bio

---

## HTML MOCKUP PHASES

### Phase 1: Hero + Past Projects
- Hero section with avatar, name, tagline, bio
- Social links
- Past Projects section (2-column grid)
- Project detail modal

### Phase 2: Tools & Skills
- Tools/Equipment section (card grid)
- Skills section with project context

### Phase 3: Future Projects
- Future Projects section (3-column grid)
- Complete integration

---

## Next Steps

Creating HTML mockups in phases:
1. `html/maker-profile-phase1.html` - Hero + Past Projects
2. `html/maker-profile-phase2.html` - Add Tools + Skills
3. `html/maker-profile-complete.html` - Full version with all sections
