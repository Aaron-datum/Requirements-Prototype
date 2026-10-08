# Requirement → test mapping — design update request

Covers the "Review requirement → test mapping" screen (step 05 in the stitched `RFQ to Test Plan.dc.html` prototype) against the four goals it needs to hit: understand what requirements need testing (new, or changed with no surrogate data), understand where each came from and see the actual requirement text, see and drill into an existing test if one covers it, and see why a test was matched. The Requirement trace screen later in the flow (`2b`) already solves several of these for its own table — this brief pulls those solutions forward rather than reinventing them, and flags the one piece (test detail) that's a genuine gap nowhere in the prototype yet.

Worth naming up front: this screen and Requirement trace show essentially the same underlying data — a requirement, its source, its change state, its associated test — at two different points in the flow (mapping proposes it, trace confirms and tracks it long-term). They should be designed as one component reused twice, not two independently-styled tables, so a requirement looks and behaves the same whether the user reaches it from step 05 or later from Requirement trace.

## 1. Surface new-vs-changed-no-surrogate at the row level, one vocabulary

Today this only shows up once a row is opened in the panel, as two pills — "New geometry" and "Text · New" — that read as one signal but are actually two different axes wearing the same style: "New geometry" is the BOM line's carry status, "Text · New" is the Text axis already defined in `requirements-tracing-design-ideas.md` (New / Unchanged / Changed, against the prior version). Add a small badge at the table-row level using the Text vocabulary specifically — not the BOM carry-status language — so a user can scan the table and tell at a glance which requirements are new vs. changed-with-no-surrogate without opening each one. Keep it visually distinct from the BOM-line pill so the two axes don't collapse into each other, same rule as everywhere else in the project.

## 2. Source type + inline requirement text — reuse the Requirement trace panel pattern

The panel currently shows only a bare citation (`REC-10431 · SOR-TC-26 §6.2`) — no source type, no way to read the actual requirement language without leaving the app. Requirement trace's panel already solved this: it opens on a "REQUIREMENT" section with the literal clause text first (`Center housing oil leak-down ≤ 2 mL/h at rated oil feed pressure, 150 °C.`), citation underneath. Bring that same section into this panel, ahead of "WHY THIS TEST."

Pair it with a source-type tag — RFQ / Carryover / Internal / Supplier / Mfg / Regulatory / Program, the vocabulary already established on the BOM's "Requirements driving part selection" table. Note: Requirement trace doesn't have this tag yet either (flagged in `requirement-trace-table-cleanup.md`, item 2) — worth adding it once and having it land on both screens together, rather than shipping it here first and porting it later.

## 3. Make the candidate test clickable, and design where it goes

The candidate test card (`Thermal shock cycling · DV-TC-044 · OEM DVP line 44 · 92%`) shows no visible affordance that it's interactive, and there's no test-detail screen anywhere in the prototype to click into — checked across the zip, this is a real gap, not something to reuse. It needs: a click affordance on the card, and a destination showing at minimum the test procedure/method, run history (pass/fail, dates, which programs it's run on), and which other requirements currently reference it.

Build this once and reuse it in two places — this candidate-test card, and the "Associated test" panel section already specced for Requirement trace (`requirements-tracing-design-ideas.md`, panel section 4: the same evidence-card pattern, `TR-2208 · Slide effort, 20 samples · max 37.2 N · pass · date`). Both are pointing at the same missing screen; design it once.

## 4. Why this test was matched — already right, keep as-is

"WHY THIS TEST" with the AI-inferred tag and reasoning bullets (`Same failure mode`, `Cycle count matches template`) is exactly the ask — no redesign needed. One thing to confirm rather than change: whether the AI-inferred tag's implied confidence and the candidate card's `92%` are the same number. If Requirement trace ends up needing the confidence-consistency fix flagged in its own cleanup doc (item 4 — Driven-by scores shown inconsistently), check whether this screen's matching logic has the same ambiguity before it spreads.

## Instructions for Claude Design

- Add a row-level badge using the Text vocabulary (New / Unchanged / Changed) from `requirements-tracing-design-ideas.md`, visually distinct from the BOM-line carry-status pill (`New geometry`), on both the table row and the panel header.
- Add a "REQUIREMENT" panel section showing the literal clause text, reusing the section already built for Requirement trace's panel, placed ahead of "WHY THIS TEST."
- Add a source-type tag (RFQ / Carryover / Internal / Supplier / Mfg / Regulatory / Program, from the BOM's Compare Parts table) next to the citation, on both this screen and Requirement trace.
- Design a test-detail screen — procedure/method, run history, cross-requirement usage — and make it the click destination from both this screen's candidate-test card and Requirement trace's Associated-test section.
- Leave "WHY THIS TEST" as built; only confirm its implied confidence and the candidate card's percentage are the same figure, not two unexplained scores.
- Treat the requirement row/panel as one shared component across this screen and Requirement trace, not two separate designs, so the same requirement reads identically in both places.

## Open questions

- Is there a test library or test-record system of record this test-detail screen should pull from (the Adient test library referenced in this screen's header), or is run history/cross-requirement usage something Datum needs to compute and store itself?
- Should the row-level Text badge here use the exact same visual treatment as Requirement trace's TEXT column, or is a lighter-weight version appropriate here since this screen is a proposal step and Requirement trace is the system of record?
