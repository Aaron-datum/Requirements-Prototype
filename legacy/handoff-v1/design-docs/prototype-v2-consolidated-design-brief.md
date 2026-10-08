# Prototype V2 — consolidated design brief for Claude Design

Grounded in the latest build (`RFQ to Test Plan v2.dc.html`, plus the earlier-round `Cost Estimate Wireframes.dc.html`) and the decisions just settled on navigation, tables, and the similarity/taxonomy vocabulary. This round of the prototype already builds most of what every prior brief in this project asked for — the job here is to confirm that, fix what's still inconsistent, and spec what's genuinely still missing. Read section 1 as "don't redesign this," and sections 2–3 as the actual scope of new work.

## 0. Standing decisions — build everything below on these

- **Shell:** `ui-design-current` is the design system. V2 already bundles it (`_ds/ui-design-current-.../`) — this is no longer an open question.
- **Orientation:** dashboards, not an additional nav sidebar or cascading menu. Not yet built in this prototype (see 2a).
- **Columns ↔ Filters:** removing a column removes its filter unless another active filter still depends on it; toggling a column's visibility alone never touches Filters.
- **Requirements taxonomy:** likely needed, via either subfolders (matching the BOM's subassembly grouping) or hierarchy-carrying columns — which one is still open (see 2b).
- **Detail view:** right-hand side panel is canonical everywhere, full stop.
- **Similarity vocabulary:** geometric similarity is one component of surrogacy, not a separate tier — surrogacy also weighs supplier, manufacture method, and the rest. A duplicate is a stricter case: identical geometry *and* material — literally the same part, differing only in PLM metadata like part number.
- **Due dates:** inherited from scope by default, not required per action.

## 1. Already built and matching spec — lock these in

This list exists so nothing here gets redesigned by accident:

- **RFQ intake** — the Connected sources block (SAP S/4HANA, LME aluminium·nickel, ECB reference rates, each with sync time and Manage) and the `Columns` file-route for a blank BOM template, both exactly as specced in `assembly-to-bom-creation-design-brief.md`.
- **Assembly tree** — Has CAD / No CAD legend and per-part indicator, matching the single-state simplification from the same brief.
- **BOM review** — the full Filters/Columns/Manage sidebar, subfoldering by subassembly (CHRA, Housing, Actuation, Fluid Lines), and the canonical column groups (Identity/Cost/Sourcing/Manufacture) all present and matching the reconciled column table.
- **BOM row panel** — Summary/Similarity/Costing/PLM tabs, the four standardized categories from the design-refinement doc. The Similarity tab's `SIMILAR-TO` card breaks a match into Geometry, Manufacture complexity, Material, Supplier/location, and Order of magnitude — this is the surrogacy breakdown with geometry correctly treated as one input among several, matching the vocabulary decision above.
- **Costing tab** — the driver list (FX exposure, Price source, Tariff, Material index, each with a percentage and a one-line source note) is exactly the "what are the input assumptions" answer BW's notes asked for.
- **Cost Estimate page** (`03d`) — this is close to a complete build of `cost-estimation-design-brief.md`: a Cost Model Routing box with a routing score, `Suggested · not yet confirmed`, next-best alternatives, and `Confirm Model`/`Override`; a `Why this model` reasoning list tagged by source (PLM, Surrogate, CAD features, RFQ); an `Input maturity · pursuit` box (3D CAD / 2D drawing / material spec, each flagged Have / Via surrogate / Missing) — this is the production-vs-pursuit maturity concept, built; a cost-line breakdown with per-line confidence; a `Trace` panel showing the formula behind the selected line and each input's own source and confidence; the existing sourcing-options table and volatility panels carried forward unchanged.
- **Compare Alternatives** — a genuine n-way comparison (current vs. alternate cost model vs. alternate surrogate CAD vs. alternate supplier) with per-line deltas and its own trace breakdown for the selected alternative. This exceeds what was specced and doesn't need any changes.
- **Program composition** — the New/Carryover/Uncertain three-bucket view, with `Resolve Evidence` now a real entry point out of the Uncertain bucket.
- **Requirement → test mapping** — the row-level Text badge (New/Changed), a source-type tag (`RFQ`) alongside the citation, the full requirement clause text in the panel ahead of "Why this test," and a `View Test` link on the candidate card. All four goals from the original ask are now addressed.
- **Test detail** — Procedure, Run history, and Referenced-by (cross-requirement usage), closing the gap flagged in `requirement-to-test-mapping-design-request.md`.
- **Carryover review** — `View Full Requirements Table` link, an `Impact Map` entry, and a full evidence-resolution surface on Undetermined rows: ranked candidates with confidence and `Computed` tags, a `Find evidence record` manual search, and `Upload Proof` with the exact copy this needed (*"Records you add or upload are tagged as asserted, not computed, until a reviewer verifies them"*) — the computed-vs-asserted distinction, stated plainly.
- **Requirement trace** — source-type tags (`Carryover`/`RFQ`) next to citations, a working Manage tab alongside Filters, and a new `Associated test` panel section with the same evidence-card pattern used elsewhere (`TR-25-0042 · Leak-down, 6 samples · pass`, with a `View Test` link). Confirmed by testing it directly: `Resolve` on an Undetermined row routes to the *same* evidence-resolution surface as Carryover review — it's one mechanism reached from two places, not a second competing one. `requirement-trace-table-cleanup.md` item 5 is resolved.
- **Impact map** — hop-depth (1/2) and direction (Both/Trace Back/Trace Forward) controls, a typed node graph (REQ/DOC/PRT/TST/PLN) with a clear edge legend, an `If this changes` scenario selector (part design / evidence re-run / requirement text), and an affected-downstream list with Re-review/Check tags and plain-language reasoning (*"Relies on the result being superseded," "Two hops out — confirm the margin still holds"*). This is a complete build of the blast-radius concept, including the exact head-gasket-style reasoning it was meant to support.
- **Approve & create test plan** — the receipt screen flagged as a small gap in `rfq-to-adv-pnr-integration-guide.md` is now built: carried-over/routed/still-open counts, a still-open list with a per-row owner, and a review checkbox gating the approve action.

## 2. Real gaps — where this round should focus

**2a. No dashboard or landing page yet.** The prototype still starts directly on RFQ intake. The Project overview and Output overview dashboards agreed on as the entry point aren't built anywhere in this version — this is the single biggest structural gap against the agreed direction, not a refinement of something that exists.

**2b. Requirements taxonomy is still undecided and unbuilt.** Requirement trace's table is flat today — no subfolders, no hierarchy column. Needs a decision (subfolders, matching the BOM's pattern, vs. hierarchy-carrying columns using the real Adient taxonomy) and then the build to match.

