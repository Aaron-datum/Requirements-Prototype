# CLAUDE.md: Datum FE prototype

You are building a **front-end-only, clickable prototype** of the Datum product: 3D CAD Search, Parts Catalogue, Create (RFQ to costed BOM to approved test plan), and a low-fi Projects dashboard. All data is fake. Everything not yet designed is simulated behind typed service interfaces and marked on screen.

## Read in this order

1. `docs/01-design-requirements.md` is the product source of truth. Every area is tagged **Decided** (build exactly), **Example** (build the shape, not the values) or **Prototype simplification** (build a named stub). Diagrams are in `docs/diagrams/`, screenshots in `docs/snapshots/` (see `MANIFEST.md`).
2. `docs/02-implementation-plan.md` is how to build it: stack, architecture, routes, phases with acceptance criteria, stub registry, definition of done.
3. `docs/03-domain-and-service-interfaces.ts` holds domain types and the `Services` interface. Copy to `src/domain/types.ts` and implement stubs against it.
4. `docs/04-fixtures-spec.md` says what fake data to build and how to derive view models from `data/`.
5. `docs/05-decisions-log.md` has a default for every open question. Use the default; do not block.
6. `design-system/README.md` is the visual rulebook. `design-system/colors_and_type.css` has the tokens.
7. `docs/prd/` and `docs/design-briefs/` are deeper background. Read the one relevant to the screen you are building.
8. `reference/` holds the existing HTML design files and prototypes. They are **visual and behavioural references, not code to ship**. Open them in a browser; port the ideas into components.

## Non-negotiable rules

- **Design system.** Semantic tokens only; no hex values or raw colors in components. DM Sans and DM Mono, weight cap 500, radius 5px, no shadows, no gradients, spacing from the scale, Lucide icons. White, Tan and Dark themes via `data-theme`. Three densities. Skeleton loading, inline errors, success-only toasts. Color is never the only indicator.
- **Configurable, not literal.** Status labels, tones, PLM fields, similarity bands, Reuse Status, Conformance State and data-type values come from config (`AppConfig`). No component compares against a status string. Unknown raw values render as raw text with a neutral tone.
- **Three independent match-quality dimensions:** confidence, similarity, data type. One shared component renders them. **"Exact" is not a status.** A 100% match is a geometric duplicate (different file, same geometry) or a duplicate file.
- **Stubs are explicit.** Every simulated output is wrapped in `<Stub id="...">` and the service behind it is deterministic. `?showStubs=1` outlines them. Do not make a stub smarter than the plan says; do not build real CAD parsing, matching, HOOPS, PLM calls, auth or persistence.
- **One component per idea.** Table shell (Filters / Columns / Manage), side panel, bottom drawer, MatchQuality, FieldRenderer, audit entry. Never restyle per screen.
- **Audit is the record, toast is the feedback.** Confirming "Review required" gives "Confirmed" plus an audit entry with time and actor.
- **Do not implement as-is** anything in section 9 of the plan (v2 inline Turbocharger data, top-nav-only shell, "Exact" bands, etc.).

## Working agreement

- Work phase by phase (plan section 5). Each phase ends with passing typecheck, lint, unit tests and its Playwright acceptance flow. Commit at each phase with a clear message.
- Start with Phase 0 and the kitchen-sink route. Do not begin feature screens until the shared components exist.
- When ambiguous: the tag in the requirements doc wins, then the decisions log default, then the most configurable option. Append your assumption to `docs/05-decisions-log.md`.
- Screens must reproduce the intent of the matching snapshot or reference file, not pixel-copy dead code or placeholder data in them.
- Keep the repo runnable with `npm install && npm run dev` and no external services. Provide `npm run test`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`.
- Do not edit files in `data/` or `reference/`. Extend through `src/fixtures/extras/`.
- All data is fake. Never put real customer names or part data into fixtures beyond the example labels already present (for example the "Adient" tenant badge text, which is example content).

## Definition of done (whole prototype)

Every acceptance flow in plan section 7 passes in Playwright in all three themes; no hard-coded status strings; no hex colors in `src/`; `/dev/stubs` lists every stub with owner and screens; the Settings schema switch changes sidebars, columns, detail tabs and tones with no code change; the Civic dataset counts in the fixtures spec are asserted by tests; README in the repo root explains how to run, how stubs work, and how to swap a stub for a real service.
