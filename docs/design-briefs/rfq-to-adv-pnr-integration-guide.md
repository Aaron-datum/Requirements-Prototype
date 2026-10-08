# RFQ → ADV P&R: single-prototype integration guide

This is the build spec for stitching the BOM prototype and the requirements prototype into one interactive walkthrough of a specific engineer workflow, grounded in what's actually been built in `BOM_workflow-2.zip` and `Requirements_workflow_UI_directions-5.zip`. Nothing here is a new design direction — it's a map of what already exists across the two zips, what connects and what doesn't yet, and what has to be built or renamed to make the seams disappear.

## The target flow

The narrative to prototype, in the user's own words:

1. Engineer receives an RFQ. For demo purposes, it includes CAD.
2. User uploads a CAD assembly and creates a blank BOM file.
3. They run surrogate searches to see what already is in production, what has a close reference.
4. They review the BOM, confirming surrogates as needed, and have a good first-order estimate for the cost/supply chain of the component.
5. They then go to create an ADV P&R.
6. Datum maps requirements from the RFQ (and other requirements docs uploaded) to tests.
7. The system flags requirements in need of review for carryover.
8. User approves and creates the ADV P&R.

Steps 1–4 live almost entirely in the BOM prototype (`BOM_workflow-2.zip`). Steps 5–8 live in the requirements prototype (`Requirements_workflow_UI_directions-5.zip`). The two were built by different passes, in different shells, with different design-system tokens — that seam is the main thing this guide exists to close.

## Step-by-step: what already exists

### 1–2. RFQ received, CAD uploaded, blank BOM created

**Source:** `BOM Workflow Wireframes.html`, steps 1–2 (Datum UI V1, white mode, mid-fi/greybox).

Step 1 (upload) isn't captured in this pass's default render, but step 2 — **"Review assembly tree & select components"** — confirms it exists and shows its output: `Turbocharger Module — MY2026.CATProduct · Uploaded · 2.4 MB`, parsed into a collapsible assembly tree (4 subassemblies, 20 parts), with reference geometry auto-excluded and everything else selected by default. Two layout variants (2A two-column tree+summary, 2B tree-first with a sticky summary bar) are already explored. `Configure BOM →` moves to step 3, which is where the blank BOM actually gets created from the selection (18/20 parts → 18 BOM rows).

**Scope decision:** the RFQ, in reality, *includes* CAD as one artifact among others (per the signed Adient SOR, an RFQ package is MS Office docs, PDFs, images, and CAD together), and there's no screen anywhere in either zip that shows the whole package arriving and splitting into a CAD track and a documents track. For this prototype, that's fine to skip — **the prototype starts assuming the upload is already complete**, the same way `BOM Workflow Wireframes.html` already does (it opens on step 2 with `Turbocharger Module — MY2026.CATProduct · Uploaded · 2.4 MB` already parsed). A unified RFQ-intake screen showing the CAD/documents split is real future scope, not something this build needs — see the note under Gaps.

### 3–4. Surrogate search, review, confirm, first-order cost estimate

**Source:** `BOM Detail Prototype.html` (Datum UI V1, hi-fi, fully interactive — not a static board, an actual working React app).

This is the most finished piece in either zip. It already does almost exactly what the flow asks for:

