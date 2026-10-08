# BOM Flow — Notes (v1)

Consolidated from five pages of handwritten notes (Aug–Sept 2026). This is a straight pull-together of what's in the notes, organized by theme, so it can be used as the source of truth for updating the current BOM workflow design/prototype screens — not a new spec layered on top. Where something connects to an existing project doc, that's called out in section 7.

## 1. Current pain points (what the new flow replaces)

- **The background file.** Today's workaround for not having a synced part catalog: a standing file of PNs and descriptions, with currency, pricing, supplier, and an index number (basically PN + plant location, which is what actually gets you correct pricing). Creating and maintaining it is slow — noted at roughly 2–3 weeks to update, 1–2 weeks to source. New parts get no real notice when they're approved, so the file lags.
- **FX rates and commodity indexes.** Both come from Finance, which introduces delay. BW has a source pulled monthly, but the customer-preferred number may need a different cadence (a 3-month average was floated). Teams often end up overriding a supplier's cost estimate manually.
- **Finding an existing or surrogate part.** Currently manual — "guestimated" on engineering judgment and manual recall. Electronics has cost-model sheets; mechanical has a complex estimation tool that takes a model (e.g., a casting) and spits out cost/pricing from geometry and input parameters, but it's not a systematic search.
- **NET BID** — pulls prices from Finance. Called out directly as slow, error-prone, and boring. Also flagged: can we predict future pricing with any certainty, and can we run sanity checks on prices automatically?

## 2. RFQ intake → testing plan workflow (walked through via an Adient RFQ example)

This is a distinct user flow, separate from the BOM data model itself — it's the process of turning an incoming RFQ into a testing plan.

**Diving into program-level detail:**

- **DV P&R** (design verification plan & report) — what tests need to be done, why/what requirement it traces to, whether it can use a similar/surrogate test, and the status of each test (progress, deadlines).
- **What tests are needed** — does this program/part already exist (carryover vs. new, is there a prior test plan)? What is the testing based on — supplier/OEM/manufacturing/regulatory requirements, internal best practices, or explicit requirements?
- **What's new vs. old** — is anything carryover? How close is the new part to the old one, and how confident are we in that closeness?

**The user flow itself:**

1. **Receive RFQ** — as 3D CAD, a drawing, or PDR only.
2. **Compare to historic** — via 3D CAD search, and against requirements/other RFQs.
3. **Extract requirements.**
4. **Compare differences** — geometric and requirements-based — to **identify unfilled/unknown requirements**: what needs to be tested, what's already met, what we're unsure about.
5. **Create a testing plan** — aligned to historic plans, with deadlines, milestones, and dependencies — and **link surrogates/sources**, i.e. traceability: link each requirement back to its source.

## 3. BOM data model — what a BOM line needs to carry

- **Variants/models on the same BOM sheet, as columns.** Columns get added ad hoc for programs, regions, or directors and can linger out of date — worth deciding whether these are customizable per view with a minimum required level, rather than free-for-all.
- **Carryover / similarity** (with or without prints/drawings available) — the core question is always "how much is similar, and how confident are we?"
- **Source region** affects timelines and prices — currency/price volatility, surcharges, and tariffs all add uncertainty on top of the base price.
- **What a part record needs, info-wise:**
  - Cost source (and its certainty), cost currency, source region, supplier
  - Building blocks: assembly, subassembly, part type
  - Materials, weight, volume, tooling faces (holes, cuts, etc.) — calculated elsewhere and cross-linked in, not owned here
  - Manufacture/tooling method
  - Pricing: current, future, and estimated
- **KPIs to know at a glance:** top costs, supplier regions, certainty/surrogate status, cost risk; what a part is made of, how much it costs to make, where it's made, and whether it's similar to something already in the system.
- Related open question the notes raise directly: sometimes requirements or needs are opaque, or the team's knowledge of the market is incomplete — worth being able to simulate scenarios, or surface something like "X% of the time, parts like this come from region Y."

## 4. Pricing & uncertainty

