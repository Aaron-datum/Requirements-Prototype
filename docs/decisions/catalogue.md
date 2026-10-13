# Parts Catalogue: assumptions (Phase 4)

Defaults taken where the docs are silent. None of these edit `docs/05-decisions-log.md`. D-18 (fixture-derived facets) applies throughout.

| # | Question | Assumption |
|---|---|---|
| C-01 | Which fields are administrative (not counted as a difference)? | Source, PLM ID, Revision, Status. Listed in `src/config/catalogueConfig.ts` (`CATALOGUE_ADMINISTRATIVE_FIELDS`). They show under All Fields, in their own block, and are excluded from "N of M fields differ" and from Differences Only. Worked pair: 9 of 15 differ. |
| C-02 | Two missing values, or one missing? | Both missing counts as equal; a value against a missing value differs and shows a dash. |
| C-03 | Counts for Screws, Nuts, Washers and the other categories. | Typed, catalogue-wide, flagged in `tree.json` as not backed by rows. Bolts and every thread-size node are computed from the 100 rows; Fasteners is the sum of its children. Under an active filter nodes without rows count 0 and are dimmed (not hidden). |
| C-04 | Thread sizes in the tree. | Bolts has one child per thread size (breadcrumb `Fasteners > Bolts > M16`). A size node is an alias of the Bolts page with the thread facet set; `/catalogue/bolts-m16` redirects to `/catalogue/bolts` with the filter in the URL. Selecting Bolts clears the thread facet; other facets persist. |
| C-05 | Where does state live? | In the URL: the table's `t_catalogue` param (filters, sort), `sel` (ticked parts), `part` (open drawer), and on compare `a`, `b`, `more`, `form`, `rows`, `from`. Back from Compare restores filters, selection and sort. Page number is not restored. The workflow context (`ctx`, `ret`) travels on every catalogue URL. |
| C-06 | Compare arming. | Compare needs 2 or more ticked parts that are visible under the current filters. Hidden ticked parts stay ticked, are reported ("N hidden by filters") and do not arm. 2 parts open the dual form; 3 or more open the table form. The dual form always shows the first two and says so. |
| C-07 | Length and units. | Millimetres everywhere (facet, table, drawer, compare, CSV). The mock's "requirement target 12.0 cm" marker is not built. Length is a range facet. |
| C-08 | Free-text parse. | Fixture synonym table plus automatic matching of facet option values (`M16`, `10.9`, `A2-70`, `ISO 4014`). "stainless" selects both stainless grades (A2-70, A4-80). A bare number is a length. Leftover words filter the part number. |
| C-09 | Default sort. | Rows ship ordered by length, then thread; the header reads "sorted by length" until the user sorts. |
| C-10 | Search on for a catalogue part. | Opens `searchOnHref(partNumber, ctx)` in a new tab, using the part number as the file id. |
| C-11 | Open in Viewer. | Opens a modal with the shared ViewerPlaceholder (`cad-viewer` stub). |
| C-12 | Program Usage facet. | The part's primary program (one value per part). The full Used On list is in the drawer. |
| C-13 | Reuse Status values. | Preferred, Approved, Restricted, Review, Obsolete. All already exist in both tenant profiles, so `appConfig.ts` is unchanged. |
| C-14 | CatalogueService extras. | `src/domain/catalogue.ts` declares `CatalogueServiceFull` (live tree, parse, part lookup, pairs). The stub implements it; screens read it through `useCatalogue()`. `docs/03` and `src/domain/types.ts` are untouched. |
| C-15 | Save View. | Goes through the `persistence` stub with the same meta the sidebar's Manage tab uses, so saved catalogue views appear in its list. Export CSV is a real download of the filtered, sorted rows. |
