# 3D CAD Search — Design Requirements / PRD

**Status:** Draft v2 for engineering handoff (Claude Code) — incorporates Aaron's Oct 8 review answers. Defines the full target front end for a future dev build; the current production app is a very limited beta, and this PRD is not constrained by what the beta does today.
**Prepared:** October 7, 2026 (revised October 8, 2026)
**Owner:** Aaron (Datum)
**Data:** All screens are built against fake/example data (the example dataset already prepared for Claude Code). This is a prototype, not a real technical build: no live PLM or matching-engine integration is assumed, and **there is no actual CAD viewer in the prototype** — every 3D viewport is a placeholder. Specific lists in this PRD (file formats, measurement types, band cutoffs, provenance values) are examples unless stated otherwise.
**Scope:** The CAD geometry search feature only — Files browsing, search definition, results, and 3D comparison. BOM Creation, Warranty Analysis, Part Replacement, and the broader non-linear "requirements workflow" prototype are separate tracks and are referenced only where they intersect (entry points, shared chrome).

---

## 0. How to read this document — source-of-truth hierarchy

This PRD was built from four newly uploaded "design file" bundles (`part_vs_assembly`, `cad_compare`, `file_selection`, `homepage_search`), a 30-second screen recording of the actual running search UI, and prior project material (the `work_v3/req_v6` prototype, the v2 "Compare Parts" screen, and existing requirements docs). Per Aaron's direction, where these sources disagree, precedence is:

