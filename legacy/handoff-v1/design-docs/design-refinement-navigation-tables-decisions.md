# Design refinement — navigation, tables, and decision actions

Three cross-cutting themes, synthesized from notes on the prototype as a whole rather than one screen. Unlike the prior briefs, these touch the app's shell and shared components — navigation, the table system, and how decisions get made and shown — so the recommendations below apply everywhere those things appear, not to a single flow step.

## 0. A dependency underneath all three: which shell

`rfq-to-adv-pnr-integration-guide.md` already flagged an unresolved choice between two shells: `datum-ui-v1-design-system` (the BOM side) and `ui-design-current` (the requirements side), which already has "a persistent global-nav + breadcrumb-strip shell with collapsible sidebars and a real Lower drawer component." That description is, concretely, most of what Theme 1 and Theme 2 below are asking for — a top nav, a breadcrumb strip, collapsible left sidebars, a drawer component for chronological content. Worth resolving the shell question in favor of `ui-design-current` specifically because of this overlap, rather than treating shell choice and this refinement as two separate decisions — building the recommendations below on top of the shell that already has most of the chrome is a lot less work than building it twice and reconciling after.

## 1. Entry point & orientation

There's no single canonical entry point, and forcing one would misrepresent how the system actually gets used — a person works across multiple projects at multiple stages, and is sometimes creating requirements and sometimes receiving them. The system needs to stay agnostic to all of that rather than assume one funnel.

**Recommendation: land on a dashboard, not a workflow step — at two scopes.**

- **Project overview** — what documents/outputs need creating, what actions need taking and who's responsible, what data is associated and where it came from.
- **Output overview** — one deliverable's own status (e.g., one BOM): what's been uploaded, what's missing, what actions are still open on it.

This isn't a new idea being introduced here — it's the "manager rollup" concept already explored in `program-focused-requirements-lofi-brief.md` (concept 3: status, dependencies, deadlines, shared/carryover across all active programs on one screen) and the Program Manager story already drafted in `user-stories-v1.md` ("a single top-down view of status, risk, and deadlines across every part in my program, so I can see where things stand... without chasing individual engineers"). The refinement here is narrow: promote that rollup from a role-specific screen to the default landing surface for everyone, since it answers "where do I start" at least as well for an engineer with several irons in the fire as it does for a PM.

**On the nav-sidebar-vs-cascading-menu question:** recommend against adding a second persistent left sidebar for site-wide hierarchy navigation, stacked alongside the left Filters/Columns/Manage sidebar that Theme 2 below establishes as the signature pattern on every table screen. Two different left sidebars compete for the same horizontal space this note already worried about, and risk making it unclear which one does what. Instead, keep the existing top global nav plus breadcrumb strip (already built in `ui-design-current`) as the lightweight "where am I" signal, and let the two dashboards above be the "how do I get anywhere" mechanism — orientation comes from landing somewhere useful and backtracking via breadcrumbs, not from a standing tree of the whole site. This is a recommendation to validate, not a locked call — it doesn't fully answer the "cascading hover menus are annoying" concern for genuinely deep navigation, which is still open below.

**Open questions:**
- Does the top nav need any expansion (a mega-menu off `My Projects`, for instance) to reach deep destinations without either a second sidebar or multilevel hover menus?
- Does creating vs. receiving requirements need to change which dashboard a user lands on by default, or is that purely a filter/tab within one shared dashboard?

## 2. Table + detail-view system

**Formalize one shared table shell**, reused identically by the BOM table, the surrogate-search results table, and the requirements table: a left sidebar with Filters (narrow by any available metadata, PLM data, or geometric data), Columns (add/rearrange/hide, with columns drawn from the same field set Filters draws from), and Manage (saved views, density, display options). This consolidates what's currently three separately-specced versions of nearly the same thing (`bom-detail-view-lowfi-brief.md`'s filter sidebar, `requirements-tracing-design-ideas.md`'s filter sidebar, `Block Diagram View`'s Structure/Filters/Manage tabs) into one canonical component, rather than three parallel implementations that'll drift.

One specific mechanic worth locking in as spec rather than leaving to be reinvented per screen: **adding a column via Manage automatically adds the corresponding filter to the Filters tab**, even if that column stays hidden. Open question this raises: does removing a column also remove its filter, or should a user be able to keep filtering on a field they've chosen not to display?

