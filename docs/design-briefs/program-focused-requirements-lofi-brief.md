# Program-focused requirements drill-down — low-fi exploration brief

For a new round of low-fi screens in Claude Design. Goal: explore structure and information placement only — greybox fidelity, several genuinely different variants per concept, the same spirit as the earlier "Requirements Workflow Wireframes" round (see `1a`–`1d`, `t1`–`t5`) and the "Diagram Lenses" round (`1a`–`1d`). Pick a direction from these variants, then go to hi-fi — don't polish visuals yet.

## The reframe

Everything built so far — the Program Map, the Block Diagram, the Traceability view, the DFMEA/DRBFM flow — is anchored to **one program's hardware** and drills downward: program → assembly → subsystem → part → interface → characteristic. "Program" shows up as breadcrumb context (`Programs › EV Platform 2 › Program Map`), not as something you look *across*.

This round flips that. The primary question becomes program-level and comparative: **what's happening across my programs, what's shared between them, and what's actually new.** Hardware becomes what you drill *into* from there, not the thing you start on.

## What already exists — the seeds to build from, not from scratch

The current prototype already has three places where cross-program thinking pokes through, all as secondary annotations rather than a primary view:

- `Requirements Workflow Wireframes 2a` — the Program lens's Thermal subsystem card includes a dashed **"SHARED ACROSS PROGRAMS · 2 parts also in EV-Platform-1"** box, with the handwritten note "where do I sit in the program?" It's one dashed box among many subsystem clusters, not a first-class view.
- `Block Diagram View 5a` — a computed **"SIMILAR-TO · Gen2 Turbocharger Assembly · Atlas EV"** suggestion (94%/88%) sits beside the current program's assembly, dashed and clearly a different program's hardware.
- `Block Diagram View 4b` — the "Choose how to build the block diagram" step already asks "Compare to existing assembly" (map each part to its closest match in a released assembly, inherit that diagram as a starting point) vs. "Create new (blank)" — this is the reuse/carryover pattern, just scoped to one new diagram rather than a program-wide rollup.

All three are the right instinct, surfaced in the wrong place. This round asks: what if any of these were the front door instead of a footnote?

## The manager/program question this needs to answer

Straight from your notes — this is the framing to design against:

> I have several assemblies/variants for different programs with different requirements. What needs to be done on what program? What's shared or carryover? What are the dependencies? What's the status? What's the deadline/timeline?
>
> Then I dig deeper: when did this info/requirement come from? Where is the risk/uncertainty from?

And from the BOM-to-RFQ notes: the BOM is a key part of the RFQ, and knowing what's carryover vs. novel *in the BOM* is what determines testing and validation requirements. If Datum can quickly find what already meets requirements in production, and good starting points where there isn't, it can generate testing plans for new/changed components fast. That loop — Requirements + 3D CAD + PLM data → BOM → new-vs-carryover → Testing — is the engine underneath this whole reframe, and it's also exactly the "geometric duplicate vs. best surrogate" logic already scoped for the BOM detail view (see `bom-detail-view-lowfi-brief.md`). This round is the program-level view of that same engine, not a separate concept.

## Concepts to explore

Structure this the way the original "four structures for the program-down view" round did — several real alternatives, not restyles of one layout.

**1. A programs-plural landing view.** Today there's no screen where you see more than one program at once. What does "my programs" or "all programs" look like as an entry point — a list, a grid, a matrix? What's the one KPI per program that answers "does this need my attention" (status, at-risk count, carryover %, deadline)?

**2. Program-to-program comparison.** Pick two (or more) programs and see, side by side: what's shared, what's carryover, what's genuinely new. This is the promoted version of the `2a` "SHARED ACROSS PROGRAMS" box — worth trying as a dedicated comparison surface rather than an inline annotation. Consider: does this comparison start from an assembly, a subsystem, or a requirement, and does that choice change per program?

**3. The manager rollup.** "What needs to be done on what program" as a single screen — status, dependencies, deadlines/timeline, and what's shared/carryover, across all active programs at once. This is closer to the `1b` Matrix Board or `4a`/`4d` rollup-table patterns already explored, but with **program** as a row/column instead of subsystem or owner.

