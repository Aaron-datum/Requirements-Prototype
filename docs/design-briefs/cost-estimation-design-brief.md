# Cost estimation — design brief for Claude Design

Grounded in BW's own notes on cost estimation (Slack file, Sept 30 meeting) plus what's already built. Worth stating up front what's already solved so this doesn't read as a from-scratch ask: connecting to live systems (SAP, PLM, purchasing/contract data) already eliminates BW's "Background File" problem by construction, and the Compare Suppliers screen already has real uncertainty highlighting — a cost-vs-certainty chart, FX/market volatility, and an explicit "if you switch suppliers" cascading preview. What's missing is the piece BW kept circling back to: how the system gets from a part to a specific cost-model number it can defend, and a place for the engineer to supervise that reasoning the way they already do for requirements. This brief is about building that as its own step, not re-building what already exists.

## 1. The AI pipeline behind an estimate — three stages, different maturity

1. **Identify similar geometric parts.** Already built — this is the existing surrogate search / Similarity tab / Compare Parts CAD-compare workbench. No new design here.
2. **Compare PLM/metadata to account for manufacturer, location, etc.** Partially built — the row detail panel's PLM tab already surfaces this kind of metadata, but today it's informational. Extend it so its output explicitly feeds the cost-model decision in stage 3, rather than sitting next to it unconnected.
3. **First-order approximation of machining complexity, manufacture method, and key features.** This is new, and it's the hard mechanicals problem BW's notes spent the most time on — identifying machined surfaces, tapped holes, tolerance class, and similar features directly from CAD geometry, well enough to pick and populate a cost model. This is the piece that doesn't exist anywhere in the prototype yet and needs real design attention, not a light extension of something built.

## 2. Cost-model routing — a computed decision, not a black box

Once the pipeline above has an answer, the system should determine the likely manufacture method and route to the matching cost model — BW's notes name roughly ten cost models in active use, primarily three (casting, stamping, plastics), plus others (plating, etc.). This routing decision needs the same treatment every other computed signal in this project gets: shown with a confidence score, the reasoning behind it, and a confirm/override action — never presented as settled fact. This is exactly the "engineer becomes supervisor" framing: the value isn't hiding the decision, it's making it inspectable and correctable in one place, the same posture the Driven-by/interface-changed signal takes in requirements tracing.

## 3. A full Cost Estimate page, not just a wider supplier table

This sits in the BOM flow under Compare Suppliers — currently built out only in the BOM prototype, as a sourcing-options table plus a cost-vs-certainty chart. Expand it into a full estimate page with three sections, reusing what's already built wherever it fits:

**3a. The estimate itself — model, breakdown, assumptions.** What the estimate is, which cost model produced it, and a breakdown of that model's output. From there, the user can drill into the model's actual assumptions and inputs — this is functionally the same traceability pattern already specced for requirements (a panel showing what's computed, its confidence, and where each input value came from), just pointed at cost instead of test coverage. Reuse the existing cost-uncertainty "drivers" display (`Material — Al 2618 · ±2.0% · LME aluminium plus alloy premium, fetched daily`) as the template for showing each individual assumption's source and freshness — this is already exactly what BW asked for ("what are the input assumptions on commodity prices") and it already exists, it just needs to live inside this new page rather than only in the Costing tab.

**3b. Other options.** Three kinds, each re-running the estimate live and showing the delta against the current one:
- *Different suppliers or scenarios* — this is the existing Compare Suppliers sourcing-options table and its "if you switch" cascading preview; carry it forward as-is.
- *Different cost models or estimate modes* — new: let the user pick an alternate cost model for the same part (e.g., see the stamping-model estimate instead of the casting-model one) and compare.
- *Different surrogate CAD* — new: let the user pick a different matched/candidate geometry as the basis for the estimate (e.g., "estimate off geometry 2 instead"), reusing the ranked-candidate list pattern already built for physical-similarity matching (name, score, key metadata) rather than inventing a new selector.

**3c. Price volatility info.** Already built — the FX/market volatility chart and price-band behavior from Compare Suppliers carries forward unchanged.

## 4. Confidence needs to reflect input maturity, not just match quality

BW's notes draw a sharp line between production data (full 2D drawings, specs, negotiated POs, contracts) and pursuit-stage data (often just 3D CAD and informal notes — "paper napkins," no 2D or specs). Cost-model confidence should reflect this the same way the BOM already caps a no-CAD line's certainty at Estimated: a cost model that genuinely only needs a 3D model (BW names casting as an example) can run at a higher confidence tier on pursuit-stage data than one that needs 2D drawings and tolerance callouts it doesn't have yet. This should be a per-cost-model property, not a blanket rule, and it should surface in the same confidence badge already used everywhere else rather than a new indicator.

## 5. Electronics and mechanicals are genuinely different paths here

BW's notes draw this distinction clearly and it should stay visible in the design, not get flattened: electronics lines mostly auto-populate from purchasing, pricing, and contract data that's already structured and already connected — fast, high-confidence, close to today's "Actual" tier. Mechanicals lines are where the new pipeline in section 1 actually does work — slower, computed, genuinely needing the supervision this brief is building. The Cost Estimate page should flex by which path a line took: an electronics line's breakdown can be thinner (source, contract reference, done), while a mechanicals line shows the full cost-model reasoning chain from section 3a.

## What's explicitly out of scope for this pass

BW's notes raise two bigger questions that go beyond a single part's estimate page and shouldn't get designed as an afterthought here:
- **Multi-region / multi-scenario comparison** — the same pursuit costed out of different plants at different volumes (BW's inverter-from-North-America vs. gearbox-from-Europe example), sometimes reconciling 3–4 regional BOM prices into one pursuit. Nothing in the prototype today models parallel scenarios for one BOM line: this is a real structural question, not a page layout question, and worth its own round rather than folding in now.
- **Gap-to-target walk-back.** BW's core competitive question — "why is our number different from the OEM's, and is it volume, commodity, or pricing assumptions causing the gap" — is a comparison-and-decomposition view, not something this single-estimate page naturally holds. Worth a dedicated pass once this page exists to look at.

## Instructions for Claude Design

- Extend the row detail panel's PLM tab output to explicitly drive the cost-model routing decision in section 2, rather than sitting next to it as unconnected metadata.
- Design the machining-complexity/manufacture-method approximation (section 1, stage 3) as new work — first-order feature detection from CAD (machined surfaces, tapped holes, tolerance class) feeding directly into cost-model input fields.
- Design the cost-model routing decision using the standard computed-signal treatment: confidence score, reasoning shown, confirm/override action.
- Build the full Cost Estimate page under Compare Suppliers with the three sections above (estimate + breakdown, other options, volatility), reusing the existing sourcing-options table, "if you switch" preview, drivers display, and ranked-candidate list pattern rather than redesigning any of them.
- Make cost-model confidence reflect input-data maturity per cost model (3D-only vs. needing 2D+specs), using the existing confidence-tier badges.
- Flex the Cost Estimate page's content depth by path — electronics (thin, auto-populated) vs. mechanicals (full reasoning chain) — rather than one fixed layout for every line.

## Open questions

- Does Aaron have (or can get from BW) the actual ~15-input list GSM/engineering mentioned, or does this first design pass need to work from a placeholder input set for the machining-complexity approximation?
- Is the electronics/mechanicals split purely a difference in how much of the page populates, or does it need a visibly different page entirely?
- Multi-region/scenario comparison and gap-to-target decomposition are flagged as out of scope above — confirm that's right before either gets designed into this page's "Other options" section by accident.
