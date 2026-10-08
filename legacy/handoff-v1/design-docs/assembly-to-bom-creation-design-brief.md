# Assembly → BOM creation — design brief for Claude Design

This builds on **page 10, `RFQ to Test Plan.dc.html`**, the stitched end-to-end prototype (RFQ intake → Assembly & blank BOM → Surrogate search & review → Program composition → Requirement→test mapping → Carryover review → Approve & create). Specifically, this brief covers screens **01 RFQ intake**, **02 Assembly & blank BOM**, and **03 Surrogate search & review**. The BOM prototype files (`BOM_workflow-2.zip` — `BOM Detail Prototype.html`, `BOM Detail Wireframes.html`) are additional context only — cite them for patterns (the Filters/Columns/Manage sidebar, the `CadGhost` empty state) but don't treat their screens as the ones being extended.

Three features to spec, in the order they show up in the flow.

## 1. Customizable BOM columns

**Base column set** (reconciled — this is the canonical list, ignore repeats across sources):

| Group | Columns | Default visible |
|---|---|---|
| Identity | Part name, Part number, Quantity | on |
| Cost | Price, Source, Currency, Certainty | on |
| Sourcing | Supplier, Region, Method | on |
| Manufacture | Material, Tooling, Cx (complexity) | on |
| *(hidden by default)* | Lead time, Model year, Tooling faces, Weight, Volume, Program MY | off |

Today, **03 Surrogate search & review** shows a narrower set than this — Part name, Part no., Qty, Lineage, Match, Closest in production, Unit price, Supplier. Bring it up to the full canonical list above, grouped the same way, and add the customization control: which columns show, beyond the always-on Identity group, should be user-adjustable. The BOM Detail Prototype's filter sidebar already has the right shape for this (a `Columns` tab alongside `Filters`/`Manage`, grouped checklist, an "adaptive default" note about columns the team leaves hidden dropping out of suggestions) — reuse that pattern rather than designing a new one, even though 03 doesn't currently have a sidebar at all.

**Deriving columns from an uploaded BOM.** Fold this into the file-routing pattern **01 RFQ intake** already has, rather than adding a separate upload flow. The Package contents table already routes each file to `CAD → BOM`, `Requirements`, or `Kept on file` via a per-file dropdown — add a fourth route, `Columns`, for a file Datum detects as a blank or example BOM (its own header row, no CAD or requirements content). Routing a file there feeds the column set on step 3, using the same matched / needs-confirmation / custom three-way split the BOM's own confidence tiers already use for everything else, so parsed columns get the same visual treatment as parsed parts.

## 2. Sources & context, folded into RFQ intake

**01 RFQ intake already does most of this — extend it, don't add a new screen.** It already shows the package split into Track A (CAD → BOM) and Track B (Documents → Requirements), and a Package contents table (File / Detected as / Size / Found / Routed to) covering the CAD assembly, CAD reference bodies, the SOR PDF, an engineering spec, a test-plan template, commercial terms, and photos. What it's missing is the sources that aren't uploaded files at all — the data Datum pulls in automatically:

- **Cost data source** — the pricing feed a line's `Price`/`Source` values come from (e.g. an ERP/SAP sync — already referenced elsewhere in the prototype as `SAP sync 14 min ago`).
- **Price / commodity source** — material-index feeds behind cost uncertainty (e.g. LME aluminum, fetched daily).

Add these as a compact third block on the intake screen, next to the two track cards — same card language, but for connected sources rather than uploaded files: name, status (`Connected` / `Not connected`), last-sync time, and a `Manage` action. Don't make the user "add" a source that's already auto-connected; show it as on, the way the existing table toolbar note already does elsewhere in the prototype (`SAP sync 14 min ago · FX 3-mo avg`).

**Editable, and it cascades — this is already the right shell for that.** The step list on the left is already a real stepper the user can click into at any point, not a locked linear sequence (every step shows a live sub-label — `14 of 16 parts selected`, `0 of 10 reviewed` — and stays clickable once visited). Changing a file's route, or a connected source, on intake and then returning to a later step should recompute that step's counts and content rather than leaving stale values — the mechanism for this (the sub-label pattern) already exists; it just needs to actually recompute on revisit rather than freezing at first-visit values.

## 3. CAD status per line

One state, not three: a BOM line either **has CAD** (pulled from the parsed assembly) or it doesn't. Whether that's because CAD isn't ready yet, a non-CAD method was used, or CAD doesn't apply to that part doesn't need separate treatment — it's all just **No CAD**, and it caps that line's Certainty at `Estimated` or below, the same way a line with no match already behaves.

Today, **02 Assembly & blank BOM** only shows parts that came from the parsed assembly, so every line already has CAD — there's no case in the current build where a line lacks it. That happens when a line is added manually, or a reference-geometry part gets manually re-included without a real CAD body. Add a small indicator next to the part name (icon, not a new column — keep it compact) that reads as filled/present for "has CAD" and outlined/empty for "No CAD," with an upload action directly on it. Reuse the `CadGhost` placeholder language from the BOM prototype's compare workbench (*"CAD part not rendered"*) as the visual base for the empty state, and keep any accompanying text to a label, not a sentence — no explanatory warning copy needed; the Certainty column already shows the cap.

## Copy style

Match what's already in the built screens — short, information-dense fragments, not sentences. Examples already in the prototype: `14 of 16 parts selected`, `Reference geometry excluded automatically`, `New BOM created with 14 blank lines. Run surrogate search to match each line against parts already in production.` One line, stated plainly, no hedging. Apply this to every new label, status, and helper line in the three features above.

## Instructions for Claude Design

- Extend `RFQ to Test Plan.dc.html`'s existing 01/02/03 screens — this is the flow to build on; don't restart from the BOM prototype's separate files.
- Bring 03's column set up to the canonical list, and add column customization using the Filters/Columns/Manage sidebar pattern from `BOM Detail Prototype.html` as the reference (additional context, not the screen to extend).
- Add a fourth file-route option (`Columns`) to 01's Package contents table for a blank/example BOM upload, using the same matched/needs-confirmation/custom pattern the rest of the prototype already uses.
- Add a "Connected sources" block to 01, alongside the existing two track cards, covering cost data source and price/commodity source at minimum.
- Make sure step sub-labels and downstream screens actually recompute when the user edits an earlier step and revisits — the stepper already supports jumping back; the data needs to follow.
- Add a compact has-CAD/no-CAD indicator to line items in 02 (and carried into 03's table), reusing the `CadGhost` empty-state language, with Certainty capping at Estimated for No CAD lines — no separate warning copy.
- Keep all new copy short — labels and fragments, matching the existing screens' style, not full sentences.

## Open questions

- Does the `Columns` file-route need its own "Detected as" label (e.g. `Blank BOM template`) the way CAD and requirements files already get one, or is a generic label fine until a real file is tested against it?
- For "Connected sources" — are there other auto-connected feeds worth listing alongside cost data and commodity pricing (e.g. a PLM connection, a supplier-quote feed), or are those two the full set for now?
