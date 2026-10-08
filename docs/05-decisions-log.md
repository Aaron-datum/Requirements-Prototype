# Decisions log: open questions with default assumptions

Claude Code: do not block on any of these. Use the default, mention it in the PR description, and keep the behaviour configurable so a different answer is a config change. Aaron will confirm or override.

Status key: **Open** (needs Aaron), **Assumed** (default chosen, safe to build), **Resolved** (decided; listed so nobody reopens it).

## Needs Aaron's confirmation

| ID | Question | Default to build | Status |
|---|---|---|---|
| D-01 | Navigation shell. The v2 brief and the design system README describe a top bar with tabs (Search, Create, My Projects) and a breadcrumb strip. The search PRD and design mocks describe a left nav (Search, Create, My Projects, Settings) under a top bar. | Top bar (logo, tenant badge, Feedback, help, notifications, user menu) + breadcrumb strip + left nav with Search, Create, My Projects (tree), Settings. Matches the requirements doc, "Left nav (Aaron's decision)". | Assumed. Confirm. |
| D-02 | Are the five certainty tiers (Actual, Surrogate, Estimated, No match, Search failed) example values of the data-type dimension, or a separate vocabulary? | Example values of data type, from config. | Assumed. Confirm. |
| D-03 | Where do geometric duplicate and duplicate file surface in a row? | A chip next to the data-type chip (labels "Geometric duplicate", "Duplicate file"), plus text in the Similarity tab. No "Exact" wording anywhere. | Open. |
| D-04 | Mapping agent versus per-PLM connectors. | Prototype reads canonical JSON; `MappingAgent` interface exists but is unused. Settings schema picker simulates different tenants. | Assumed. |
| D-05 | Similarity cutoffs (60% prototype floor, 58 and 55 in the dataset). | Config values: bands High 85, Medium 70, Low below 70; surrogate floor 58, estimated floor 55, test-match floor 50. All editable in `appConfig.ts`. | Assumed. |
| D-06 | Compare alignment: block or warn when under-constrained; inferred constraint type or user-chosen. | Warn, do not block. Inferred type shown as a suggestion the user can change. | Open. |
| D-07 | Two confidences on one requirement (transfer 71% in step 06, computed 78% in 06c). | Show both with different labels ("Transfer confidence", "Computed confidence") and a "why" popover. | Open. |
| D-08 | Standing highlight on dangerous rows (Unchanged text, Changed driver). The code highlights every such row; the brief says only the selected row. | Standing highlight on every dangerous row, plus text "Driver changed", not color alone. | Open. Verify visually. |
| D-09 | Requirement counts (244 extracted, 98 downstream, 571 older docs). | Show extracted vs in-scope with a one-line explanation of the reduction ("scoped to parts in this BOM"). | Assumed. |
| D-10 | Edge vocabulary for impact map and block diagram. | Use the block-diagram spec's schema; add Contradicts and Supersedes types to the type union but do not render them in v1. | Assumed. |
| D-11 | Dashboard third zoom tier name ("HW level"), overflow table shell, source of "Where you left off". | HW level; shared TableShell; most-recent items from in-memory history. | Open. |
| D-12 | Is "change suppliers" a real action that re-prices and re-sources? | Read-only list. The button is present but disabled with a tooltip. | Open. |
| D-13 | Is ADV P&R one plan or a program-wide container? | One plan per approval, with a configurable label (`planLabel`). | Open. |
| D-14 | Requirements taxonomy: subfolders like the BOM, or hierarchy columns. | Hierarchy columns (subsystem, linked part). | Open. |
| D-15 | Should evidence linking propagate like Driven-by confirmation? Multi-select impact comparison? | No propagation; single-node impact only. | Open. |
| D-16 | Owner earlier in the flow; severity source. | Dataset owner and severity shown from step 05 onward. | Open. |
| D-17 | Does severity modulate the autonomy gate? | Gate keyed by data type only; severity shown but not used. | Open. |
| D-18 | Catalogue data source and real facets. | Fixture-derived facets. | Assumed. |
| D-19 | Stale references and unconfirmed matches: should they look different? | Yes: unconfirmed shows "Review required" status; stale shows last-verified date in the "why" popover. No separate color. | Open. |
| D-20 | Weighting from five similarity dimensions to one percentage. | Equal weights, fixture-supplied totals; weighting not exposed. | Open (AI). |

## Added during the build (assumptions made without blocking)

| ID | Question | Default built | Status |
|---|---|---|---|
| D-21 | The bundle's `design-system/` is an older export (DM Mono, 11 to 12px). A newer `ui-design-current` export (IBM Plex Mono for data, 15px body, 13px floor, 36px buttons, 40px rows, bordered status tokens, alignment rules) was supplied separately and is the one Aaron reviewed. | Newer tokens are in `design-system/colors_and_type.css`; the bundle copy of the old file is replaced. App-level overrides (calmer dark-mode green, scrim, UI scale) live in `design-system/datum-overrides.css`, outside `src/`, so components stay hex-free. | Assumed. Confirm. |
| D-22 | "Search on" opens a new tab, and a decision action there (Select as surrogate) must be visible back in the workflow tab, but state is in memory. | The audit trail and recorded decisions (the "ledger") are mirrored to `localStorage` and synced across tabs. Everything else is in memory. Reset clears it. | Assumed. |
| D-23 | The bundle removes locked and upsell workflows ("Unlock more workflows") that an earlier design round had. | Removed. Create lists BOM Creation, Warranty Analysis and Part Replacement; the last two open a "not in the prototype" page. | Resolved by the bundle. |
| D-24 | No login screen in the routes list. | No login. The user menu shows the fixture user (Aaron Keller) and a disabled Log out. | Assumed. |
| D-25 | Info density only changed row heights. | Density is a global UI scale (Comfy 112%, Default 100%, Compact 88%, via CSS zoom on the app root) plus table row tokens. Every table obeys it; there is no per-table density. | Assumed (Aaron asked for whole-UI scaling). |
| D-26 | Repo layout: the earlier JS prototype and handoff folder. | Moved to `legacy/` for reference. The new TypeScript app is at the repo root. | Assumed. |

## Resolved (do not reopen)

- Left-nav IA; Create replaces Workflows; Feedback modal creates a Jira ticket in the beta.
- Three independent match-quality dimensions: confidence, similarity, data type. "Exact" is not a status.
- "Review required" is a workflow approval status. Confirming sets "Confirmed" and writes an audit entry (time, who).
- Row actions: Compare; PLM link (disabled in prototype); Search on (opens Define in a new tab); decision actions whose label and effect come from the workflow context.
- Catalogue: tree plus filters, filters narrow the tree; compare in two forms (dual pane, aligned table); Use This Part is a context-driven decision action.
- PLM schema, Reuse Status, Conformance State and tones are configurable per company and data source.
- Fake example data everywhere. Prototype state is in memory.
- Locked or upsell workflows and "Found It" button removed.

## How to add to this log

When you make an assumption not covered here, append a row with the next D-number, your default, and the file(s) it affects. Keep the default behind config where possible.
