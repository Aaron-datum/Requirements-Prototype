# Screenshot manifest

All JPEG, quality ~72. Prototype shots are full 1440x900 viewports scaled to 1200 wide.

| File | Pixels | Bytes | Description |
|---|---|---|---|
| catalogue_bolts.jpg | 1200x711 | 39838 | Catalogue concept, 02 Drill to Bolts: Fasteners > Bolts type cards. |
| catalogue_compare.jpg | 1178x701 | 57170 | Catalogue concept, 05 Compare dual pane: HX-M16-120-A2 vs SH-M16-110-88 with field match highlighting. |
| catalogue_compare_table.jpg | 818x532 | 32752 | Catalogue concept, 05b Compare aligned table: field-by-field comparison table. |
| catalogue_main.jpg | 1200x711 | 48477 | Catalogue concept (Parts Catalogue.dc.html), artboard 01 Catalogue landing: category cards and tree. |
| catalogue_table.jpg | 1200x685 | 78912 | Catalogue concept, 04 Table and filters: M16 bolts table, filters sidebar, part detail drawer, Compare 2 Selected. |
| proto_01.jpg | 1200x750 | 77137 | Prototype v2, screen 01 RFQ intake: package received, CAD to BOM / Documents to Requirements cards, connected sources, package contents table. |
| proto_02.jpg | 1200x750 | 55142 | Prototype v2, 02 Assembly tree: select components for the BOM, blank BOM summary panel, Create BOM. |
| proto_03.jpg | 1200x750 | 110520 | Prototype v2, 03 BOM review (after Run Surrogate Search): 14 lines priced, cost/risk/reuse KPIs, match-certainty bar, detail drawer for Compressor wheel with similarity. |
| proto_03b.jpg | 1200x750 | 87881 | Prototype v2, 03b Compare parts: BOM line CW-302-B vs surrogate CW-288-A, similarity breakdown, requirements driving selection. NOTE: the two 3D viewer panes render empty (no model in the prototype). |
| proto_03c.jpg | 1200x750 | 50046 | Prototype v2, 03c Requirement traceability (REC-10417): swim-lane timeline source/part/test, selected-event panel. Right side of the graph is clipped at 1440px (prototype layout). |
| proto_03d.jpg | 1200x750 | 84689 | Prototype v2, 03d Cost estimate: Compressor wheel machined-billet estimate $142.00, routing confidence, cost line breakdown, trace panel. |
| proto_04.jpg | 1200x750 | 79310 | Prototype v2, 04 Program composition: New / Carryover / Uncertainty columns with Generate Test Plan. |
| proto_05.jpg | 1200x750 | 98680 | Prototype v2, 05 Requirement to test mapping: requirement table with proposed tests, confidence, Accept/Reject, detail panel. |
| proto_06.jpg | 1200x750 | 104224 | Prototype v2, 06 Carryover review: 9 requirements needing decision, flagged list, candidate evidence ranked. |
| proto_06b.jpg | 1200x750 | 73577 | Prototype v2, 06b Impact map (REC-10512): node graph of linked records, hop depth / direction controls, affected downstream list. |
| proto_06c.jpg | 1200x750 | 107881 | Prototype v2, 06c Requirement trace: filterable trace table with detail drawer and full carryover chain strip. |
| proto_07.jpg | 1200x750 | 76206 | Prototype v2, 07 Approve test plan: carried/new/open counts, still-open list, plan name form, acknowledgement and approve button (disabled until acknowledged). |
| proto_testdetail.jpg | 1200x750 | 64582 | Prototype v2, Test detail (DV-TC-044 Thermal shock cycling), opened from Test Mapping: procedure, run history, referenced-by requirements. |
| real_adient_results.jpg | 1200x532 | 49300 | Real Adient results screen (part_vs_assembly/uploads/pasted-1779382701363-0.png): seat CATProduct results with PLM data panel. |
| real_cad_compare_1.jpg | 1200x649 | 58367 | Real CAD Compare, Alignment state: query vs result file panes, constraints list (cad_compare/uploads/pasted-1784307334938-0.png). |
| real_cad_compare_2.jpg | 1200x649 | 38664 | Real CAD Compare, Comparison/overlay state: red query-only, blue overlap, green result-only (cad_compare/uploads/pasted-1784307348359-0.png). |
| real_compare_comparison.jpg | 1200x524 | 43437 | Real search UI, Compare: side-by-side query vs result models with assembly trees and measurement label (video frame_025). |
| real_compare_measurements.jpg | 1200x524 | 33425 | Real search UI, Compare: Measurements tab with area measurement tree (video frame_029). |
| real_compare_plm.jpg | 1200x524 | 44165 | Real search UI, Compare: PLM metadata tab side-by-side (video frame_027). |
| real_define_assembly.jpg | 1200x524 | 34009 | Real search UI, Define screen: Assembly tab with part tree and 3D viewer (video frame_006). |
| real_define_measurement.jpg | 1200x524 | 34534 | Real search UI, Define screen: Measurements tab with an Area measurement captured (video frame_013). |
| real_define_plm.jpg | 1200x524 | 39459 | Real search UI, Define screen: PLM tab part metadata (video frame_007). |
| real_file_details_drawer.jpg | 1200x524 | 71966 | Real search UI, Files list with File details drawer open for prop_grouped_1.step (video frame_004). |
| real_files_list.jpg | 1200x524 | 63987 | Real search UI, Files list with filters sidebar (video frame_001). |
| real_new_search.jpg | 1200x603 | 38789 | Real homepage New Search screen: four modality cards plus recent searches (homepage_search/uploads/pasted-1784661751404-0.png). |
| real_results.jpg | 1200x524 | 30867 | Real search UI, Results table with source part and match at 73% (video frame_016). |
| real_results_measurements_tab.jpg | 1200x524 | 36425 | Real search UI, Results: expanded row, Measurements tab (video frame_021). |
| real_results_plm_tab.jpg | 1200x524 | 46334 | Real search UI, Results: expanded row, PLM Data tab (video frame_019). |

Total: 33 files, 1990752 bytes (1.99 MB).

Notes
- Prototype screens were driven by calling the component go(screen) method from Playwright; Surrogate search was run before the 03 series so BOM data is populated. Test detail was set to DV-TC-044 reached from mapping.
- 03b Compare parts: 3D viewer panes are blank in the prototype itself.
- Video frames 024 (Compare while loading, "Waiting for model") were not used.
- All 13 prototype screens rendered; none failed.