- **Overview screen** — BOM table + KPI dashboard behind tabs, `SummaryBand` showing total cost, program count, cost risk, and a certainty legend (Actual / Surrogate / Estimated / No match / Search failed) with counts, right next to a `Re-run search` action. `KpiDash` adds a "Reuse rate" tile ("% of lines resolved to an existing part... replaces the background file") and an "Unresolved" tile with a one-click `Bulk-search unresolved rows` action — this is literally the surrogate-search trigger the flow describes.
- **Filter sidebar** — the real Filters / Columns / Manage pattern (320px expanded, 56px collapsed), with a **Program view** control under Manage that toggles between "Select program" (one at a time) and "Side by side" (all programs, one qty column each, `—` where a line isn't used) — this is the BOM-level version of the cross-program comparison the requirements side also builds toward (see step 7).
- **Row detail panel** — Summary / Similarity / Costing / PLM tabs per line. Summary shows the `carry` field verbatim (`Carryover — F-Series MY2024`, `New geometry`, or `Unknown`) — this is the field that should become the new-vs-carryover signal everywhere downstream.
- **Compare parts screen** (physical similarity drill-in) — full CAD-compare workbench: linked dual viewports, PLM/measurements side panel, similarity-by-dimension meters, and — critically — a **"Requirements driving part selection" table** (Requirement / Source / BOM-line value / production-part value / Status, each row tagged RFQ / Carryover / Internal / Supplier / Mfg / Regulatory / Program) with an **`Open traceability`** button. This table already answers "why does this line need what it needs" and is the literal bridge into the requirements side. `Accept as surrogate` confirms the line.
- **Compare suppliers screen** (costing drill-in) — sourcing options table with certainty, cost-vs-certainty chart, non-price factors (region restriction, redundancy target, tooling ownership), FX/market volatility, and an explicit "if you switch" preview that states `Also triggers: Re-run surrogate search · tooling request · DV test delta` before you commit. `Apply supplier change` is the confirm action.

This screen set fully covers "review the BOM, confirm surrogates, get a first-order cost/supply-chain estimate." Nothing needs to be built here — it needs to be wired forward.

**Terminology note:** this prototype's confidence tiers (Actual / Surrogate / Estimated / No match / Search failed) are a *BOM-line match confidence* axis. They look similar to Adient's Conformance State values (No Gap / Gap / Evaluated Elsewhere / Not Applicable / Undetermined) but answer a different question — one is "how sure are we this is the right part," the other is "has this requirement been validated." Keep them visually distinct everywhere they might appear near each other (see Cross-cutting issues, below) — don't let a shared badge shape make them read as the same status.

### 5. Transition to ADV P&R creation

**Gap, but a small one.** No screen currently says "create an ADV P&R" in those words. The nearest real triggers already built are `Generate Test Plan` (Validation Standing's Gap card and its program-level rollup) and `Generate test plan` (Program Portfolio's Composition screen, New bucket). Whether "ADV P&R" is a single document that bundles multiple generated test plans, or whether each `Generate Test Plan` action *is* creating one ADV P&R per scope, is a naming decision to make once, not a new screen to design — see Gaps and Open questions below.

The most natural seam: from the BOM's row detail panel or the Compare Parts screen, `Open traceability` should land on the program's **Composition** screen (`Program Portfolio.dc.html`, or its lofi source `Program Portfolio Wireframes.dc.html` id `4a`) rather than a bare traceability table, because Composition is where "what's new, what's carryover, what's uncertain" already lives as a program-level rollup with a `Generate test plan` action sitting right on the New bucket. That one hop — BOM line → program Composition — is what turns "confirm this BOM" into "now create the ADV P&R for what's new here."

### 6. Datum maps requirements (RFQ + other docs) to tests

**Source:** mainly `Program Portfolio Wireframes.dc.html`'s concept 6 (`6a`–`6k`, labeled C1–C5) and `Requirements Workflow Wireframes.dc.html`.

- `6a` (C1 · OEM-first landing) groups by OEM document header code (Daimler MB-SOR-11, VW VW-SOR-04, etc.) exactly as the signed SOR describes step 2 of Adient's own pipeline (filtering the RFQ package to its engineering-relevant, OEM-coded subset).
- `6f` (C2 · comparison, four units) makes explicit that a comparison can run at four different granularities — REC requirement, TDM section, Implicated Product, or BOM line — and states outright that "BOM line" is the unit that answers *"what has to be tested and validated?"* This is the requirements side naming the BOM as one of its own comparison units, which is exactly the reframe the earlier brief asked for.
- `Requirements Workflow Wireframes.dc.html` id `1a` (now titled **Program Map**) is the clustered-graph view of requirements grouped by subsystem/stage/department, each node showing status (on track / at risk / blocked / unknown), with a right-hand detail panel (`What it connects to`, `Who's using it`) and `Trace back` / `Trace forward` actions.

**What's solid:** the OEM-aware ingestion and multi-unit comparison exist in lofi. **What's still a gap:** none of the rendered screens show the literal moment of "Datum reads the RFQ + requirements docs and proposes requirement → test mappings" as a reviewable, confirmable action (the closest is `DFMEA Hi-Fi Screens.dc.html`'s `4a-i`/`4a-ii` interface-lifecycle Gantt, which is a related but more specialized DRBFM/interface-risk surface, not a generic requirement→test mapper). If the demo needs to show this mapping step explicitly rather than assuming it happened upstream, it's a new screen — see Gaps.

### 7. System flags requirements needing review for carryover

**Source:** `Validation Standing.dc.html`, which is the redesign from `validation-standing-redesign-ideas.md` built to hi-fi almost exactly as specified.

- `1a` — risk-ordered top row (Undetermined → Gap → Evaluated Elsewhere, with No Gap demoted and Not Applicable moved out of the primary row, matching the confirmed priority order), a `7 requirements need a decision` banner, and a "Needs a decision" queue (`REC-09011 · Cable routing bend radius · Conflicting values · Resolve`, etc.) — this is the literal flagging-for-review surface.
- `1b` — Evaluated Elsewhere drill-in: per-requirement provenance (`Where the answer comes from` timeline), `Why it transfers` reasoning tags (Same part · geometric duplicate / Same supplier / Same standard), and `Link Evidence to This Requirement` / `Move to Gap Instead` actions.
- `2a` — the "ordered by risk" alternative where Undetermined leads the page as its own full-width panel, broken down by *why* (Conflicting candidates, Stale evidence, Applicability not assessed, Ambiguous requirement text), each row with an owner and a `Resolve`/`Review`/`Clarify`/`Assess` action matched to what's actually wrong.
- `3a` — the program-level rollup: subsystems sorted by risk, an "Undetermined" reason breakdown, and an "unassigned · oldest first" queue — this is the manager/program view onto the same states.

Terminology already adopted here: **TDM** ("Requirements in this TDM"), **Export TDM**. Good — that's the Adient-grounded vocabulary from the SOR update landing correctly in the actual build.

This step is essentially done. The one thing to confirm before treating it as final: the doc's language ("flags requirements in need of review for carryover") maps onto *Evaluated Elsewhere* (a carryover candidate the system found and needs a human to confirm) more than onto *Undetermined* (which is closer to "we don't even know if this applies"). Both are real states here, but if the demo script specifically wants "carryover review," `1b`'s Evaluated Elsewhere drill-in is the scene to lead with.

### 8. User approves and creates the ADV P&R

**Partial gap.** `Link Evidence to This Requirement` (Evaluated Elsewhere) and `Generate Test Plan` (Gap, and the program rollup) are the individual confirm actions that exist today. What's missing is the *summary/receipt* moment — a screen that says "here's what's being created: N requirements confirmed carryover, N requirements sent to a new test plan, this is the ADV P&R" and asks for one final approval. Right now the flow implicitly ends at the per-requirement or per-card action; there's no single moment that closes step 8. This is the other new screen to design — see Gaps.

## Cross-cutting issues to resolve before this can be one clickable prototype

**Two different shells, two different design systems.** The BOM prototype runs on `datum-ui-v1-design-system` (Tan/Vanilla/Oatmilk/Charcoal, DM Sans/DM Mono, 2px radius, its own `TopBar`/`Crumbs` components, `bom-ui.css`). The requirements prototype runs on `ui-design-current` (different token set, e.g. `--datum-blue #1A3A5C`, 5px radius, a persistent global-nav + breadcrumb-strip shell with collapsible sidebars and a real Lower drawer component). These aren't just different skins — they're two separate component libraries with different chrome, and this discrepancy has been visible since the first BOM zip but never resolved. For a single click-through demo, pick one shell. Given the requirements side already models the fuller information architecture (persistent shell, right panel + lower drawer, heavyweight/lightweight table distinction) and has the real Lower drawer component the requirements-tracing doc now depends on, **the requirements prototype's shell (`ui-design-current`) is the stronger candidate to standardize on** — but this is a real decision, not a default; flag it to Aaron before Claude Design starts wiring screens together (see Open questions).

**The new-vs-carryover signal has three different vocabularies right now**, all describing the same underlying fact from different angles:

| Where | Vocabulary |
|---|---|
| BOM line (`bom-proto-data.jsx`, `carry` field) | `Carryover — <program/MY>` / `New geometry` / `Unknown` |
| Requirements Tracing screen | `Text`: New / Unchanged / Changed · `Driven by`: New / Unchanged / Changed |
| Validation Standing / TDM | Conformance State: No Gap / Gap / Evaluated Elsewhere / Not Applicable / Undetermined |

These need an explicit mapping, not a merge — they're genuinely different questions (is this part new; has this requirement's text or its driven-by interface changed; has this requirement been validated) that happen to correlate strongly. A BOM line tagged `Carryover` should pre-populate the corresponding requirement's `Text: Unchanged` and lean the Conformance State toward `Evaluated Elsewhere` rather than `Gap` — but the system should still show its work (reasoning tags, confidence) rather than silently inheriting one state from another. This mapping is exactly what the Compare Parts screen's `Open traceability` button and the requirements side's `BOM line` comparison unit (`6f`) are each reaching toward from opposite ends — they should meet in the middle.

**"ADV P&R" isn't in any screen's copy yet.** The building blocks (`Generate Test Plan`, `Generate test plan`) use Datum's generic language. Decide whether ADV P&R is the name for what these buttons produce, or a larger container that bundles several generated test plans plus the carryover sign-offs — this determines whether step 8's new "receipt" screen is titled per-test-plan or program-wide.

## Gaps to design (net-new screens)

Out of scope for this build, by decision: a **unified RFQ intake** screen (the whole RFQ package — CAD + engineering docs + images/PDFs, per the SOR's step 1 — splitting into a CAD track and a documents track) would be the "correct" front door, but the prototype assumes upload is already complete instead (see the scope decision under steps 1–2). Worth designing later; not needed here.

1. **Requirement → test mapping review.** A screen where a validation engineer reviews Datum's proposed requirement-to-test mappings before they're accepted — distinct from DFMEA's interface-lifecycle Gantt, which assumes the mapping already happened. Reuse the evidence-card and reasoning-tag patterns already established (Evaluated Elsewhere's `Why it transfers`, DFMEA's `AI-inferred` tag) rather than inventing new ones.
2. **ADV P&R creation receipt / final approval.** The screen that closes step 8: a summary of what's being committed (X requirements carried over and confirmed, Y requirements routed to new test plans, Z still open) with one approval action that actually creates the ADV P&R record — as opposed to today's per-card confirm actions, which each close out one requirement or one bucket but never the whole P&R.

## Instructions for Claude Design

Build this as one new flow, reusing the screens above by reference rather than rebuilding them, in the `ui-design-current` shell (pending Aaron's confirmation — see Open questions):

- Start the prototype at `BOM Workflow Wireframes.html` step 2, with the upload already complete (`Turbocharger Module — MY2026.CATProduct · Uploaded · 2.4 MB`) — no intake/upload screen needed.
- Carry into `BOM Detail Prototype.html`'s Overview screen for the surrogate-search review; this piece is hi-fi and interactive already — port its behavior (not just its look) if the shell changes, since the Filters/Columns/Manage sidebar, the row detail tabs, and the Compare Parts/Compare Suppliers screens are functional, not static.
- Make the Compare Parts screen's `Open traceability` button a real link to the program's Composition screen (`Program Portfolio.dc.html`, direction built from lofi `4a`), landing on the New/Carryover/Uncertain three-bucket view scoped to that program.
- From Composition's New bucket, `Generate test plan` should lead into the new requirement→test mapping review (Gap 1), then into `Validation Standing.dc.html`'s `1a`/`1b` for the carryover-flagging review — reuse those screens as-is; they're already built to the agreed spec.
- Close the loop with the new ADV P&R receipt screen (Gap 2), reachable from both Validation Standing's decision queue (once it's empty or explicitly deferred) and from Composition.
- Apply the new-vs-carryover vocabulary mapping (above) consistently: every screen that shows a BOM `carry` value, a requirement's `Text`/`Driven by` state, or a Conformance State badge should use visually distinct badge shapes per axis, even where they correlate.
- Do not use "ADV P&R" in any screen copy until Aaron confirms what it names (see Open questions) — use "test plan" as a placeholder, consistent with what's already built.

## Open questions

- **Shell:** standardize the single prototype on `ui-design-current` (the requirements side's shell, which already models the fuller app chrome), or on `datum-ui-v1-design-system` (the BOM side's shell, which is where the most finished interactive screens already live)? This has to be decided before Claude Design starts wiring screens together, since it determines which side gets ported.
- **ADV P&R definition:** is it one document per generated test plan, or a program-wide container bundling multiple test plans plus carryover sign-offs? This decides the shape of the new receipt screen (Gap 2).
- **Carryover-review scope for the demo:** should the walkthrough foreground `Evaluated Elsewhere` (the AI-found-a-match-needs-signoff case, closest to "flags requirements in need of review for carryover") or `Undetermined` (the higher-risk, harder case)? Both exist and work today; the demo script should pick a lead.
