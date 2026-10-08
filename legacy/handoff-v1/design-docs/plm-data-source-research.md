# Data source research — Aras, Windchill, DOORS, Polarion, Teamcenter

Background research for the requirements workflow product: what each client-side system holds, how parts are keyed, and how reliably a Part Number (PN) can be used to join data across systems.

Full formatted version with comparison table, diagram, and sourced citations: https://claude.ai/code/artifact/dd464d73-d167-4721-9009-9b3a35841d07

## Bottom line

No cross-industry standard governs part-number format (not ISO/SAE; IATF 16949 requires *a* traceability system, not a specific scheme). PN is the best available cross-system key but is not reliable on its own — it must be treated as a probabilistic join, backed by a canonical part registry + per-source crosswalk table (standard MDM pattern), not a hard key. Schema also varies per client install for Aras and Teamcenter especially (both are heavily customizable), so the data layer needs to discover each tenant's schema rather than hardcode field names.

## System by system

**Aras Innovator** (PLM, low-code/configurable) — Parts/BOM live in Product Engineering; AVL/AML for suppliers; Quality module for CAPA/nonconformance; Change Management for ECR/ECO. No fixed "Test Plan" entity — usually custom-configured. Join key: `item_number` (business PN), stable across revisions via `config_id`; internal `id` GUID changes every revision, don't join on it. API: REST/OData (`/odata/Part`), OAuth2. No native OSLC.

**PTC Windchill** (PLM; pairs with RV&S/Codebeamer for ALM) — WTPart + BOM (WTPartUsageLink), AML/AVL suppliers, Change objects. Requirements/tests live in a *separate* PTC product (RV&S or Codebeamer), not Windchill. Join key: `Number` field on WTPart — verify per-client uniqueness rules; internal Object ID is not portable. API: Windchill REST Services (WRS), OData-based, ~30 domains — comparatively mature/consistent API story (matches the whiteboard's "PTC ... a little better" note). Requirements/test bridging needs PTC's own connector or third-party OSLC adapter.

**IBM DOORS / DOORS Next** (requirements management, not PLM) — Requirements + trace links (to test cases via IBM Engineering Test Management). No BOM/cost/supplier concept. No native PN field — if tracked, it's a custom attribute or buried in free text. Object ID/"Absolute Number" is only unique within a module. API: DOORS Classic uses DXL scripting, no REST API (export via CSV/ReqIF); DOORS Next exposes OSLC over REST (OAuth 1.0a). Real-world usage is often sparse — work drifts into email/Word, matching the concern about Cooper Standard.

**Siemens Polarion** (ALM — everything is a "Work Item") — Requirements, test cases, test runs/results, defects are all Work Items sharing one model, which makes it more structurally consistent client-to-client than Aras or Teamcenter (matches the "Polarion ... a little better" note). No BOM/parts — Siemens pairs it with Teamcenter for that via a dedicated connector. No native PN field; Work Item ID (`PREFIX-###`) is project-scoped, not a part identifier — PN would need a custom field or external link. API: REST API (JSON:API, OpenAPI-documented) is current; legacy SOAP still around. OSLC only via third-party connectors (e.g. SodiusWillert).

**Siemens Teamcenter** (PLM, deeply customized via BMIDE) — Confirmed live in client environments per interview notes ("goes to Teamcenter, goes to CAD"). Item/Item Revision + BOMLine product structure; Change Manager for ECR/ECN/ECO; Quality/nonconformance is a separately-licensed module, often not enabled. Join key is contested in practice: Item ID vs. Item Name vs. Item Revision ID are three different fields, naming rules are admin-configured per install, and parts can exist before a PN is even resolved — this is why interviewees flagged "knowing the PN" as the single biggest Teamcenter issue. API: SOA web services (SOAP or REST-style JSON) with **no fixed public spec** — generated per customer install (an independent review gave Teamcenter's API a "D" for this). Expect schema/API differences client to client.

## Client interview themes (from sticky-note research)

- **Data that shouldn't surface by default:** large unwieldy Excel BOMs; cost data isn't relevant to most engineers; "study" files (often prefixed SD, not formally released) are mostly noise and mean different things to different people.
- **Where data breaks down:** "biggest issue for using Teamcenter is knowing the PN"; bad naming conventions (side frame and back frame recorded as the same functional part); BOM→costing handoff lost its old auditing trail and now gets numbers mistyped; older parts often missing metadata / not referenced by newer ones; CAD BOM ends up more trustworthy than the Excel BOM it originated from; "our naming is terrible"; EV programs under-fill specs; part material sometimes lives only in CAD, not in the Teamcenter assembly record.
- **What the UI must support:** "file search by PN — this is gold"; text search tolerant of case/spacing/wildcards; metadata filters (file type, program, customer, region) are a must-have; users default to searching only released parts (the gold source of truth) — release vs. study needs to be a first-class filter; released = passed change control and is tooled/intent-to-manufacture; fastener/bolt attributes (head size, torque, strength, length, hex shape) meaningfully narrow results; part bounding-box/size matters, including flattened vs. unfolded state.

## Design implications for the product

1. Discover each tenant's schema at connect time (OData `$metadata`, WRS domain list, DOORS module structure) rather than hardcoding field names.
2. Treat PN as a probabilistic key: canonical part registry + per-source crosswalk table from day one.
3. Default views show released/gold-source data only; study/unreleased stays opt-in.
4. Search is PN-first, tolerant of case/spacing/wildcards, layered with metadata filters.
5. Surface data-quality signals (missing metadata, stale references, known-underfilled fields) instead of presenting all source data as equally trustworthy.

## Open threads

- **Cooper Standard**: data reportedly very sparse — likely spreadsheets/Word/SharePoint rather than a formal PLM. Need to confirm what's actually authoritative before assuming a connector is the right approach.
- **Flow** (flowengineering.com): Rivian's requirements system of record (also used by the Rivian/Volkswagen Group Technologies JV) — a purpose-built hardware requirements platform, not a PLM. Has an integrations page; not yet confirmed whether it connects to any of the five systems above.
