# Decisions: Home and Projects dashboard (Phase 7, first half)

Assumptions made without blocking. Each keeps behaviour in config (`src/fixtures/extras/projects/projectData.ts`) where possible.

| ID | Question | Default built |
|---|---|---|
| P-01 | D-11 third zoom tier, overflow shell, "Where you left off" source | Tier is "HW level" (Program, Part, HW level). Overflow table is the shared `TableShell`. "Where you left off" merges ledger audit entries, `useProjectStore` recents and saved items (live first, newest first) with three seed activity rows from the stub. |
| P-02 | `/projects` behaviour | Lists projects (shared TableShell, no sidebar); each row opens its Project overview. The Civic Si project is the only one with dashboard data; the other two projects show the same shell with empty states and store counts. |
| P-03 | Due date source | Inherited from the scope: each action row takes the due date of its primary output (BOM 2026-10-30, mapping 2026-11-06, carryover and trace 2026-11-13, plan 2026-11-20); in Output overview it takes that output's date. Tooltip says "Inherited from ...". |
| P-04 | Severity and owner (D-16) | Requirements use dataset severity and owner. BOM lines have none, so severity comes from `DASHBOARD_RULES.bomSeverityByMatchType` (weak surrogates under 65% bump to High) and owner is the Si program owner. |
| P-05 | Urgent vs review | Urgent = severity in `urgentSeverities` (Critical, High) or kind in `urgentKinds` (dangerous case, No match). Everything else is review. |
| P-06 | When is an action row resolved | A ledger decision whose key ends in `:<bom_line_id or req_id>` removes the row (matches `decisionKey` for Select as surrogate). Phase 6 should key requirement decisions the same way to be reflected here. Plan approval is a ledger key starting `approve-plan:`. |
| P-07 | Output overview scope | Seven outputs for the Civic project (matching the nav count). Each action kind belongs to a list of outputs (`KIND_OUTPUTS`); an output overview shows only its rows. Output scope drops Program zoom and limits metrics (BOM-type outputs: certainty, price, diversity; test-type: timeline). Uploaded and missing inputs are fixtures per output, shown under "Show details" in the status bar in both scopes. |
| P-08 | Data-viz boxes | Three boxes that cycle together: controls (zoom x metric x form), the visualisation, and a legend with unit and totals. State is in the URL (`zoom`, `metric`, `form`). CSS bars, values printed on bars, text legend, a table form and an action-items form; timeline at Part zoom is a dated marker per requirement. |
| P-09 | Connections | Merge of `plm.syncState()` and `dashboard.connections()`; shown as "n of m connected" plus names that are not connected, with the full list under details. No partial states invented. |
| P-10 | Cmd/Ctrl+K | `useSearchShortcut` (in the Home feature) is mounted once in `AppShell`: focuses the hero search; from other screens it opens `/?focus=search`. |
| P-11 | Recent outcome pill | Local `OUTCOME_VOCAB` (pass, warn, fail) with labels from the vocabulary; store recents carry `meta.requirements`, `meta.results`, `meta.outcome`. |
| P-12 | Dashboard stub extras | `DashboardServicePlus` extends `DashboardService` with `activity`, `recents`, `aggregate`, `vizActions`, `progress`, `summary`; `actionItems` takes optional `{outputId, resolved}`. Screens cast `useService('dashboard')` to it. |
| P-13 | Outputs and Configurations lists | Fixture rows plus saved `project-item`s (Outputs) and saved views (Configurations) from the project store. |
