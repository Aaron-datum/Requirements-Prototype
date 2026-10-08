# Projects Dashboard — lo-fi design brief

Grounded in the hand-sketched dashboard notes: a global nav, a row of three action boxes (Urgent/risky action items, Review items, Where you left off), a status bar (summary info / progress / connections), a row of three data-visualization boxes that cycle together (zoom level, what's shown, the form it takes), and an overflow section — a lightweight filterable table holding everything the summary above rolled up. The action boxes reuse the Program composition screen's existing box pattern (a count, a short line, a list of top items, one primary action per box — Generate Test Plan / Review Carryover / Resolve Evidence) rather than a new component. This one shell serves both the Project overview and Output overview scopes from `design-refinement-navigation-tables-decisions.md`, and closes gap 2a from `prototype-v2-consolidated-design-brief.md` (no dashboard/landing page built yet). Low-fi only — structure and information placement, the same register as `bom-detail-view-lowfi-brief.md`'s earlier rounds, not visual polish.

## What the page needs to answer

- How does the user track what they care about — cutting through noise to what's high-priority or close to a deadline?
- How does the user understand what's connected, and how — is this a task, a search result, where did it come from?
- Where are things at, what's next — status, blockers/risk, ownership, recent work?

## Shell structure, top to bottom

1. **Global nav.** Already built — no change, it just sits above everything below.

2. **Action boxes.** Three boxes — Urgent/risky action items, Review items, Where you left off — built on the Program composition screen's existing pattern: a count, a short description line, a list of top items, and one primary action per box. Same shape, different content per box (urgency/risk vs. items awaiting review vs. recent/in-progress work).

3. **Status bar.** One lightweight strip — summary info, progress, connections. This is the at-a-glance line, not another set of cards.

4. **Data-visualization row.** Three boxes that cycle together rather than standing independently: zoom level (program / part / HW), what's being shown (certainty, price, diversity/redundancy, timeline), and the form it takes (graphs, charts, tables, action items). Treat this as a dynamic slot — which zoom level × metric × form combination appears depends on context, it isn't a fixed set of three charts.

5. **Overflow / detail table.** A lightweight, filterable table underneath everything else, holding the full data the summary rolled up — this is where "show me everything" lives once the dashboard above has already surfaced what needs attention.

## One shell, two scopes

Project overview and Output overview use the same five bands top to bottom. What changes between them is only the content inside each band — action boxes show program-wide items vs. one output's own open items; the data-viz row zooms across program/part/HW vs. staying within a single output. Build the shell once, parameterized by scope, not two separate layouts. This also sets up the notes' own generalization — this same shell reused later for other summary dashboards (price/suppliers, Val approvals) — though those stay out of scope for this pass.

## Instructions for Claude Design

- Build as low-fi/greybox — structure and placement only. A few genuinely different variants specifically for the action-boxes row and the data-viz row, since those are the two slots with real layout choices; the status bar and overflow table are more fixed.
- Reuse the Program composition screen's action-box component (count + line + item list + one action) for the three action boxes rather than designing a new card type.
- Build one shell parameterized by scope (Project overview vs. Output overview), not two separate screens.
- Show the data-viz row as a dynamic slot — at least two or three different zoom-level/metric/form combinations in the variants, not one hardcoded example, to actually test the slot concept.

## Open questions

- Confirm "HW level" as the third zoom tier alongside Program and Part, in case the note meant something else.
- Does the overflow table reuse the existing Filters/Columns/Manage table shell from the rest of the app, or is a lighter-weight version right here since it's explicitly "lightweight filterable," not a full data table?
- For "Where you left off" — does this need real recency/session data, or can it reuse whatever activity-log concept already exists elsewhere in the app?
