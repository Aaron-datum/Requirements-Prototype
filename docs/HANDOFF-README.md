# Datum FE prototype: handoff bundle

Everything Claude Code needs to build a front-end prototype of the Datum product. Start with `CLAUDE.md`.

```
CLAUDE.md                          Instructions for Claude Code: read order, rules, working agreement
README.md                          This map
docs/
  01-design-requirements.md        Full design requirements (Decided / Example / Prototype simplification)
  01-design-requirements.html      Same content as the published page, for viewing in a browser
  02-implementation-plan.md        Stack, architecture, routes, phased build with acceptance, stub registry
  03-domain-and-service-interfaces.ts   Domain types + Services interfaces (typechecks under strict)
  04-fixtures-spec.md              Fake data to build, derive layer over /data, determinism, validation
  05-decisions-log.md              Open questions with default assumptions
  diagrams/                        7 system diagrams (PNG)
  snapshots/                       33 screenshots + MANIFEST.md (real app, design mocks, v2 prototype)
  prd/                             3D CAD search PRD
  design-briefs/                   20 supporting briefs (BOM, cost, requirements, traceability, dashboard, PLM research...)
design-system/                     "Datum UI V1": README, tokens (colors_and_type.css), manifest, lint rules
reference/
  prototype-v2/                    RFQ to Test Plan v2 (Create workflows), cost wireframes, assets
  search-design-files/             CAD compare, file selection, homepage/new search, part vs assembly results
  catalogue/                       Bolt Finder prototype and Parts Catalogue canvas
data/                              Civic 1.5T example dataset (JSON), generators, validate.py
```

## What is not in the bundle

- The agentic AI architecture doc lives only in the Datum "Requirements workflow" project (`claude/agentic-ai-integration-architecture.md`). The requirements doc summarises it; it is not needed to build the FE prototype.
- No real CAD files, no HOOPS license, no PLM access. All of that is stubbed by design.

## Using reference files

The `reference/` HTML files are design and behaviour references from earlier design rounds. Open them in a browser to see intended interactions. Do not ship them or copy their inline data. Known problems in them (the v2 prototype's inline Turbocharger data, its top-nav-only shell, the "Exact Match" level in the part-vs-assembly data) are listed in plan section 9 and the decisions log.

## Suggested first message to Claude Code

> Read CLAUDE.md and follow it. Scaffold the project per docs/02-implementation-plan.md, complete Phase 0 including the kitchen-sink route, then continue phase by phase. Use the defaults in docs/05-decisions-log.md and append any new assumptions there.
