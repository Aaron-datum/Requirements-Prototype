# Demo script

The acceptance flows from `docs/02-implementation-plan.md` section 7, in a walkable order. Each is also a Playwright test in `e2e/`. Start with `npm run dev`, then **Dev toolbar → Reset state**.

1. **Home.** Hero search, three quick actions, "Recent (this session)" strip. Press Ctrl/⌘+K to focus the search.
2. **Flow A: Files first.** New Search → Part to Part → Files → filter by Reuse Status (the chip appears) → open File Details → Search from this file → Define → capture an Area measurement → Run Search → Results → expand the first non-source row → Compare → Measurements tab.
3. **Flow B: search by number.** Home search, type a part number in a different case with a space, Released first → Define → Results.
4. **Assembly modalities.** Run Part to Assembly, Assembly to Assembly and Part-in-Assembly to Part once each. The last shows the parent assembly column.
5. **Results details.** Source Part pinned at 0%; a geometric duplicate and a duplicate file (no "Exact" anywhere); "Manual measurement required" with its call to action; Search on opens a new tab at a URL that reproduces the state.
6. **Parts Catalogue.** Fasteners → Bolts → filter M16 (the tree responds) → select two → Compare in the dual pane and the table form.
7. **RFQ to approved plan.** Create → BOM Creation → Intake → Assembly tree → Create BOM → Run Surrogate Search → open a line → Compare parts → Cost estimate → Composition → Test mapping (accept 3, reject 1) → Carryover review (confirm one flagged item and see the audit entry) → Impact map → Requirement trace (three dangerous rows highlighted) → Approve with acknowledgement.
8. **Decision action round trip.** From BOM review open a surrogate line → Search on (new tab) → Select as surrogate → back in BOM review the line has changed and an audit entry is present.
9. **Configurability.** Settings → Data schema → Company B. The filter sidebar, columns, detail tabs and status tones change. Open `/dev/kitchen-sink` to see one record rendered under both schemas.
10. **Themes and densities.** Cycle White, Tan, Dark and Compact, Default, Comfy on Results and BOM review. Nothing unreadable, no layout breaks.
11. **What is simulated.** Open `/dev/stubs`, then add `?showStubs=1` to any screen.