The BOM line's core columns: **Part Name | Quantity Info | Source Info | Price Info | Linkage** — with Price Info explicitly called out as bundling several factors, each carrying its own independent uncertainty.

**Sources of uncertainty sketched out:**

- **Estimate decay over time.** The further out a price estimate reaches, the looser it gets (sketched as confidence bands widening — roughly ±5% near-term vs. ±15% further out). Is the number a promise or an estimate?
- **Exchange-rate / tariff volatility.** Rates and tariffs fluctuate, and so do market prices as a result — the question to answer is how volatile the true price actually is, and whether that volatility should be shown back to the user.
- **Supplier-to-supplier variance.** Beyond price itself, are there other factors driving the choice (e.g., region restrictions)? How much redundancy/backup sourcing exists?

**Display idea from the sketches:** a color-coded certainty indicator on the price itself, something like `$XXX.XX · Y options · (range: $222.22–$222.22)`, with a flag when other sourcing options exist.

**What data feeds this** (noted as an incomplete starter list):

| Category | Field | Drives |
|---|---|---|
| BOM base info | Model year | Long-term certainty |
| | Supplier | Exchange rates, tariffs, volatility |
| | Material | Market price, volatility |
| | Price source | Certainty (a firm quote vs. a quoted estimate) |
| Programmatic / team knowledge | Sourcing requirements | Redundancy, options, source location |
| | Reuse components | Certainty (found via CAD search) |

**Where this needs to surface:**
- (A) In the part-detail sidebar, on the Pricing tab.
- (B) In the BOM visualization overview, as KPIs.

## 5. Screen anatomy (BOM view)

- **Header + summary info.** Info: program, assembly, owners, status. Summary: total cost, number of programs, supplier breakdown, certainty breakdown.
- **Tabs:** BOM Table | KPI Dash — plus a detail sidebar that opens for any line item, regardless of which tab you're on.
- **Table columns**, starting from BW key info:
  a. Cost — source, currency, certainty, region, supplier
  b. Sourcing — manufacturer, method
  c. Manufacture — material, tooling, complexity level
  d. Assembly level
- Columns are customizable (same filter-sidebar pattern used elsewhere), but the view also has/creates/learns adaptive defaults rather than starting blank every time.

## 6. Finding similar parts — this is what eliminates the background file

Two tiers of CAD search result, explicitly distinguished:

- **Geometric duplicates** — the part is physically identical: same geometry and material. What differs is PN, supplier, cost, etc. These are directly replaceable in a physical assembly.
- **Best surrogates** — no exact match exists, so the system finds the best estimate, ranked on: geometry/manufacture complexity, material, supplier/location, and order of magnitude.

This is what makes the background file unnecessary going forward:
- The system stays synced with the latest SAP parts directly.
- 3D CAD search finds geometric matches the team doesn't already know about.
- Finance numbers and commodity prices get fetched directly via API rather than pulled and staged manually.

## 7. Connections to existing project docs

- The certainty badge here (color-coded, quote-vs-estimate) is the same underlying idea as the confidence/provenance axes in `confidence-provenance-design-principle.md` — worth reconciling vocabulary rather than growing a second certainty taxonomy. "Quote vs. quoted estimate" reads as a provenance distinction; "how much the estimate has decayed over time" reads as the confidence axis.
- "Best Surrogate" here is the same relationship as `Similar-to` in `block-diagram-vs-traceability-diagram-spec.md` — same computed, scored, dashed-line treatment should apply.
- The Adient RFQ flow's "link requirement source" step is a `Derived-from`/traceability edge in the same spec — the testing-plan flow is effectively a Traceability Diagram use case with its own dedicated intake screens in front of it.

## 8. Open items visible in the notes but not yet resolved

- Are the program/region/director BOM columns freely configurable, or a fixed set with an escape hatch (parallels the open interface-subtype question in the Block/Traceability spec)?
- What cadence replaces the current quarterly FX/commodity pull — a rolling average, monthly, something event-driven?
- Where do "simulate scenarios" and "% of parts that come from region X" live — folded into the KPI Dash, or a separate analysis view?
