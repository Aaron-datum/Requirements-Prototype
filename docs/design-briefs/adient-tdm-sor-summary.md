# Adient SOR — "TDM Creation with AI/RPA" (signed reference)

Summary of a signed source document: `Statement of Requirements_Create TDM v4 - signed`, project *Automated TDM for RFQ*. Authored by Karin Beck, Markus Müller, Thomas Wald; sponsored by James Siegrist and Cornel Labuwy; approved by Cornel Labuwy (Director Engineering Product Excellence, EMEA) and James Siegrist (Chief Engineer, NA) on the customer/stakeholder side, and David Boyd (Director IT Engineering Applications) and Steven Thelan (Director AI and Advanced Analytics) on IT, mid-September 2025. Kept here as ground truth — this is the client's own approved spec for the workflow this project has been designing around, not a secondary source.

## The problem, in Adient's words

Adient gets large, inconsistent RFQ/SOR packages from OEMs (Daimler, VW, BMW, Ford, etc.), each with its own format and level of detail. Reviewing them to extract engineering requirements is manual, slow, and repeated independently across Sales, Engineering, Manufacturing, and Quality. The goal is a solution that extracts requirements from any input format, standardizes and categorizes them, and produces a TDM (Adient's term for the requirements matrix) regardless of source format — scoped explicitly to **initial TDM creation only**; ongoing maintenance (gap analysis, verification planning) is out of scope for this project.

## In scope

Define and maintain requirements; versioning and change management; ingesting MS Office docs, PDFs, images/pictures, and CAD files; integration with Adient's requirements tool **AUROS**; comparison against previously submitted RFQ packages with differences highlighted; flagging specs that were marked critical in past projects; a web UI.

## The process — an 8-step pipeline (order not mandatory)

1. **Input RFQ** — translate to English if needed.
2. **Select engineering documents** — filter the RFQ package to the engineering-relevant subset. OEMs mark this with their own header codes (Daimler–PV, VW–EP, BMW–PR, Ford–SDS). A revision check focuses attention on what's new or changed.
3. **Requirements identification** — extract each requirement into a row: Conformance State, **K-PAC ID**, Requirement Title, **Connect to Global**, Requirement Description, Acceptance Criteria (+ local-market variant), Test Method (+ local-market variant).
4. **Requirement applicability assessment** — relevance scoring via feature matrix, product content, target market.
5. **Requirements categorization** — multi-level: engineering-relevant (true/false), Category (Functional, Safety, Other), Sub-category (Fatigue, Lifecycle, Robustness, etc.), plus a Department / Source / Requirement type / Classification / Sub-classification / Product Group table, and an Implicated Product checklist taxonomy (Complete Seat → Airbag, Cable System, Cup Holder, Electrical, Lumbar…; Seat Structure → Actuator, Frame, Latch, Motors, Recliner, Tracks/Rails…).
6. **Create TDM matrix format** — one sheet matches AUROS's native upload/download format exactly; other sheets carry additional OEM-specific fields (TDM must be adaptable per OEM); a separate "enhanced" sheet carries additional AI-derived fields, non-OEM-specific (references a feasibility study by a vendor called Roboyo).
7. **Requirement comparison within one project** — flag contradicting, superseding, and gap requirements against each other.
8. **Requirements comparison across different projects** — compare against requirements from previous products.

## Output & workflow

Export as Excel in TDM format (PDF generation also possible); push to AUROS, which auto-creates a **k-pac** record referencing the source; a generic interface to other databases. Extracted/categorized requirements route through an assign-and-review approval workflow before sign-off. The one explicitly non-negotiable requirement across the whole document: the upload path into AUROS and other databases.

## Key terms introduced here

- **TDM** — Adient's term for the requirements matrix/table (their equivalent of what this project has generally been calling the requirements or BOM table).
- **K-PAC ID** — the requirement's identifier within AUROS.
- **Connect to Global** — a link from a project-specific requirement to a global/master requirement. Manual entry today; the document explicitly names AI-suggested matching as the intended next step as the data lake grows.
- **Conformance State** — a per-requirement status field (example values seen: No Gap, Gap, Evaluated Elsewhere, Not Applicable).
- **AUROS** — Adient's requirements system of record and the mandatory integration target.

## Connections to existing project docs

- **Connect to Global** is the same problem as the crosswalk/golden-ID concept in `plm-data-source-research.md` — this document is the client's own confirmation that it's currently manual and that AI-assisted matching is the intended direction, which validates the confidence/provenance work already designed.
- **AUROS** is not one of the five systems covered in `plm-data-source-research.md` (Aras, Windchill, DOORS, Polarion, Teamcenter). Since this SOR treats it as the mandatory integration target, it's a gap worth a research pass of its own.
- **Step 8** (comparing requirements across different projects) is, in Adient's own words, exactly the concept `program-focused-requirements-lofi-brief.md` was scoped around — direct validation of that direction from the client's signed spec, not just an internal hypothesis.
- **Step 7**'s contradicting/superseding/gap language introduces relationship types not yet in the taxonomy in `block-diagram-vs-traceability-diagram-spec.md` (which has Derived-from, Verifies, Raised-by/Resolves, Carried-from, Surrogate-for, Blocks, References, Similar-to, Informs) — worth adding `Contradicts` and `Supersedes`.
