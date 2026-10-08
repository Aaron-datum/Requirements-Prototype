# Datum front-end prototype

A front-end-only, clickable prototype of the Datum product: 3D CAD Search, Parts Catalogue, Create (RFQ to costed BOM to approved test plan) and a low-fi Projects dashboard. **All data is fake.** Everything not yet designed is simulated behind typed service interfaces and marked on screen. Start with `CLAUDE.md` for the build rules and `docs/01-design-requirements.md` for what each screen is for.

## Run it

```
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then a static production build in `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | oxlint with the design-system adherence rules, plus a check that `src/` has no raw colours, fonts, shadows or gradients |
| `npm run test` | Vitest: unit, component, fixture validation, stub usage |
| `npm run test:e2e` | Playwright acceptance flows (builds and serves the app; set `PW_PORT` to use another port) |

No external services are needed. Prototype state is in memory, except the audit trail and recorded decisions, which are mirrored to `localStorage` so a decision made in a "Search on" tab shows up in the workflow tab. **Reset state** in the Dev toolbar clears everything.

## Where things are

```
src/app            routes, providers          src/config       appConfig.ts (schemas, vocabularies, bands, thresholds), workflows.ts
src/components     shared components          src/services     Services context and one stub per StubId (stubs/)
src/features       one folder per area        src/fixtures     Civic derive layer, extras/ (new fake data), rng
src/domain         types.ts (service seams)   src/stores       UI prefs, ledger (audit + decisions), projects, toasts
design-system/     tokens and rulebook        docs/            requirements, plan, interfaces, fixtures spec, decisions
data/              Civic 1.5T dataset (read-only)   reference/   earlier design files (reference only, never shipped)
legacy/            the earlier JS prototype and handoff, kept for reference
```

Route map: `/` Home · `/search/new|files|define|results|compare` · `/catalogue` · `/create/bom/<step>` · `/create/requirements/<step>` · `/projects` · `/settings` · `/dev/kitchen-sink` · `/dev/stubs`.

## How stubs work

Every place a screen shows simulated output wraps it in `<Stub id="matching-engine" note="...">`. The service behind it is a pure, seeded stub in `src/services/stubs/`, so the same click always gives the same result. Add `?showStubs=1` (or use the Dev toolbar) to outline every simulated element, and open `/dev/stubs` for the legend: each stub, who would own the real component (FE, BE, AI), what the prototype does instead, and which screens use it. A test fails if a screen calls a simulated service without rendering the matching `<Stub>`.

## How to swap a stub for a real service

1. Find the interface in `src/domain/types.ts` (for example `GeometricEngine`, `CatalogueService`, `CostModelService`).
2. Implement it in a new file and return it from `createServices()` in `src/services/index.ts` in place of the stub. Screens reach services through `useService('engine')`, so no screen changes.
3. Remove or keep the `<Stub>` wrappers where the output is still partly simulated, and update the registry in `src/components/stub/registry.ts`.

Statuses, field names, PLM schemas, similarity bands, thresholds and tones are configuration (`src/config/appConfig.ts`), not code. **Settings → Data schema** switches between two tenant profiles (Company A, Adient-like, and Company B with renamed and dropped fields, different status tones and one added field) and the filter sidebars, columns, detail tabs and tones change with no code change.

## Design system

`design-system/colors_and_type.css` holds the tokens (White, Tan, Dark via `data-theme`; DM Sans for names and prose, IBM Plex Mono for numbers and IDs; 5px radius; no shadows or gradients; weight cap 500). `design-system/datum-overrides.css` layers app-level overrides (calmer dark-mode green, UI scale). Info density is a global UI scale: Compact, Default and Comfy scale text, controls and spacing together and every table obeys it.

## Decisions

`docs/05-decisions-log.md` lists every open question with the default that was built, plus assumptions added during the build. Per-area notes: `docs/decisions/`.