**2c. The dangerous-case highlight still only tracks selection, not the condition.** Same issue flagged in `requirement-trace-table-cleanup.md` persists unchanged: REC-10401 (selected) is highlighted, REC-10470 (identical Text=Unchanged + Driven-by=Changed 78% risk profile, not selected) is not. Still needs decoupling from selection state.

**2d. Driven-by confidence-score display is still inconsistent.** Turbine wheel creep rupture and Journal bearing wear show `✓ Unchanged` with no score; VGT vane ring shows `Unchanged 91%`. Same open item as before — decide once (always show it, or only below a stated threshold) and apply everywhere.

**2e. Owner is invisible until the very end of the flow.** It only appears on the final Approve & create test plan screen. Carryover review's flagged list and Requirement trace's rows don't show who's responsible for each item — worth surfacing earlier, consistent with the due-date/impact/severity/owner rule from the navigation-tables-decisions brief, rather than only at the receipt.

**2f. Severity still isn't represented anywhere.** Not on Carryover review, not in Impact Map, not on the Approve summary. Still needs a source decided — reuse an existing DFMEA severity rating if one exists, or define a scale specifically for this.

**2g. Toast confirmation and a per-action audit record weren't confirmed in this pass.** Undo is present (Requirement → test mapping's Accept/Reject rows). Toast pop-ups and an explicit user+timestamp record on confirm actions (`Confirm Model`, `Link Selected Evidence`, `Confirm Changed`) weren't observed — worth an explicit build/verification pass rather than assuming they exist off-screen.

## 3. Smaller refinements worth folding in

- `1 iface Δ`'s tooltip/label clarity is still just a copy check, carried over from the prior cleanup doc.
- Decide whether a true duplicate (identical geometry + material, different PN) needs its own visual tier in the main Certainty column, or stays as a text note inside the Similarity tab's Provenance line (`Carryover — geometric duplicate`) as it is today. Right now it's text-only, not a distinguishable badge shape from an ordinary surrogate match.
- The earlier `Cost Estimate Wireframes.dc.html` exploration round included an `Open Features` action (drilling from a cost-line input like cycle time into the actual detected CAD features behind it — machined faces, tapped holes) that didn't make it into the built Trace panel. Worth considering as an addition, since it's the one idea from that round the current build doesn't have.

## Instructions for Claude Design

- Design and build the Project overview and Output overview dashboards as the app's entry point — this is new work, not a refinement.
- Decide and build requirements taxonomy (subfolders vs. hierarchy columns) for Requirement trace's table.
- Decouple the dangerous-case row highlight from selection state so every Text=Unchanged/Driven-by=Changed row gets it, not just the one currently open in the panel.
- Make Driven-by confidence-score display consistent across New/Unchanged/Changed — always shown, or shown by one stated rule.
- Surface an owner field on Carryover review's flagged list and Requirement trace's rows, not only on the final Approve screen.
- Decide a severity source (existing DFMEA scale or a new one) and add it to Carryover review, Impact Map, and the Approve summary.
- Verify or build toast confirmation and a user+timestamp audit record on every confirm action, alongside the Undo that already exists.
- Decide whether duplicates need their own Certainty-column tier or stay as Similarity-tab text.
- Consider adding an `Open Features` drill-in from Trace panel cost-line inputs back to the detected CAD features behind them.

## Open questions

- Subfolders or hierarchy columns for requirements taxonomy — which, and does the real Adient taxonomy (Department/Category/Sub-category) drive it?
- Where does a severity scale come from — DFMEA, or a new definition specific to this action-dashboard need?
- Does a duplicate part need a visually distinct Certainty tier, or is text inside the Similarity tab's Provenance line enough?