**Subfoldering** is a real structural difference, not an oversight to unify away: the BOM table organizes into subfolders, the surrogate-search results table is flat (it's a ranked list, not a hierarchy), and the requirements table's structure wasn't stated — flag this as an open question rather than assuming either way. If requirements ever need subfoldering, the real Adient categorization taxonomy already named in `program-focused-requirements-lofi-brief.md` (Department / Source / Requirement type / Classification / Implicated Product tree) is the candidate grouping structure, not a new one invented for this.

**Converge the two detail-view patterns into one.** Recommend the right-hand side panel as the canonical pattern — it's already the dominant one actually built (the BOM row panel, Compare Parts, Carryover review, and the Requirement trace panel all use it) — and reserve the row drawer specifically for chronological, scrubbable content, which is a different kind of thing to show than a tabbed summary. This isn't a new distinction: `requirements-tracing-design-ideas.md` already resolved exactly this for one screen (a compact panel section plus a separate Lower drawer for the full carryover chain). The refinement is to generalize that already-resolved split to all three tables, rather than let each screen re-decide panel-vs-drawer on its own.

**Standardize the four info categories — file/PLM data, summary info, cost data, similarity data — as the tab set for the BOM and surrogate-search detail views.** Requirements needs its own explicit reconciliation rather than a silent force-fit: its panel has already been specced with a different category set (requirement text, Driven-by, provenance chain, associated test, actions — per `requirements-tracing-design-ideas.md`), and a requirement doesn't have "cost data" the way a part does. Recommend Requirements keeps its own specced category set rather than being bent to match the other two, and that this get stated explicitly so nobody tries to force four generic tabs onto a screen that already has a better answer.

**Similarity data's three sub-types need one vocabulary check.** Geometric similarity and surrogacy similarity map directly onto the already-established geometric-duplicate-vs-best-surrogate distinction (`bom-flow-notes-v1.md`, `bom-detail-view-lowfi-brief.md`). "Duplicates/revisions" similarity looks like a third, genuinely different axis — document or version lineage (this part is a newer revision of that one) rather than manufacture-sameness — not a third tier of the same scale. Worth confirming that reading rather than assuming it's simply "a third strength level" alongside the other two.

## 3. Decision-making & action consistency

**Formalize one "confirmed action" component**, used everywhere a user makes a selection/confirmation decision (change a supplier, confirm a surrogate, approve a test linkage): a toast/pop-up confirmation, a visible color/status indicator that the item's been reviewed, a user-name-and-timestamp audit record, and an undo action. Worth noting what's already partial prior art rather than a blank slate: the Requirement → test mapping table's Accept/Reject decisions already ship with an inline `Undo` link, and Requirement trace's `Confirm Changed · applies to N` is already the propagating-confirm pattern. Toast confirmation and an explicit user+timestamp audit record aren't confirmed anywhere yet — those are the actual gaps, not the whole component.

**Action buttons are the primary color whenever one is available.** A plain design-token rule, but it needs to be enforced consistently in whichever shell wins (see §0) — the two shells currently in play define separate token sets, so this rule is only as real as the shell decision underneath it.

**Every action-dashboard row needs four fields: due date, downstream impact, severity, and owner.** None of these are new asks invented for this refinement — they're already named directly, in three separate places: `user-stories-v1.md`'s validation-engineer story asks for severity and "who/what it affects... other teams, program, safety, customer"; its program-manager story asks for deadlines, dependencies, and cascading risk before a miss; and `validation-standing-redesign-ideas.md` already recommends adding an owner/assignee column to the decision queue. This theme is mostly "go finish wiring a field set that's already been asked for," not a new requirement to design from scratch. Per field:

- **Due date** — already surfaces at the scope level on some screens (`RFQ-26-0418 · due 2026-10-09` in the Requirement → test mapping header), but not confirmed per-row/per-action. Open question: does every action need its own due date, or does it inherit the scope-level one by default?
- **Downstream impact** — this is exactly what the not-yet-built Impact Map / blast-radius view from `requirement-trace-carryover-review-updates.md` is for. Once that's built, it's the natural per-action "downstream impact" affordance — no separate mechanism needed.
- **Severity** — not confirmed anywhere in the data model yet. Open question: reuse an existing DFMEA severity rating if one already exists in that screen set, or define a new scale specifically for this purpose.
- **Owner** — `validation-standing-redesign-ideas.md` already recommends this column for its own decision queue; extend the same recommendation to every other action dashboard (Carryover review, Requirement trace's flagged list, and any future ones), rather than treating it as a one-screen fix.

## Instructions for Claude Design

- Resolve the shell question in favor of `ui-design-current`, given it already carries the global-nav/breadcrumb/collapsible-sidebar/Lower-drawer chrome the other two themes build on.
- Build the Project overview and Output overview dashboards as the default landing experience, generalizing the existing "manager rollup" concept rather than starting a new screen family.
- Do not add a second persistent left sidebar for site navigation; rely on the existing top nav + breadcrumb strip plus the two dashboards for orientation.
- Build one shared table-shell component (Filters / Columns / Manage sidebar) and use it identically across the BOM table, surrogate-search results table, and requirements table; wire the column-adds-filter linkage explicitly.
- Converge on the right-hand side panel as the canonical detail-view pattern for all three tables; reserve the row drawer for chronological/scrubbable content only (carryover chains, recent-activity style content), not as a second general-purpose detail view.
- Standardize file/PLM, summary, cost, and similarity as the BOM and surrogate-search detail-view tabs; keep Requirements on its own already-specced category set rather than force-fitting the same four.
- Confirm whether "duplicates/revisions" similarity is a third, distinct axis (version lineage) separate from geometric/surrogacy similarity, and label it accordingly rather than folding it into the existing two-tier scale.
- Build the shared confirmed-action component (toast, status color, user+timestamp audit record, undo) and apply it to every selection/confirmation decision across the app; audit which screens already have partial pieces (Undo, propagating Confirm) so those aren't rebuilt from scratch.
- Add due date, downstream impact, severity, and owner as standard fields on every action-dashboard row, across all dashboards, not just Validation Standing.

## Open questions

- Does the top nav need a mega-menu or similar expansion to reach deep destinations without a second sidebar or multilevel hover menus?
- Does creating vs. receiving requirements change the default landing dashboard, or is it a filter within one shared dashboard?
- Does removing a column from Columns also remove its corresponding Filters entry, or can a user filter on a field they've chosen to hide?
- Does the requirements table ever need subfoldering, and if so, is the real Adient categorization taxonomy (Department/Source/Requirement type/Classification/Implicated Product) the grouping to use?
- Does every dashboard action need its own due date, or does it inherit the scope-level deadline by default?
- Is there an existing severity scale (e.g., from the DFMEA screens) to reuse for action-dashboard severity, or does one need to be defined fresh?
