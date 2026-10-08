# Datum Requirements Workflow — Claude Code handoff

Everything needed to move this prototype from Claude Design (static/interactive `.dc.html` mockups) to a real coded prototype. Target repo: `https://github.com/Aaron-datum/Requirements-Prototype`.

## What's in here

- **`prototype/`** — the latest Claude Design export, unmodified (pristine, as downloaded — original CDN script references, no local patching). Three `.dc.html` files:
  - `RFQ to Test Plan v2.dc.html` — the main stitched flow, 13 screens from RFQ intake through Approve & create test plan (the one to build from).
  - `RFQ to Test Plan.dc.html` — the prior version, kept for reference/diffing only.
  - `Cost Estimate Wireframes.dc.html` — an earlier lo-fi exploration round for the Cost Estimate page; mined for one idea (`Open Features` drill-in) not yet in the v2 build — see the consolidated brief, §3.
  - `_ds/` — the `ui-design-current` design-system bundle (tokens, type/color CSS) the prototype is built on.
  - `assets/`, `uploads/` — images referenced by the prototype.
  - `support.js` — Claude Design's runtime loader; pulls React/ReactDOM/Babel from CDN (unpkg) at load time. Needs a real internet connection to open directly; not required for Claude Code, which should treat the `.dc.html` files as a visual/behavioral reference to reimplement in real components, not as the literal runtime to ship.

- **`design-docs/`** — all 20 design docs from the project, in the order a new reader should go through them (see below). These capture every decision, open question, and piece of established vocabulary behind the prototype — read before assuming any screen's behavior from the `.dc.html` files alone, since several open questions (requirements taxonomy, severity scale, shell token set) are flagged as explicitly unresolved.

- **`data/`** — a complete example dataset (Civic-class 1.5T engine, 3 trims) built specifically so a real database can be seeded and the prototype wired to live data instead of static mockup content. Has its own `README.md` with full schema and foreign-key documentation, plus the generator scripts.

## Suggested reading order for design-docs/

Start with the standing decisions and the current state of the build, then go deep by topic:

1. `prototype-v2-consolidated-design-brief.md` — **read this first.** States what's already built and matching spec (don't redesign it), what's a genuine gap, and the standing decisions (shell, similarity vocabulary, column/filter rules) everything else assumes.
2. `design-refinement-navigation-tables-decisions.md` — the cross-cutting shell/table/decision-action system referenced throughout.
3. `rfq-to-adv-pnr-integration-guide.md` — how the BOM flow and the requirements flow were stitched into one prototype; useful background on why certain screens look the way they do.
4. `projects-dashboard-lofi-brief.md` — the one major gap (no landing dashboard) with a lo-fi spec ready to build from.
5. `civic-engine-example-bom-dataset.md` — the dataset's design rationale (read alongside `data/README.md`).
6. Everything else — screen-specific briefs and foundational research docs, useful as reference when a specific screen's behavior or vocabulary needs grounding:
   - `cost-estimation-design-brief.md`
   - `requirement-to-test-mapping-design-request.md`
   - `requirement-trace-table-cleanup.md`
   - `requirement-trace-carryover-review-updates.md`
   - `assembly-to-bom-creation-design-brief.md`
   - `requirements-tracing-design-ideas.md`
   - `validation-standing-redesign-ideas.md`
   - `program-focused-requirements-lofi-brief.md`
   - `bom-detail-view-lowfi-brief.md`
   - `bom-flow-notes-v1.md`
   - `block-diagram-traceability-design-brief.md`
   - `block-diagram-vs-traceability-diagram-spec.md`
   - `confidence-provenance-design-principle.md`
   - `user-stories-v1.md`
   - `adient-tdm-sor-summary.md` — signed client source-of-truth; grounds a lot of the vocabulary (TDM, K-PAC ID, Conformance State) used elsewhere.
   - `plm-data-source-research.md` — background on the client-side systems (Aras/Windchill/DOORS/Polarion/Teamcenter) this eventually integrates with.

## A few things worth knowing before starting

- **Two design systems existed at different points** (`datum-ui-v1-design-system` on the BOM side, `ui-design-current` on the requirements side) — this is resolved: `ui-design-current` is the standard, and the v2 prototype already builds on it exclusively.
- **Known open gaps**, in priority order per the consolidated brief: no dashboard/landing page yet (biggest structural gap — `projects-dashboard-lofi-brief.md` has the spec), requirements taxonomy undecided, the "dangerous case" row highlight (Text=Unchanged + Driven-by=Changed) isn't decoupled from row-selection state, Driven-by confidence-score display is inconsistent, severity has no source anywhere yet, owner is only shown on the final Approve screen.
- **The example dataset's Si program is the one to wire first** — it's the "active RFQ" with surrogate search, cost routing, and a mix of resolved/open test runs; LX and Sport are the already-in-production evidence sources it searches against.