**4. New-vs-carryover as the entry point.** Rather than starting from hardware structure and discovering confidence/provenance along the way (today's pattern), what if a program's landing view opened straight on "here's what's new, here's what's carryover, here's what's uncertain" — with hardware structure as the drill-in, not the front door? This is where the BOM detail view's confidence badges (`ACTUAL`/`SURROGATE`/`ESTIMATED`/`NO MATCH`) and the Block Diagram's "compare to existing assembly" reuse flow (`4b`) would feed directly in.

**5. The "dig deeper" layer.** Once a manager is looking at a program or a specific carryover/novel item, the two follow-up questions from the notes need a home: *when did this info/requirement come from* (provenance — reuses `confidence-provenance-design-principle.md` vocabulary) and *where is the risk/uncertainty from* (confidence — reuses the same badges as the BOM work). Does this live as a drawer off any item, a dedicated tab, or something else entirely at the program level?

## Shared constraints

- Low-fi / greybox — structure and information placement, not visual polish. Follow the fidelity of `Requirements Workflow Wireframes`, not the more finished `Diagram Lenses` or `Block Diagram View` screens.
- Several meaningfully different variants per concept, so there's something real to choose between — the earlier rounds' own convention (`2a`/`2b`/`2c` as different lenses, not the same lens restyled).
- Reuse existing vocabulary rather than growing new terms: confidence/provenance language from `confidence-provenance-design-principle.md`, the relationship types from `block-diagram-vs-traceability-diagram-spec.md`, and the confidence badges already prototyped in the BOM table.
- It's fine — expected, even — for this round to make the existing Program Map (`1a`) feel like a subsystem-first view wearing a "program" label. Naming that gap explicitly in the variants is useful, not a criticism to smooth over.

## Update — grounded in the signed Adient SOR

A client-signed source document surfaced after this brief was written: `adient-tdm-sor-summary.md` (Adient's Statement of Requirements for "TDM Creation with AI/RPA"). It doesn't change the reframe — it validates it and gives it real vocabulary and a couple of pieces this brief didn't have yet. Adapt the five concepts above with the following, rather than starting a new round.

**What it confirms, directly.** Step 8 of Adient's own 8-step process is "Requirements Comparison of different projects — compare requirements with requirements from previous products." That's concept 2 (program-to-program comparison), in the client's own signed language. Treat concept 2 as the best-validated of the five and worth the most variant depth.

**Terminology to adopt in these screens**, since it's the client's real vocabulary, not a placeholder: **TDM** for the requirements table itself (what these briefs have been calling the requirements/BOM table); **K-PAC ID** as the requirement identifier; **Connect to Global** for the link from a project-specific requirement to a master/global requirement (this is the same crosswalk concept as `plm-data-source-research.md`, just named); **Conformance State** as the per-requirement status field (values seen: No Gap, Gap, Evaluated Elsewhere, Not Applicable) — likely the right vocabulary for what the confidence badges have been calling `ACTUAL`/`SURROGATE`/`ESTIMATED`/`NO MATCH`, worth reconciling rather than running two parallel status vocabularies.

**New elements the concepts need to carry that weren't in scope before:**
- *OEM as its own dimension.* Adient files RFQs per-OEM (Daimler, VW, BMW, Ford, each with its own document header code), which sits above or alongside "program." Concept 1 (programs-plural landing) and concept 3 (manager rollup) should try OEM as a grouping/filter axis, not just program.
- *The real categorization taxonomy.* The SOR's actual multi-level scheme — Department / Source / Requirement type / Classification / Sub-classification, plus an Implicated Product tree (Complete Seat → Airbag, Cable System, Cup Holder, Electrical, Lumbar… / Seat Structure → Actuator, Frame, Latch, Motors, Recliner, Tracks-Rails…) — is richer than the placeholder "Subsystem/Stage/Department" grouping used in the existing Program Map. Concepts 1 and 3 should try this real taxonomy as a grouping option, not invent another one.
- *Contradicts / Supersedes as relationship types.* Step 7, "Requirement comparison within one project," flags contradicting and superseding requirements — neither exists in `block-diagram-vs-traceability-diagram-spec.md`'s relationship taxonomy (which has Derived-from, Verifies, Raised-by/Resolves, Carried-from, Surrogate-for, Blocks, References, Similar-to, Informs). Concept 5 (the dig-deeper layer) should have a place for these alongside the provenance/confidence questions.
- *Approval and export as real states, not just exploration.* The SOR describes an assign-to-team review/sign-off workflow, and export to multiple TDM sheet formats (AUROS-native, OEM-specific, an "enhanced" AI-augmented sheet) plus a push to AUROS that creates a k-pac record. None of the five concepts currently end anywhere — they're all exploration/understanding screens. At least one variant in concept 3 or 4 should carry a requirement through to an approval/export action, not stop at "here's what I found."

**Open question this raises:** is "program" in these concepts the same unit as Adient's "project," or does a program span multiple OEM projects? Worth resolving before concept 1/3 variants get built, since it decides whether OEM and program are the same axis or two.

## Instructions for Claude Design

Build a new low-fi screen set (new `.dc.html`, wireframe/greybox fidelity matching `Requirements Workflow Wireframes`) exploring the five concepts above, adapted per the update section. For each concept, produce 2–4 structurally distinct variants — vary the underlying layout logic (list vs. matrix vs. graph vs. table), not just visual styling. Annotate each variant with a one-line label (what it optimizes for) the way `1a`–`1d` and `t1`–`t5` already do. Specifically:

- Use the real terms — TDM, K-PAC ID, Connect to Global, Conformance State — in place of the earlier generic labels (REQ-IDs are fine to keep as example values).
- Give concept 2 (program/project comparison) the most variant depth — it's the best-validated concept now.
- Try OEM as a second grouping axis alongside program in concepts 1 and 3, even if only in one variant each, to see whether it needs its own view or works as a filter.
- Swap in the real Department / Source / Classification / Implicated Product taxonomy as a grouping option somewhere in concepts 1 and 3, alongside whatever grouping axes were already being tried.
- Add Contradicts / Supersedes to whatever relationship vocabulary concept 5 was already using.
- Make at least one variant (in concept 3 or 4) carry through to an approval/export state, not just stop at exploration.

Don't wire these to the real design-system components yet — this is a workflow and information-placement pass; hi-fi comes after a direction is picked.

## Open questions to flag while building

- Does "program" always mean a vehicle program, or does it sometimes mean a variant/derivative within a program (the BOM notes mention "variants/models on the same BOM sheet as columns") — does the comparison view need a level *between* program and assembly?
- When comparing programs, what's the unit being compared — assemblies, subsystems, individual requirements, BOM lines? Does that unit change depending on which manager question is being asked?
- Is cross-program carryover always CAD/geometry-driven (as it is today via `Similar-to`/surrogate matching), or does it also need to account for shared suppliers, shared standards, or shared lessons-learned that aren't geometry-based at all?
