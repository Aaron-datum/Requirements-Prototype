# Block Diagram vs. Traceability Diagram — spec (v1)

Both diagrams render the same underlying graph — the same file entities (CAD parts/assemblies, Excel BOMs, Word specs, PLM records, ECRs, test reports, DFMEA rows, lessons-learned docs, standards, whatever the source) and the same connectors between them. They are two different **lenses** over one graph, not two databases. Everything below is written so a single edge schema serves both; the diagrams differ in which edges they choose to draw as primary lines, and in layout.

This reconciles with what's already built in the prototype (`Requirements workflow UI directions3.zip`) rather than proposing a rebuild — screen references below point at what already does this correctly, and where the vocabulary needs one small addition.

## 1. Shared edge schema — two independent axes

Every connector in the graph carries two attributes, set independently of each other:

**Provenance** — how we know the two things are connected:

| Value | Meaning | Example | Confidence shown |
|---|---|---|---|
| Human-asserted | A person drew or stated this link | Engineer manually links a lessons-learned doc to a part | none needed — attributed to the person |
| Direct | Systems agree via a literal shared identifier | ECR references this exact PN in its own PN field; BOM parent-child from structured PLM data | none needed — it's empirical, not scored |
| Computed | Datum's AI inferred the link via search | Text search matched a PN string in a document; CAD spatial/feature similarity | yes — one or more scores, kept separate (see `confidence-provenance-design-principle.md`) |

**Relationship type** — what kind of connection this is, independent of how confident we are in it. This is the piece that differs by lens (section 2/3 below).

The mistake to avoid: collapsing these two into one visual signal. A `Contains` edge from a real BOM is Direct and near-certain; a `Contains` edge inferred from a study file's naming convention would be Computed and uncertain — same relationship type, different provenance, and both need to be representable.

## 2. Block Diagram — physical/system composition

**What it shows:** the thing being designed, decomposed into its actual parts and how they physically interface. Scope is one assembly (or a chosen level of it), not one part's whole universe of related data.

