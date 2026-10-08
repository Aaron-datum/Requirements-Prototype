# Requirements tracing screen — design ideas (v1, for review)

Following up on the "where do all requirements that drive tests in the DV P&R come from" discussion, now with two decisions locked in: multi-step traceback uses the bottom-drawer pattern, and Datum computes the driven-by/interface-changed signal rather than requiring a human to assert it. Shell stays table (center) + detail panel (right), per the existing screen — plus a left-hand filter sidebar for the table, addressed below.

## The distinction this screen exists to hold onto

Restating it because it should drive every layout call below: a requirement can carry two independent change signals, not one — did the requirement's own text/value change, and did the thing it's actually protecting against (the interface, the interaction) change. They can diverge either direction. The table and panel both need to keep these visually separate, the same way Provenance and Confidence stay separate axes everywhere else in this project — never collapse them into one "changed" flag.

## Center table — proposed columns

- **Requirement** — title/ID.
- **Source** — document + version/paragraph (the literal citation, same treatment as `Block Diagram View 2a`'s DOORS ID or the Evaluated Elsewhere panel's "customer spec §7.4").
- **Text** — New / Unchanged / Changed, against the prior version or the similar-part baseline.
- **Driven by** — the interface/interaction this requirement verifies, with its own New / Unchanged / Changed state. Since this is Datum-computed, it gets the standard computed treatment: shown with a confidence score, not asserted as fact (see below).
- **Test status** — Has test / No test / Scope unclear. This is the column that answers "what do I actually need to do."
- **Carryover depth** — how many hops back the lineage goes (e.g. "1 hop" vs "4 hops"), so a user can tell at a glance whether "unchanged" means "same as last version" or "traced back through several programs." This is what opens the bottom drawer.

That's six columns carrying real signal, which is a lot — rather than a generic adaptive-default treatment, put filtering and column management in the same **left-hand filter sidebar** already established elsewhere in the prototype (`Block Diagram View 1a`/`5a`'s Structure/Filters/Manage tabs, `Diagram Lenses 1c`'s Kinds/Filters/Draw tabs): a Filters section to narrow the rows (by Text state, Driven-by state, Test status, Carryover depth), and a Manage section to choose which of the six columns are visible, so the table stays uncluttered without inventing a new mechanism.

**Resolved:** when `Driven by = Changed` but `Text = Unchanged` — the dangerous case, since nothing on the surface tells a user to look twice — the row gets the same visible action highlight already used for any other row needing attention, rather than relying on the user to notice two columns disagree. See Open questions, below, for how this interacts with confirmation.

## Side panel — proposed sections, in the order a validation engineer would actually ask them

1. **The requirement itself** — current text, and if `Text = Changed`, the old text alongside it (a real diff, not just a flag). If unchanged, just "unchanged since [version/program]."
2. **What it's driven by** — the interface/interaction, its own change state, and since this is computed: a confidence score, the reasoning tags that produced it (`Same interface · geometric match`, `Same interaction path`, etc. — reusing the exact tag pattern from the Evaluated Elsewhere panel's "Why it transfers" section), and a confirm/override action. Computed and unconfirmed should look visually distinct from computed-and-confirmed, same rule as everywhere else provenance shows up.
3. **Provenance chain (compact)** — the same "Where the answer comes from" timeline style already built for Evaluated Elsewhere (raised → carried forward → today), showing the last 2–3 hops inline. This is the summary, not the full history.
4. **Associated test** — same evidence-card pattern already established (`TR-2208 · Slide effort, 20 samples · max 37.2 N · pass · date`) when one exists. When it doesn't, an explicit `No test defined` state; when the scope itself isn't settled, a distinct `Unclear — needs scoping` state — these should never collapse into one generic "missing" look, since the next action is completely different for each (write a test vs. figure out what test would even apply).
5. **Actions** — confirm the computed driven-by assessment, flag for new test, mark unclear/needs scoping.

## Multi-hop carryover — bottom drawer

Confirmed, and updated: reuse the real **Lower drawer** component from the design system (collapsible, bottom-pinned, default closed, 132px — the same drawer already used elsewhere in the app for recent searches, version info, and data-sync status, per the design system's Recent activity strip on the home page) rather than a bespoke lo-fi drawer or a canvas-based hop view. Concretely: the side panel's compact provenance chain (section 3 above) shows the immediate 2–3 hops and a "N hops back — view full chain" affordance; clicking it opens the Lower drawer across the full width of the screen, populated with one card per hop (version/date, what happened at that hop — raised, requirement text changed, interface changed, carried into a new project, test run — plus status), scrub left/right through the chain. Because this reuses a real, already-built component rather than the earlier `Requirements Workflow Wireframes 1c` lo-fi sketch, this piece is closer to hi-fi-ready than the rest of the screen — worth flagging when this round goes to build.

## Driven-by / interface-changed — Datum-computed

Confirmed: this is Computed, not asserted, for now. That means it follows the same rule as every other computed signal in this project — carries a confidence score, shows the reasoning behind it (the tag list in panel section 2), is visually distinguishable from a human-confirmed state, and has a confirm/override action rather than being presented as settled fact. This is also the piece that, if it's wrong, is the most expensive kind of wrong on this whole screen — an unchanged-looking requirement sitting on top of a silently-changed interface is exactly the "risk we don't even understand" case from the Validation Standing redesign, so getting the visual weight and the confirm step right here matters more than on most other computed badges in the app.

**Resolved — confirmation propagates.** Since the driven-by signal is computed at the interface level, confirming the assessment on one requirement confirms it for every other requirement driven by that same interface — this is not a per-requirement confirmation even though the underlying signal is shared. The confirm action in panel section 5 should say so explicitly (e.g. "Confirm — applies to N requirements sharing this interface"), and the row-level action highlight from the Center table section clears for all of them at once, not just the row the user was looking at.

## Open questions

- Should `Carryover depth` be a plain number, or does it need to hint at *what* happened across those hops (e.g. "4 hops · 1 interface change") before the user opens the drawer at all?
- The dangerous-case highlight and the propagated confirm/override are now resolved (see Center table and Driven-by sections above) — worth a variant check that the highlight is visually distinct enough from the ordinary computed-and-unconfirmed state, since both can be true on the same row at once.
