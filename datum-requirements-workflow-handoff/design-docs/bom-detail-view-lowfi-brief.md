# BOM Detail View — low-fi exploration brief

This breaks away from the step-by-step wireframe we just reviewed (upload → review tree → configure → generate) and focuses on what happens *after* a BOM exists: the view itself, and what a user finds when they click into a line item. Scope is workflow and information placement only — greybox fidelity, same spirit as the last round. The goal is a few genuinely different variants per surface to choose between, not a finished design.

## What we're designing — three surfaces

1. **BOM Overview / KPI / Table** — the landing view for a generated BOM. Successor to "Step 4" from the last round, but now folding in the overview/KPI/pricing ideas from `bom-flow-notes-v1.md` rather than just the bare table.
2. **Physical similarity drill-in** — click a line item to answer: is this a new part or carryover? Carried over from where? What's it closest to in production, and how similar? Needs a path to PLM data, CAD info, and a side-by-side comparison.
3. **Costing/supplier drill-in** — click a line item to answer: where's it made, by whom, what does it cost, how sure are we, and what happens if we change suppliers?

Both drill-ins start from the same table row — worth treating as one family with a shared shell rather than two unrelated screens.

## 1. BOM Overview / KPI / Table

**What it needs to answer at a glance**, pulling from the BOM-anatomy and KPI notes:
- What is this, top-level — program, assembly, owner, status.
- What's the shape of it — total cost, number of programs, supplier breakdown, certainty breakdown.
- Where does attention need to go — how many lines are confident matches vs. surrogates vs. estimates vs. unresolved; top costs; supplier/region concentration.

The last round's Step 4 table already seeds part of this (Cost, Manufacturer, Lead time, and a Confidence column reading `ACTUAL · 95%` / `SURROGATE · 88%` / `ESTIMATED · 72%` / `NO MATCH`) — that's a reasonable floor for the table tab, not a finished answer for the overview or KPI layer sitting above it.

**Variant prompts:**
- Does the certainty/confidence breakdown deserve to be a headline KPI (e.g. a donut or stacked bar: X% actual, Y% surrogate, Z% unresolved), or is a column in the table enough?
- Is KPI Dash a genuinely separate tab, or could the table view carry enough of a summary strip (counts in the toolbar, like the compact variant from the last round) that a dedicated dashboard becomes redundant?
- Where does "act on this" live — bulk-searching every `NO MATCH` row, re-running surrogate search after a supplier swap, exporting just the unresolved rows?

## 2. Physical similarity drill-in

**What it needs to answer**, pulling from the surrogate-search notes and the existing confidence/provenance and Similar-to work:
- New part, or carryover?
- If carryover or surrogate — carried over from where (what program, what part)?
- What's the closest thing already in production, and how similar, really? (Geometric duplicate — same geometry and material, only PN/supplier/cost differ, directly replaceable — vs. best surrogate — no exact match, ranked on geometry/manufacture complexity, material, supplier/location, order of magnitude.)
- What does the user actually look at to trust the match — the PLM record, the CAD geometry, a side-by-side comparison.

This is the same confidence/provenance and `Similar-to` territory already spec'd for the Traceability Diagram — worth reusing that vocabulary rather than growing a third one. The confidence tiers in the Step 4 table are a plausible starting point for the same badges here.

**Variant prompts:**
- Side panel that stays anchored to the table row, or a dedicated full-screen comparison with room for a real CAD viewer next to the spec table?
- How does "how similar" get shown — one score, a breakdown by dimension (geometry / material / supplier / order of magnitude), or both, tiered the way the confidence-provenance doc recommends?
- Where does the actual side-by-side CAD view live — an overlay, a split view, a toggle?
- What does this screen look like for a `NO MATCH` row — it can't default to a populated comparison, so does it become a search/empty state instead?

## 3. Costing/supplier drill-in

**What it needs to answer**, pulling straight from the pricing & uncertainty notes:
- Where is this made, and by whom (supplier, region)?
- What does it cost, and how sure are we — is the price a firm quote or an estimate, and how has that confidence decayed over time?
- What's driving the uncertainty — FX/tariff volatility, material market-price volatility, model-year long-term certainty?
- What happens if I change suppliers — what are the other options, what do they cost, how confident are we in each?

**Variant prompts:**
- A single-supplier detail view with an explicit "compare suppliers" action, or does any line item with more than one sourcing option default straight to a comparison table?
- How literal does the uncertainty visualization get — the sketched price-band-over-time / FX-volatility charts, or something simpler that matches the confidence badges already used elsewhere?
- Does redundancy/backup sourcing get its own visible status even before drilling in (e.g. "1 of 3 known alternates" on the row itself), or does it only surface once you're inside this view?
- Should this drill-in share a shell with the physical-similarity one, so moving between "why is this uncertain physically" and "why is this uncertain on cost" feels like one consistent pattern rather than two different tools?

## Shared constraints across all three

- Low-fi / greybox only — structure and information placement, not visual polish. Real hi-fi components come after a variant is picked.
- A few meaningfully different variants per surface, the way 2A/2B/2C were actually different layouts last round rather than restyles of each other.
- Reuse existing vocabulary rather than inventing new terms: the confidence tiers already in the table, and the Provenance vs. Confidence split from `confidence-provenance-design-principle.md`.

## Open questions to settle before or during variant-building

- Do the two drill-ins live as two tabs inside one shared side panel, or as genuinely separate entry points from the row?
- Is "change suppliers" a real action here (triggers a re-price / re-source), or read-only exploration for now?
- Does a `NO MATCH` or `FAILED` row route into these drill-ins at all, or does it go somewhere else entirely (a manual search flow)?