**Node filter:** Parts and Assemblies only. Documents, ECRs, test reports, etc. attach to a part node as badges/counts (already the pattern — e.g. `Block Diagram View 1a`'s "2 stale tests" badge on Turbine Housing) rather than appearing as separate nodes in this view.

**Edge filter — two relationship types render as primary lines:**

| Type | Meaning | Rendering |
|---|---|---|
| `Contains` | Parent assembly → child component (the zoom-level hierarchy) | Already correct in the prototype (`1a`'s "contains →" label) |
| `Interface` | A physical connection between peer parts | Already correct as a labeled line (`1a`'s "flange bolts →", `1b`'s "V-band ↔") — needs a closed subtype underneath the free-text label (below) |

**Interface subtype taxonomy (recommended starter set).** This grounds in standard boundary-diagram/DFMEA practice — interfaces are usually classified by what actually crosses the boundary: physical connection, energy, material/substance, or information. Mapped to your domain:

- **Mechanical** — fastened, welded, pressed, fit/clearance, kinematic (transmits force or motion)
- **Thermal** — conduction/convection path
- **Electrical** — power or signal
- **Fluid** — coolant, fuel, hydraulic, pneumatic
- **Software / data** — control signal, CAN bus, data exchange (covers the DRE note about interfaces being "hardware or software")

Keep the existing free-text label (`"flange bolts"`, `"V-band"`) as the human-readable description; add the subtype as a filterable category underneath it, not a replacement. Whether this list is a fixed enum or client-configurable is worth deciding explicitly — given how customized Aras/Teamcenter schemas are per client (see `plm-data-source-research.md`), a small fixed set with an "Other" escape hatch is probably safer than trying to standardize what each client calls things.

**How `Similar-to` and other non-structural edges should appear here — validating an existing pattern:** `Block Diagram View 5a` already gets this right and is worth keeping as the rule rather than the exception: a computed similar-assembly suggestion (`94% · 88%`) is shown in a visually distinct dashed box, connected by a dashed line, explicitly prefixed `COMPUTED ·`. The rule to write down: **any edge that isn't `Contains` or `Interface` may still appear in the Block Diagram as context, but must use the computed-suggestion treatment (dashed, cornered/set apart, explicitly labeled) — never a plain solid line.** Solid lines in this diagram should always mean "this is real, physical topology," full stop, so a reader can trust the shape of the diagram at a glance without checking every edge's provenance individually.

**Layout:** spatial/hierarchical, matching the assembly's actual structure — this is what the existing Function/Org/Physical grouping toggle already does (`1a`).

## 3. Traceability Diagram — exploration from one node

**What it shows:** starting from one selected node — usually a part, but could be a test, an ECR, anything — everything connected to it that isn't physical composition: history, verification, related documentation, similar/surrogate items elsewhere. Scope is one node's neighborhood, not one assembly's structure.

**Node filter:** heterogeneous by design. Parts, but also documents, ECRs, test reports, requirements, lessons-learned, standards — any node kind, because the point is "what touches this," not "what's it made of."

**Edge filter — relationship types render as primary lines (reconciled with vocabulary already in the prototype, e.g. `Wireframes 2a`'s "derives from / surrogate / blocks" legend):**

| Type | Meaning | Already seen in prototype |
|---|---|---|
| `Derived-from` | This requirement/test traces back to its source | `2a` "derives from"; `3d`'s backward/forward trace chain |
| `Verifies` | This test verifies that requirement | `2c`, `2e` |
| `Raised-by` / `Resolves` | ECR ↔ concern/issue | `1c`'s trace chain (Beta issue → Design change → …) |
| `Carried-from` | DFMEA/DRBFM row inherited from a prior analysis | `Block Diagram View 4b`'s "CARRIED FROM: DRBFM-1180 · feature match 6/7" |
| `Surrogate-for` | This test's result substitutes for another, cross-program | `2a`, `2c` "surrogate" |
| `Blocks` | This item is blocking another (a gate, a release) | `2a` "blocks" |
| `References` | The part number/identifier appears in this document's text, unconfirmed as authoritative | not yet in the prototype — this is the "found in a document somewhere" case from the search-confidence conversation |
| `Similar-to` | Computed part/assembly similarity, same or different program | `3d`'s "sideways" links, `Block Diagram View 5a` |
| `Informs` | A lessons-learned or standard applies to this item | not yet in the prototype as a named edge type, but implied by `STD-1 Turbo Housing Guideline` references in `5a` |

Every one of these carries the same Provenance axis from section 1 — e.g. `Similar-to` is almost always Computed, `Derived-from` from a real PLM change record is Direct, a manually-linked lessons-learned doc is Human-asserted.

**Should `Contains`/`Interface` ever show up here too?** Recommend yes, but only as the immediate one-hop context ("this part belongs to Turbocharger Assembly"), not the diagram's main content — `3d`'s "BACKWARD: what produced it" panel already does something like this. Worth confirming this is the intended scope rather than excluding structural edges outright.

**Layout:** chain/lineage or radial-from-node, reflecting time order and causality rather than physical space — matches `1c`'s scrubbable trace chain and `3d`'s backward/forward/sideways panel.

## 4. The one rule that ties both together

Both diagrams read from the same relationship-type taxonomy and the same provenance axis. Each relationship type should carry a tag for which lens(es) render it as a primary edge (`Contains`/`Interface` → Block Diagram; everything else → Traceability Diagram) versus which lens renders it only as a de-emphasized annotation (`Similar-to` in the Block Diagram, per section 2). Building one taxonomy with per-type rendering hints — rather than two independent edge schemas, one per diagram — is what keeps the two views from drifting apart as new relationship types get added later.

## 5. Open questions to settle

- Is the interface-subtype list (Mechanical/Thermal/Electrical/Fluid/Software) a fixed global enum, or does it need a per-client "Other: ___" escape hatch given how customized source schemas are?
- Should `Contains` appear as one-hop context in the Traceability Diagram (recommended above), or should that diagram be lineage-only with zero structural edges?
- `References` (PN found in unstructured text, unconfirmed) doesn't have a home yet in the existing screens — confirm this is meant to surface in the Traceability Diagram rather than needing its own view.
