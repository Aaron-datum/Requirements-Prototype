# Requirement trace & carryover review — design update request

Grounded in the live screens Aaron reviewed: `Validation Standing.dc.html` (`2a` risk-ordered summary, `2b` Requirement trace) and `RFQ to Test Plan.dc.html`'s step 6, Carryover review. Three updates, covering evidence traceback, connecting the action page to the full table, and fixing how the system handles evidence it can't confidently resolve on its own.

## 1. Evidence traceback — two views, not one

**Already working — lock it in.** The `Full carryover chain` bottom drawer already built into Requirement trace (`2b`) is correct as-is: scrubbable hop cards (date, program, event, status), open independently of the center table and side panel — in the reviewed screenshot, a requirement is selected in the side panel *and* the drawer is open at the same time, neither blocking the other. This is the right pattern for "trace back on this one requirement" and reuses `Requirements Workflow Wireframes 1c` correctly. No changes needed here — just confirming it as the standard, since the next piece is easy to conflate with it.

**New: a network map for blast-radius questions.** The drawer answers "where did this requirement come from." It doesn't answer "if I change this, what else needs to move" — a different question, asked outward across programs and parts rather than backward through time. Aaron's example: change a head gasket design and rerun Test 12 — does that test need to rerun on other programs using the same design? What about system-level results built on top of it?

This needs its own view, reachable independently of the drawer (a user may want blast-radius without wanting the historical chain, or the reverse):

- **What it shows, for a selected requirement / test / evidence record:** what depends on it downstream (other requirements, other programs' tests relying on the same evidence), what it depends on upstream, and — the part that makes this more than a link map — what becomes stale or needs re-review if the selected node changes. A change-propagation view, not a static diagram.
- **Reuse, don't invent:** `Diagram Lenses`' hop-ring graph mechanics, `Requirements Workflow Wireframes 1a` (Program Map)'s node-plus-detail-panel structure and `Trace back`/`Trace forward` actions, and Program Portfolio's dependency rollup (`3c` — solid arrows for blocks, dashed for donates, across programs). None of these individually asks the blast-radius question, but combined and scoped to one node's radius (rather than a whole-program rollup) they're the right mechanics.
- **Where it opens from:** the Requirement trace side panel (and/or a table row), as a sibling action to the bottom drawer, not a replacement for it.

## 2. Connect the carryover action page to the full table

Step 6 (Carryover review) in the stitched prototype is a triage surface — the flagged, needs-a-decision list, which is the right thing to lead with. But it's currently a dead end: there's no way from there to see everything, only what's flagged. Add a link (`View full requirements table` or similar) from Carryover review to the existing Requirement trace screen (`2b` — 571 requirements, Filters/Columns/Manage sidebar), carrying the current program/BOM scope across so the user doesn't lose context switching from "what needs me" to "show me everything and how it's tracked."

## 3. Fix Undetermined's destination, then build real evidence resolution

**The misroute.** Drilling into `Undetermined` today lands on the BOM's Similarity tab — geometry-based part matching, `Other candidates` ranked by score, a Provenance section about CAD/material match. That's answering "what part is this," not "what evidence satisfies this requirement." It pulls up real detail, which is why it doesn't feel entirely wrong, but it's the wrong screen for the question. Route `Undetermined` to a requirements-evidence resolution surface instead — an extension of Carryover review / Requirement trace's side panel, not the BOM comparison screens.

**What that surface needs, once routed correctly.** Today the resolution action set is confirm-or-reject on one system-found match (`Link Evidence to This Requirement` / `Move to Gap Instead`). That's not enough for the actual Undetermined case — the system found more than one plausible answer, or none, and needs the user's judgment. Extend it with:

- **Ranked candidates, not one.** When Datum found multiple plausible evidence matches, show them ranked, reusing the BOM Similarity panel's `Other candidates` list pattern (name, score, key metadata) — same shape, evidence records instead of parts.
- **Manual search.** A search action scoped to evidence/test records — by test ID, part number, program, date — so a user who already knows the answer ("I ran this test on this part last month, for another program") can find and link it directly instead of waiting on or being limited to what the system surfaced.
- **Upload as proof.** A direct upload for a test report or document that isn't in the system at all. This creates a new evidence record, tagged user-supplied rather than computed — reuse the same computed-vs-asserted visual distinction already used for manual CAD matches (`Provenance: manual`) on the BOM side, so a linked-but-unverified system match and a user-uploaded document never look identical.

## Instructions for Claude Design

- Confirm the `2b` bottom drawer's independence from the center table and side panel as the standard — no changes, but treat it as the reference behavior for any new drawer-style surface.
- Design the network/blast-radius map as a new view off the Requirement trace side panel, scoped to one selected node's upstream/downstream/needs-review set — build from `Diagram Lenses`' hop-ring mechanics, `Requirements Workflow Wireframes 1a`'s node+panel structure, and Program Portfolio `3c`'s solid/dashed dependency-arrow language, not from scratch.
- Add a `View full requirements table` link from Carryover review (step 6) to Requirement trace (`2b`), carrying program/BOM scope across.
- Re-route `Undetermined` drill-throughs to the requirements-evidence resolution surface instead of the BOM Similarity tab.
- On that resolution surface, add: a ranked-candidates list (reusing the BOM `Other candidates` pattern for evidence instead of parts), a manual search action scoped to evidence/test records, and an upload action that creates a user-supplied evidence record with its own distinct computed-vs-asserted treatment.

## Open questions

- Does the blast-radius map need multi-select (compare the impact of two candidate changes side by side), or is single-node radius enough for now?
- Does linking evidence through the new resolution surface need the same propagation behavior already specced for driven-by confirmations (`applies to N requirements sharing the same interface`), or is evidence linking always single-requirement since it's a different kind of confirmation?
- Does Requirement trace need a way back to the action-focused Carryover review view, or is Carryover review always the entry point and the full table always a one-way drill from it?