1. **The video recording** (`Screen_Recording_2026-10-07_at_2.41.04PM`) — a capture of the current production app, which Aaron has clarified is a **very limited beta**. Treated as ground truth for the interactions and behaviors it shows, but it is a subset of the target product, not the ceiling.
2. **Real screenshots pasted into the design files** (the `uploads/pasted-*.png` and `screenshots/*.png` images embedded in the design-tool canvases) — screenshots of the live app (Adient-tenant data, real chrome), pasted in by the designer as reference. Same status as the video.
3. **The newly authored design mockups themselves** (the `.jsx`/`.dc.html` source in the four zips) — the target visual front end. Where they go beyond the beta (left-nav IA, four-card modality picker, richer filtering, Columns/density controls, Alignment tooling) they are the spec, but **not** where they merely contain placeholder data, dead code, or unresolved naming — see §8.
4. **Prior prototype generations** (`work_v3/req_v6`, the v2 "Compare Parts" screen, and earlier project docs' certainty-tier vocabulary) — superseded wherever they conflict with 1–3. Kept only as historical context in §7.

Everywhere this document makes a judgment call between conflicting sources, it says so explicitly and — per Aaron's instruction — flags it as an open question in §9 rather than silently guessing.

---

## 1. What this feature is

Datum's 3D CAD search lets an engineer find geometrically similar parts or assemblies across the company's CAD/PLM library, compare a candidate against a reference part face-to-face in 3D, and confirm or reject the match. It sits on top of the proprietary geometric-matching engine (out of scope for this PRD) and is the "CAD geometry hit" entry point referenced in the agentic-AI architecture doc's non-linear flow diagram — i.e., a result from this feature can feed into the shared exploration canvas / requirements workflow prototype built separately.

The production app today is a very limited beta (per the video + real screenshots). We are designing a visual front end and writing the full front-end design requirements for developers to implement later. The design files describe the full flow: an explicit modality-picker entry screen (fully built out in the design), a part-catalogue search entry (details to come), denser PLM-aware filtering, a Columns/density customization system, and a more capable Alignment/constraint tool in Compare. This PRD specifies that target.

---

## 2. Information architecture

### 2.1 Global navigation (left sidebar)

This is the nav shown in the UI design files, and it is the target navigation for the full front end (decided by Aaron):

- **Search**
  - Assembly Search
  - Part Search
  - Find Duplicates
  - Find Revisions
  - Parts Catalogue (search entry option; see §5.6)
- **Create** (the group of workflows that produce an output; renamed from "Workflows" per Aaron, and also the label of the top-level tab)
  - BOM Creation
  - Warranty Analysis
  - Part Replacement
- **My Projects** (per-project tree: Saved searches / Outputs / Configurations counts, with a `+ New project` affordance)
- **Settings** (footer)

The beta currently shown in the video uses a much lighter top-nav (**Search** and **Saved Searches** tabs only, plus Feedback and the user menu). That is a limitation of the beta, not the target. Use the left-nav above for all screens; Files/Upload/Saved Searches become sub-destinations reachable once inside Search, not a competing top-level nav.

### 2.2 Top chrome

- Datum logo (home link)
- Optional tenant badge next to the logo when running under a customer tenant (e.g., "Adient" — confirmed in both the real screenshots and the design files)
- **Feedback** button (opens a feedback modal — see §2.3)
- Help and notifications icons
- User menu: avatar initials + email, with Settings / Log out

Breadcrumb strip below the top bar, confirmed pattern from the video: `Search / Files / Define / Results / Compare`. The design files' "New Search" screen uses a shorter `Home / New Search` breadcrumb for the pre-upload step. Both are legitimate — see §4 for how the two entry flows connect.

### 2.3 Feedback modal (submissions already create a Jira ticket)

- Title: "Send feedback"
- Subtitle: "Tell us about your experience, feature requests, or anything else on your mind."
- Field: "What happened?" (textarea, placeholder "Describe the issue or idea. Steps to reproduce help us most.")
- Field: "Attachments" (dropzone: "Drop CAD files, screenshots, or docs — or click to browse")
- Auto-attached context chips: `user`, `page`, `build`, `theme`
- Footer: "A copy is emailed to you on submit." Buttons: "Cancel" / "Submit ticket"

Behavior: submitting creates a Jira ticket (this already works in the beta). The Jira claim is not surfaced in the subtitle copy.

---

## 3. The four search modalities

The design files and the real "New Search" screenshot agree there are **exactly four** search modalities, selected before upload. Per Aaron, this four-card picker screen is the fully built-out flow. Canonical names below are **recommended** — the source material uses three different naming schemes for the same four concepts (short enum labels in the data model, marketing-style card copy on the homepage, and tag strings in the results-screen breadcrumb). Engineering should pick one; this PRD recommends the homepage card copy since it's the most descriptive and is what the user actually sees first.

| # | Recommended name | Input | Output | Card description (verbatim, real UI) |
|---|---|---|---|---|
| 1 | **Find similar parts** (Part → Part) | a single part | individual parts with similar geometry; no assemblies | "Upload a part. Get back individual parts with similar geometry. No assemblies." |
| 2 | **Find assemblies that use this part** (Part → Assembly) | a single part | assemblies that contain a similar part as a sub-component | "Upload a part. Get back assemblies that contain similar parts as a sub-component." |
| 3 | **Find similar assemblies** (Assembly → Assembly) | a whole assembly | assemblies with similar structure and matching child parts | "Upload an assembly. Get back assemblies with similar structure and matching child parts." |
| 4 | **Pull matching parts out of assemblies** (Part-in-Assembly → Part) | a part, in the context of the assembly it's found in | matching parts elsewhere, tagged with their parent assembly | "Upload a part within an assembly. Get back the matching parts, tagged with their parent assembly." |

**Parts Catalogue entry:** the New Search card screen also includes a **Parts Catalogue** search-entry card alongside the four modality cards (and a matching entry in the left nav's Search section, §2.1). It is a search entry option, not a fifth modality; it is specified in §5.6 (conceptual v1).

**Upload:** after picking a modality card, the file step is simply a **popup with file drag-and-drop or a file selector**. Accepted file types are shown as an example list only (the design files use .CATPart, .CATProduct, .STEP, SolidWorks); the real list is not fixed. The Teamcenter-ID paste option in the design copy is dropped.

**Note on the beta video:** it never shows this four-card picker screen — it goes straight from "Files" (browsing the existing library) into "Define," where the modality is implied by *which node the user selects in the assembly tree* (select a leaf part → effectively modality 1 or 4 depending on context; select the assembly root → modality 3). Both entry points are valid — see §4.

---

## 4. Entry points into search

Two entry flows are fully specified, and a third is planned. Per Aaron, both A and B are valid; they converge on the same Define → Results → Compare pipeline.

**Flow A — "New Search" (the fully built-out flow in the design):**
Home → "New Search" → pick one of the 4 modality cards → upload a file (popup drag-and-drop or file selector) → Define → Results → Compare.

**Flow B — "Search from an existing file" (shown in the beta video):**
Search → Files (browse/filter the existing library, see §5.2) → select a file → File Details drawer → **"Search from this file"** → Define (pick the active part/sub-assembly within that file's tree, see §5.3) → Run Search → Results → Compare.

**Flow C — Parts Catalogue (conceptual v1, §5.6):**
Search → Parts Catalogue (nav item or New Search card) → browse categories or search by spec → narrow with filters → results table → compare 2+ parts → a decision action such as **Use This Part** (or **Search On** to open a new 3D geometric search for that part in a new tab). Modeled on the McMaster-Carr catalogue; no file upload needed.

Recommendation: ship A and B now. Flow A is the faster path when the user has a new file in hand (e.g., a part just received from a supplier); Flow B is the faster path when searching from something already in the library (the common case for "find duplicates," "find similar to this part we already track," etc.). The Define screen should be shared infrastructure for both.

---

## 5. Screen-by-screen specification

### 5.1 Home / Launchpad

Hero search bar: placeholder *"Describe a part, paste a spec, or search saved work…"* (⌘K shortcut).

Three quick-action cards:
- **Start a Search** — "Upload CAD files and match parts to your tolerance windows." Footer: accepted formats "STEP · SLDPRT · IGES · PRT" *(note: this list differs from the CATIA-centric formats used elsewhere — see §8)*.
- **Run a Workflow** — "Produce an analytic output — BOM, warranty report, or replacement list." Footer: workflow count.
- **Saved Searches** — shows pinned searches, or an empty-state prompt to pin one.

Below the cards: a "Recent (this session)" strip of up to a handful of recent searches, each showing requirement/datum count, result count, and a pass/warn/fail status pill, with a link to the fuller recent-searches surface (destination naming is inconsistent between source files — standardize on **My Projects** as the home for this, since that's where the richer per-project history lives per §2.1).

### 5.2 Files (browse/filter the CAD library)

Confirmed live in the video. Layout:

- **Top bar:** search box, placeholder `"Search file name — e.g. 7100490* or *RSB40*"` (case-insensitive, supports `*` wildcard), **Upload file** button, result count ("{N} files"), list/grid view toggle.
- **Left filter sidebar**, grouped by category, each group collapsible:
  - **PLM** group: numeric range filters (e.g. Ball Count, Ball Dia Mm, Bore Mm — domain-specific dimensional attributes, each a dual-handle slider + min/max numeric inputs), and categorical filters (Business Unit, Component Type, etc.) as checkbox lists with live per-option counts.
  - The design files additionally specify a richer PLM-oriented filter set intended for automotive/Adient-style programs: **Program, Model Year, Program Type, Customer Group, Region, Product Group, Product Line, Calc Weight, Release Status, Lifecycle State, Released Date.** Control types: checkbox list (with a text filter once ≥6 options), dual-handle range slider for numeric fields, and radio-button date presets (Last 7 days / Last 30 days / Last year / Custom range).
  - *(Known gap, confirmed in the design file's own code comment: the "Released Date" filter is explicitly non-functional placeholder logic in the current design mock — selecting a preset does not filter results. Flag for engineering: a real date-range control needs to be built, not copied from the mock as-is.)*
- **Results table**, default columns: file preview thumbnail, File Name, Modified, Last Synced. Additional columns appear **only when their corresponding filter is actively applied**, capped at **3 additional columns** (7 total including the 4 defaults) — overflow filters remain visible in the file detail panel instead of as a column. Columns tab (sidebar) lets the user show/hide eligible columns and does not exceed the cap.
- **Row density**: Compact / Default / Comfy, plus a separate **Gallery** (thumbnail-grid) view mode as an alternative to the table.
- **Sort**: by Date modified (default), File name, Released date, or Calc weight; ascending/descending toggle.
- Clicking a row opens a **File Details** side panel: large thumbnail, file type + size badge, File section (Size, Source, Created by, Created, Updated), and the full PLM metadata set (all fields always shown here regardless of which are active as filters/columns). Primary action: **"Search from this file"** with helper text *"Builds a new [requirement] search using this file as the reference."* This is the bridge into Flow B (§4).
- Empty states: *"No files match the current filters and search."* (table/gallery); *"No filters match "{query}"."* (filter search).

### 5.3 Define (search setup)

Confirmed live in the video, reached via "Search from this file." Left panel shows:

- **ACTIVE PART** header naming whichever node is currently targeted.
- Three tabs:
  - **Assembly** — a full parts tree for the loaded file/assembly; selecting a node sets it as the active part (this is how modality is implicitly chosen in Flow B — see §4).
  - **PLM** — read-only metadata for the active part (Name, Site, Notes, CRM ID, Region, Bbox mm, Item ID, Program, Customer, End Date, Facility, Material, Pack Qty, Platform, Revision, Supplier, Weight, and more — a long flat key/value list).
  - **Measurements** — lets the user capture up to **5** geometric measurements on the active part as explicit search criteria: select a face/edge (or hold Shift to select a whole body) in the 3D viewer, then choose a measurement type from the measurement-type dropdown per selected geometry. There are more measurement types than the video shows; the exact list does not matter for the prototype. Use the video's flow (and the dimensions in the other UI examples, e.g. area, perimeter, height, diameter, length) as the examples of types, and make the type list data-driven. Because the prototype has no real CAD viewer, "select geometry in the viewer" is simulated (e.g., pick from a list or click a placeholder). Each captured measurement becomes both a search constraint and — critically — **a results-table column** (see §5.4).
- **3D viewer** (right side; a placeholder viewport in the prototype — there is no real CAD viewer, so its controls are visual-only): Shaded / X-Ray / Wireframe / Hidden Line view modes, zoom %, pan/orbit, opacity slider, annotate/measure tool, home/reset view, visibility toggle, snapshot. A view cube in the top-right corner and an axis gizmo in the bottom-left are always present (both confirmed in the video and in the Compare screen design file).
- Primary CTA, top right: **Run Search**.

### 5.4 Results

Confirmed live in the video; breadcrumb `Search / Files / Define / Results`.

- Header: **"Found {N} matching file(s)"** / "Showing all results", with **Save Search** and **+ New Search** actions.
- Left sidebar, two tabs:
  - **Filters** — **Match Quality** group (Geometric Similarity % range slider, Match Level), **File Metadata** group (Source, File Name, Created, Last Edited), and the same **PLM** group used in Files.
  - **Columns** — lets the user manage which columns show.
- **Table columns**: File Name, Source, Created, Last Edited, **Geometric Similarity** (progress bar + percentage + a quality label), then **one column per captured measurement** (e.g. "Area (mm²)"), then Actions (a compare/swap icon).
  - The query/reference file itself is pinned as the first row, labeled **"Source Part"** at 0% (it is not itself a "match," it's the thing being matched against).
  - Design-file mockups (a separate, richer dataset) show the same column plus per-dimension measurement columns like "Piston Head Area (mm²)," "Piston Height," "Pinhole Diameter," "Rod Length" — i.e., the measurement-column mechanism generalizes to any number of captured dimensions, each with its own tolerance-aware mini visualization (colored bar + ± tolerance).
- **Match quality has three independent dimensions** (clarified by Aaron). They are not competing schemes; a match can carry all three, and the UI must keep them distinct and never blend them into one number:
  1. **Confidence — how sure the system is** that this result is genuinely what the user is looking for (and the reasoning behind it). Needs a "why" affordance (the pattern from `work_v3`, §7). Example treatments: a numeric badge or word badge (e.g., High / Moderate / Low).
  2. **Similarity — how good a match / how similar the part is.** The geometric search similarity score, shown as a % (progress bar + percentage). The design mock bands it as High / Medium / Low (e.g., ≥85 / ≥70 / <70); the cutoffs are examples only and should be configurable. **"Exact" is not a status** (Aaron, Oct 8): the mock and the Adient screenshot label a 100% row "Exact Match", and that label is dropped. At the top of the scale a match is instead typed as a **geometric duplicate** (a different file with 100% the same geometry) or a **duplicate file** (the same file). Where those two labels surface in the row (beside the bar or in the data type chip) is not yet designed.
  3. **Data type / provenance — what kind of data this is.** Examples: **Actual, Estimate, Surrogate**, and the other values used earlier (No match, Search failed). The list is illustrative, not fixed. Shown as a label/chip, separate from the % bar.
  - Per the project's `confidence-provenance-design-principle.md`: build **one shared confidence/provenance component** and reuse it on every screen (Results rows, Compare, workflows) rather than styling it per screen — several inconsistent treatments of "how sure are we" already exist in earlier prototypes.
  - Any of the three can appear without the others — e.g. "No match" or "Search failed" has no meaningful similarity %.
  - Filters support all three: Similarity % range, Confidence level, Data type.
  - **"Review required" is not a search-result quality label.** It is an action-related status in a project workflow: when the system creates a document/output and a source's quality/provenance is an estimate or another unsure status, the user must review and approve the system's decision. The beta video's red "Review required" next to 73% is this workflow status showing up in the results list. Treat it as a workflow-approval status (see Workflow-context actions below), driven by data type and confidence, not as a fourth quality dimension.
- **Row expansion**: clicking a row expands inline tabs. Two different tab sets were found depending on result granularity:
  - Part-level or part-in-assembly result (confirmed live, video): **File Info**, **PLM Data**, **Measurements**.
  - Whole-file/assembly-level result (confirmed live, Adient screenshot): **PLM Data**, **File Info**, **Search Requirements**, **Duplicates**, **Related Revisions**.
  - The design-file prototype adds further conditional tabs depending on modality: **Contained Parts (N)** (assembly-structure modality), **Assemblies (N)** / **In Assembly** (part-used-in-assembly modality), **Sibling Parts** (part-pulled-from-assembly modality). Recommendation: implement the tab set as modality- and result-type-conditional, per the design file's logic, since it's the most complete model found and is additive to (not contradictory with) the two confirmed-live tab sets above.
  - The **Measurements** tab on a result row shows a Measurement / Source / Candidate / Deviation table. Confirmed live behavior: when the matching engine cannot automatically derive the candidate's value for a captured measurement, the Candidate cell reads **"Manual measurement required"** (red text) and Deviation shows as "–". This is an important real-world state engineering must support — not every candidate will have every requested measurement auto-computed.
- **Per-row actions** (decided by Aaron):
  - **Compare** — opens the side-by-side Compare screen (§5.5).
  - **PLM link** — link out to the item in PLM. Not live for now: render it, disabled, with a "coming soon" style tooltip.
  - **Search on** — starts a new search for the part (or assembly) the action is on. The scenario: while doing a workflow (a search or otherwise) the user sees another part/assembly and wants to know what is similar to it. Clicking Search on **opens a new search in a new tab** (Define, with that part as the active part), so the workflow they were in is not disturbed. This same action is available wherever a part/assembly appears (results rows, catalogue rows and compare, workflow screens).
  - **Workflow-context decision actions** — when a part is reached from inside a workflow, a decision action can appear that lets the user choose this part over that part. Examples: **"Select as surrogate"**, "Select as replacement part", "Add to assembly". The label (not final) and what the action actually does with the part depend on where the user came from, so both must be configured per workflow context, not hardcoded. The catalogue's "Use This Part" is the generic placeholder for this kind of button (§5.6). In a workflow, a row whose source is an estimate or other unsure type shows a **"Review required"** status until the user reviews and approves the system's decision. **Approving** flips the status (to something like **"Confirmed"**) and writes an **audit trail entry recording the time and who approved**; the row then shows who confirmed it and when.
  - Preview and an overflow "More" menu sketched in the design mock are not part of the spec.
- **"Found It"** (a button in the Adient-tenant screenshot's top chrome) is **removed**; it was specific to a pilot and is not part of this product.

### 5.5 Compare (Model Comparison)

Confirmed live in the video (reached from a Results row); breadcrumb `Search / Files / Define / Results / Compare`. The design file (`CAD Compare.dc.html`) specifies a richer version than what the video shows being used, described below as the target.

- **Left sidebar tabs**: **Assembly**, **PLM**, **Measurements** — each mirrored for the Search (reference) part and the Result (candidate) part side by side.
  - **Assembly** tab: two stacked trees (Search / Result), each highlighting the specific part instance being compared within its parent assembly context.
  - **PLM** tab: side-by-side field comparison (Material, Part no., Revision, Lifecycle state, and the fuller PLM field set from §5.3); matching values are highlighted in a "positive confirmation" color so a reviewer can scan for mismatches at a glance.
  - **Measurements** tab: every measurement captured back in Define, shown as Search-value vs. Result-value, with the "Manual measurement required" fallback described in §5.4 when the candidate's value can't be auto-derived.
- **Center viewer**, three states:
  - **Comparison** — two independent, camera-linked 3D viewports side by side ("Linked view" — rotating one mirrors the other). Confirmed live.
  - **Alignment** — same split-viewport layout, plus a right-hand "Alignment & Overlay" panel: the user picks a face on the Search part and a corresponding face on the Result part, the system infers a constraint type (**Coplanar, Coaxial, Concentric, Parallel planes** — confirmed exact set from the design file), and a running **"N degree(s) of freedom remaining"** counter (starting from a rigid body's 6 DOF) shows how fully constrained the alignment is. **"Align and compute overlap"** proceeds to the third state.
  - **Overlay** (reached only via "Align and compute overlap," not a directly-selectable tab) — a single blended viewport with a color legend: **Query only (red)**, **Overlap (blue)**, **Result only (green)** — plus a stats panel: overlap/query-only/result-only volumes, a Δ Bounding Box breakdown per axis (X/Y/Z, signed deltas), and summary stats ("Volume match %", "Max deviation", "Aligned by N constraints"). The design file's inline copy states an explicit design principle worth preserving: *color-coded regions are always paired with a labeled numeric readout, never a color-only indicator* (accessibility requirement — don't rely on color alone).
- **Viewer toolbar**: Compare offers the same view modes as the beta video's viewer — **Shaded / X-Ray / Wireframe / Hidden Line** (decided by Aaron; the design mock's three-mode list is superseded) — plus zoom, measure tools (Selection, Bounding Box, Clear), home/reset view, fit-to-view, snapshot.
- Each viewport carries a label chip identifying the file ("Query · {filename}" / "Result · {filename}"), a view cube, and an axis gizmo.

### 5.6 Part Catalogue (search entry, conceptual v1)

Source: `Part Catalogue.zip` (`Bolt Finder Prototype.dc.html`, interactive; `Parts Catalogue.dc.html`, a static design-exploration canvas of 11 labelled options). Aaron: this is a **conceptual first version, not final**, and its core UI is modeled on the McMaster-Carr parts catalogue (browse by category, then narrow by specs, no CAD upload needed). It is a search entry option alongside the four modalities (§3, §4 Flow C), listed in the left-nav Search section and as a card on the New Search screen. Use the Bolt Finder as the behavioral reference (it is interactive) and `Parts Catalogue.dc.html` for layout rationale and alternatives.

**Purpose:** "Browse what the company already has by category and spec. No CAD upload needed." A user who knows what kind of part they need (e.g., an M16 stainless hex bolt) finds, compares, and chooses an existing company part without uploading geometry.

**Flow (6 steps, from the catalogue file):** Catalogue landing → category (Fasteners) → type (Bolts) → narrow by spec (thread size, head type, material, length, grade) → results table → select 2+ and compare → a decision action (shown in the file as **Use This Part**).

**Screens and views**
- **Catalogue landing:** title "Parts Catalogue"; a search box with placeholder *"Part number, description, or spec — e.g. M16 hex stainless"* (⌘K hint, **Search** button) plus "Recent" example chips (e.g., `M16 hex stainless`, `M10 socket 10.9`, `M8 flange 30`); a "Categories" grid of 8 tiles, each with name, one-line description and a mono footer of "{N} parts · {M} types": Fasteners, Bearings, Seals & Gaskets, Housings, Electrical, Fittings & Connectors, Springs, Tooling & Fixtures. Counts are example data.
- **Category / type drill-down:** Fasteners → Bolts, Nuts, Washers, Screws, Rivets, Pins; Bolts → head-type tiles (Hex, Socket Head, Flange, Countersunk; the static file also has Carriage and Shoulder). Tile counts respond to active filters. Only Fasteners/Bolts need real data in the prototype; other tiles can show a toast ("opens the same browse flow").
- **Results table** (appears as soon as any filter is active; clearing all filters returns to tiles): header "{title} · {n} results · sorted by {column}", active-filter pills with remove (×), a "Filter part numbers" text box, **Compare** (two forms, see below; hint "Select 2 rows to compare" / "1 selected — pick 1 more"), **Export CSV**, **Save View**. Columns: checkbox, Part Number, Thread, Length (numeric, right-aligned), Head Type, Material, Standard, Source, Reuse Status (colored pill). Sortable headers; pagination "Showing 1–10 of 14 · 10 per page"; empty state "No bolts match these filters" / "Remove a filter or widen the length range to see more parts." / **Clear All Filters**.
- **Part detail drawer** (opens on row click): part number + "Hex bolt · M16 × 120 mm", thumbnail, **Open in Viewer**, **Open in PLM** (PLM not live, §5.4), a **Specification** section (thread, length, head type, drive, material, tensile strength, coating, shank, standard), a **PLM Data** section (PLM ID, revision, status, reuse status, owner, lead time), optional **Used On** list (e.g., "T3 Heat Exchanger — 14 uses"), and footer actions **Add to Compare / Remove from Compare** and the primary decision action (**Use This Part** in the file; label not final, see below).
- **Compare (catalogue parts)** — two forms (decided by Aaron):
  1. **A-to-B CAD comparison:** exactly two parts open in the **dual-pane CAD viewer** (the Compare screen in §5.5). This is how CAD comparison works today: always one part against one part.
  2. **Multi-part attribute comparison:** two or more parts compared against each other in a **table**, on text/numerical attributes only (no geometry). Layout is the aligned table: Field | Part A | Part B | dashed "+ Add part" column, with a "=" (match, green) or "Δ" (differs) marker per row, an "All Fields / Differences Only" toggle, a summary count of differing fields, and the decision action and Open in PLM per part. (The static file's "scales to 3–4 parts" note is guidance, not a hard cap.)
  - Show the decision action and **Search On** on each part in both forms.

**Navigation:** breadcrumbs `Search › Catalogue › Fasteners › Bolts › M16 › Compare`, with a Back control; Back restores the previous filter state. Tree and tiles stay in sync (same principle as the CAD tree ↔ canvas link).

**Layout decision (Aaron):** users find parts by **both the category tree and the filters, and the filters narrow the tree options.** The left rail has the category tree (pinned above) and the shared Filter Sidebar (Filters / Columns / Manage tabs, header "{n} active · {x} of {y}", "Clear all", collapsible sections with per-section Clear, "Collapse"). When filters are active, the tree responds: node counts update, and nodes with no matching parts are dimmed (or hidden) so only reachable branches remain. Selecting a tree node scopes the filters and results; breadcrumbs mirror the tree path. Principle from the file: every screen is Left / Center / Right, and the right panel is "empty, never gone" until a part is selected.

**Spec narrowing**
- Facets and control types: Thread Size (chips, mono), Length (range buckets as chips, or a range slider), Head Type (chips), Grade, Material (checkbox list with counts, searchable when 6+ options), Standard Compliance (multi-tag), Reuse Status, Source (CAD Library, Teamcenter, SharePoint; collapsed by default), Program Usage. Follow the filter-control rules by data type from the design system README: text → text search; 5 or fewer fixed options → multi-tag; 6 or more → multi-search; ordered categories → segmented control.
- Semantics: multi-select within a facet is OR; facets combine with AND. **Faceted counts:** each option's count is computed with all *other* facets applied; an option with 0 results is disabled (dimmed, not selectable) unless already active. Compatibility rules (e.g., flange bolts have no M20/M24) emerge from the data rather than being hardcoded.
- Quick-select: common values are surfaced as chips; each category node declares 0 to 3 "quick-select" axes (a per-category config), and categories with none render nothing.
- Active filters appear as removable pills above the table; Clear is three-tier (per-section, per-group, global "Clear all").
- Free-text search parses a spec query into facets (e.g., "M16 hex stainless" → Thread M16 + Head Hex + both stainless grades; a bare number → the length bucket containing it; unparsed text → substring match on part number, standard, or material).
- A **requirement target marker** on the Length slider (e.g., "requirement target 12.0 cm") shows the catalogue can be seeded from a project requirement. Treat as a hook for the workflow integration, not required for v1.

**Reuse Status** is a company-policy attribute of a catalogue part (distinct from the three match-quality dimensions in §5.4, which describe a search *result*). Interactive file values: **Preferred** (pass/green), **Approved** (info/blue), **Restricted** (warn/amber); the static file instead uses Approved / Review / Obsolete. Treat the value set as configurable example data, shown as a colored pill column, a facet, and a detail/compare field.

**Link to the rest of the product**
- **Use This Part** is a placeholder for the decision-action button that appears when a user is in a workflow and must choose this part over that part (select as surrogate, as a replacement part, add to an assembly, etc.). The label is not final. What it does depends on where the user came from: the workflow context supplies the label and the effect (§5.4). In the prototype it only shows a message ("{pn} added to Seat Track Bracket · Rev C"); do not hardcode that destination. With no workflow context (plain catalogue browsing) the button is not shown.
- **Search On** (parts in the table, detail drawer, and compare) opens a new 3D search for that part in a **new tab**, the same as Results "Search on" (§5.4).
- **Open in PLM** is not live; render disabled (§5.4). **Open in Viewer** opens the part in the CAD viewer (a placeholder in the prototype).
- **Save View** saves the filter state to My Projects; **Export CSV** exports the visible rows. Both are toasts only in the prototype.

---

## 6. Data model notes

Three different PLM field schemas were found across the sources, at different levels of completeness:

1. **Full schema, confirmed from a real Adient-tenant screenshot** (richest, treat as canonical where it's available): ID, Revision, Object Name, Object Type, Program Short Name, Release Status, Lead Program, OEM Name, OEM Model Year, OEM Model Code, OEM Vehicle Name, OEM Platform Name, OEM Environment, Program Lifecycle State, Program Category, Program Life Years, Customer Group, Customer Group Region, Direct Customer Launch Sites (+ Regions), Direct Customer Name, Company Make Buy, 3D Design Required, Design Responsible, Adient Production Facility, Product Area, Product Line.
2. **Flat/demo schema used in the `part_vs_assembly` design mock**: Object ID, Revision, Object Name, Object Type, Program, Release Status, OEM Name, Platform, Production Facility, Source, Created, Edited, Material, Mass, Category, Lineage ID — a reduced set, with several of schema-1's concepts (model year, region, vehicle name) folded into a single free-text composite string inside Object Name rather than broken into discrete fields.
3. **Generic/non-automotive schema used in `file_selection` and the Files/Define screens in the video**: Program, Model Year, Program Type, Customer Group, Region, Product Group, Product Line, Calc Weight, Release Status, Lifecycle State, Released Date — plus, in the video's own Define/PLM tab, a still-different flat set (Name, Site, Notes, CRM ID, Region, Bbox mm, Item ID, Program, Customer, End Date, Facility, Material, Pack Qty, Platform, Revision, Supplier, Weight).

**Decision (Aaron): the PLM field schema is configurable.** None of the three schemas above is final. Long term, an agent will take various input sources and transform them into usable data, so what fields exist — and what they're called — will differ by tenant and source. Every screen in §5 that displays or filters on PLM metadata (Files filters, File Details, Define PLM tab, Results filters/columns/row tabs, Compare PLM tab) must be built against a schema-driven field renderer (field key, label, type, control, grouping supplied as config), not per-screen hardcoded field lists. This also resolves the naming drift found in the mocks (e.g. "Release Status" vs. "Lifecycle State").

**Data for now is fake.** The front end is built against the example dataset already prepared for Claude Code; the schema-config layer should let that dataset's fields drive the UI without code changes.

Also note: "Release Status" values observed in one design mock are opaque internal IDs (e.g. `id1055`) rather than human-readable labels. The schema config should allow a value-label lookup so raw IDs can be shown as readable labels.

---

## 7. Relationship to prior prototype generations (historical context only)

Two earlier, more fully-realized prototype rounds already exist in the project and predate this upload:

- **`work_v3/req_v6`** (Block Diagram View, DFMEA Hi-Fi Screens, Requirements Workflow Wireframes): uses a five-tier certainty vocabulary (Actual / Surrogate / Estimated / No match / Search failed) and keeps **spatial score and feature score separate**, with a dedicated "why two scores" explainer panel. Candidate assemblies are evaluated against an explicit confidence threshold (e.g., "best 94% spatial," "below the 60% threshold").
- **v2 "Compare Parts" screen** (in the handoff prototype already sent to Aaron): a single blended-similarity-score model, side-by-side viewports (largely placeholder geometry), Measure/Home/Fit/Snapshot toolbar, Parts/PLM/Measurements sidebar tabs.

Per Aaron's standing instruction, **both are superseded wherever they conflict with the new material in this PRD.** They're listed here only so engineering understands why the vocabulary changed, and because the "why two scores" UX pattern from `work_v3/req_v6` may still be worth preserving as a *design pattern* (explaining to the user why a number looks the way it does) even though the specific two-score model it was built for didn't carry forward.

---

## 8. Known gaps and inconsistencies in the supplied design files (do not implement as-is)

A close read of the actual `.jsx`/`.dc.html` source (not just the screenshots) turned up a substantial amount of placeholder logic, dead code, and internal contradictions that must **not** be carried into the real build. Engineering should treat the following as flagged, not specified:

- **Released Date filter is non-functional** in the `file_selection` mock (explicit code comment confirms selecting a preset doesn't filter anything); a real date-range implementation is needed from scratch.
- **Column management panel doesn't match the real table** in the `part_vs_assembly` mock — the "Columns" sidebar lists toggleable columns ("Object ID," "Revision") that don't correspond to any actual rendered column, while the single most important column (the modality-driven context column) isn't manageable there at all.
- **Child/contained-part match percentages are synthetically derived from the parent's overall score**, not independently computed, in the `part_vs_assembly` mock (explicit comment: "For a 100% exact assembly match, every child should read ≥85%"). Do not treat this as the intended scoring algorithm — it's sample-data fixture logic.
- **A visible numeric contradiction** in the same mock: an assembly's header badge shows its real BOM size (e.g. "Assembly · 246") while its "Contained Parts" tab caption reports against a fixed, unrelated subset (e.g. "9 of 12 parts matched") — these two numbers must be reconciled against the same source before this ships.
- **Mode-B's "Result scope" control (Parts / Assemblies / Both) is cosmetic** in the mock — changing it updates a label but never changes the actual rows shown.
- **Inconsistent action copy** for what's clearly meant to be the same two actions across different result-detail tabs: "Search on this assembly" vs. "Run search on this revision"; "Compare in 3D viewer" vs. "Open in 3D Compare viewer." Pick one phrase for each action.
- **The Alignment tab's constraint-type inference is a placeholder**, not a real geometric rule — e.g. pairing a planar face with a cylindrical face falls through to "Parallel planes," which isn't geometrically meaningful. A real constraint-inference (or user-selected constraint type) needs to be designed.
- **The "Align and compute overlap" button is never actually gated** by whether the model is fully constrained in the mock, despite the DOF counter existing specifically to signal that — confirm whether under/over-constrained alignment should be blocked or just warned against.
- **The Overlay screen's "Aligned by N constraints" stat is a hardcoded literal**, not derived from the actual constraint list, in the mock.
- **The New Search screen's modality cards have no wired destination** in the design mock (`pickMode` is a no-op) — the upload step and its connection into Define is implied by copy ("Upload a part →") but not specified in the supplied files. Dev needs the upload step designed (see §9).
- **Parts Catalogue design-file inconsistencies (do not copy):** the "9 of 13 fields match" pill contradicts its own data (6 match, 7 differ); the footnote "Head type is a preference call — not flagged" contradicts the Δ on Head type; length filter in "cm" vs. table in "mm"; "10 per page" shows 9 rows on a 14-result page; M16 count (118) doesn't reconcile with facet counts; the Source badge "1" has no visible selected value; breadcrumb drops "Fasteners" in the compare screen; Columns and Manage sidebar tabs and the Collapse button are non-functional in both files. In the interactive Bolt Finder: selected rows persist (and still arm Compare) after filters hide them; Back doesn't restore selection or sort; "N of 15 fields differ" is inflated because Source/PLM ID/Revision/Status almost always differ (consider excluding administrative fields from the diff count); the compare view has no guard for fewer than 2 parts.
- **Format lists disagree**: Home screen footer says STEP/SLDPRT/IGES/PRT; the New Search upload prompts say CATPart/CATProduct/STEP/SolidWorks. Per Aaron the lists are examples only for this prototype; use one consistent example list across screens.
- **Accepted-format and tenant mismatches**: the richer two-row app chrome and Adient-tenant "Recent Searches" dataset exist only in one of the three homepage design files (`Canvas.dc.html`); the plainer single-row chrome (`Home.html`) and the early sketch exploration (`Wireframes.html`) disagree with it and with each other on nav structure and card copy. Treat `Canvas.dc.html`'s chrome as the most current, per its consistency with the Adient screenshots elsewhere.

---

## 9. Open questions for Aaron

Resolved by Aaron on Oct 8 and folded into the spec above: left-nav IA (§2.1), feedback copy and Jira behavior (§2.3), four-card picker as the fully built flow plus both entry flows valid (§3–4), "Found It" removed (§5.4), Hidden Line in Compare (§5.5), configurable PLM schema (§6), fake example data (§6), row actions (§5.4), the two-dimension match quality model (§5.4).

Also resolved on Oct 8 (second round): "Review required" is a workflow approval status, not a quality label; match quality is three dimensions (confidence, similarity, data type) with example values and cutoffs only; measurement types are examples drawn from the video/UI; file-type lists are examples; upload is a popup drag-and-drop/selector; Part Catalogue is a search entry in both the nav and the card screen.

Third round (Oct 8): approving a "Review required" row flips its status (e.g., to "Confirmed") and records an audit trail (time, who) — in §5.4. Parts Catalogue first version received and specified in §5.6.

Fourth round (Oct 8): Search on opens a new search in a new tab for the part the action is on; Use This Part is a generic, context-driven decision action; catalogue compare is A-to-B in the dual-pane CAD viewer plus multi-part text/numeric attribute tables; top-level nav is "Create"; catalogue uses tree plus filters with filters narrowing the tree. All in §5.4 and §5.6.

Still open:

Resolved (Oct 8): **Reuse Status values are fully configurable.** Statuses differ by company and data source; the system renders whatever values it receives (an agent will likely map source data into them). Preferred / Approved / Restricted and Approved / Review / Obsolete are example sets only. Status colors/tones are configurable too.

Nothing else is open for the search PRD.

---

## 10. Explicitly out of scope for this PRD

- The geometric-matching engine itself (proprietary, company-secret — not a UI concern).
- BOM Creation, Warranty Analysis, and Part Replacement workflows — separate tracks, referenced here only as nav entries. (Locked/upsell-gated workflows and their upsell modal were removed from this PRD for now.)
- The broader non-linear "shared exploration canvas" / requirements-workflow prototype — this PRD's search flow is one of its entry points (per the architecture doc's diagram) but is specified here as a conventional, mostly-linear pipeline (Files → Define → Results → Compare) since that's what both the video and the design files actually show being built. Reconciling it with the non-linear canvas concept is a separate integration task.

---

## Appendix: source material reviewed

- `part_vs_assembly/` — `data.jsx`, `ui.jsx`, `screens.jsx`, `table.jsx`, `design-canvas.jsx`, `Search Modality Results.html`, `Search Results - Columns View.html`, plus 3 reference screenshots and 1 thumbnail.
- `cad_compare/` — `CAD Compare.dc.html`, `support.js`, plus 2 reference screenshots and 1 thumbnail.
- `file_selection/` — `fs-app.jsx`, `fs-filtersidebar.jsx`, `fs-table.jsx`, `fs-gallery.jsx`, `fs-detailspanel.jsx`, `fs-data.jsx`, `fs-primitives.jsx`, `design-canvas.jsx`, plus 2 reference screenshots (one a hand-drawn layout sketch) and 1 thumbnail.
- `homepage_search/` — `Canvas.dc.html`, `Wireframes.html`, `Home.html`, `support.js`, plus 3 reference screenshots and 1 thumbnail.
- `Part Catalogue.zip` (received Oct 8) — `Bolt Finder Prototype.dc.html` (interactive), `Parts Catalogue.dc.html` (static exploration canvas), design-system README; conceptual v1, modeled on McMaster-Carr.
- `Screen_Recording_2026-10-07_at_2.41.04PM.mov` — full 30-second recording, reviewed at 1 frame/second (30 frames) covering: Files browse → file select → File Details → Search from this file → Define (Assembly/PLM/Measurements, capture an Area measurement) → Run Search → Results (filters, row expansion, PLM Data tab, Measurements tab showing "Manual measurement required") → Compare (Assembly/PLM/Measurements tabs, synced highlighted geometry).
- Prior project material referenced for continuity: `work_v3/req_v6` prototype screens, the v2 "Compare Parts" screen in `RFQ to Test Plan v2.dc.html`, `adient-tdm-sor-summary.md`, `plm-data-source-research.md`.
