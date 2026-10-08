# Requirement trace table — cleanup design update request

Reviewed against the live build: the Requirement trace screen, now a real step in the stitched prototype (reached from Carryover review, per `RFQ-26-0418 · Turbocharger Module`). Most of what `requirements-tracing-design-ideas.md` and `requirement-trace-carryover-review-updates.md` called for is already here and working — the left filter sidebar, the compact provenance chain, the full carryover-chain drawer, the propagated confirm action, a link back to Carryover review, even a stubbed `Impact Map` action. This is a cleanup pass on what's built, not a new feature list. Confirmed-working items are called out at the end so nothing already resolved gets re-litigated.

## 1. The dangerous-case highlight isn't actually happening

`requirements-tracing-design-ideas.md` resolved this: when `Text = Unchanged` but `Driven by = Changed`, the row should get "the same visible action highlight already used for any other row needing attention," so a user doesn't have to notice two columns disagree on their own. In the build, REC-10401 (Text: Unchanged, Driven by: Changed 78%) has a highlighted row — but REC-10470 directly below it has the exact same dangerous combination (Text: Unchanged, Driven by: Changed 78%) and sits on a plain white row, no highlight at all. The only thing distinguishing REC-10401 is that it's selected — the highlight is riding on selection state, not on the "needs attention" condition. Fix: the highlight needs to be a standing property of the row (any row where Text=Unchanged and Driven by=Changed gets it, selected or not), separate from and stackable with the selection state.

## 2. Source column needs a source-type tag, not just a citation

Every row's Source column shows a document citation (`SOR-TC-26 §6.4 · rev B`) but nothing about what kind of source it is — supplier, internal, government/regulatory, carryover, etc. This doesn't need a new vocabulary: the BOM's Compare Parts screen already tags exactly this on its "Requirements driving part selection" table (RFQ / Carryover / Internal / Supplier / Mfg / Regulatory / Program). Pull that same tag onto the Source column here and into the panel's requirement header, next to the citation rather than replacing it.

## 3. Confirm the column-visibility "Manage" control exists

The original spec called for the left sidebar to carry both a Filters section (present and working) and a Manage section for column visibility, since the table has seven columns worth of signal. Only Filters is visible in what's built. Confirm whether Manage exists below the current fold or hasn't been built yet — if it's missing, it needs to be added; if it's just off-screen, no action needed beyond confirming during demo.

## 4. Confidence-score display is inconsistent on Driven by

Some `Driven by: Unchanged` rows show a confidence score (`Unchanged 91%` on the VGT vane ring row) and others show a plain checkmark with no score at all (Turbine wheel creep rupture, Journal bearing wear). Since Driven by is a computed signal end to end, it should carry a score every time, not just when the state is `Changed`. Decide once and apply everywhere: either every Driven-by state (New/Unchanged/Changed) always shows its confidence score, or scores only show below some threshold worth surfacing — but it shouldn't be present on some Unchanged rows and absent on others with no visible rule.

One asymmetry that's likely correct and shouldn't get "fixed" into false consistency: the Text column shows a plain state with no score, while Driven by shows a score. If Text is a direct/human-legible diff against the prior document revision (not computed), it's right that it carries no confidence score — only Driven by is Datum-computed and needs one, per the confidence-provenance framework. Worth stating this explicitly to whoever builds the next pass, so the two columns aren't accidentally made to match.

## 5. Clarify Resolve vs. Confirm vs. the evidence-resolution surface

The panel has both `Confirm Changed · applies to 2` and a separate `Resolve` button, with no visible distinction between what each does. `requirement-trace-carryover-review-updates.md` §3 specced a requirements-evidence resolution surface (ranked candidates, manual search, upload-as-proof) reachable from `Undetermined` rows. Confirm whether `Resolve` here is that same surface and entry point, or a third, unrelated action — if it's meant to be the same one, it should say so in its label or at least route to the same place, not exist as a second unconnected mechanism.

## Already resolved — confirm and move on, no redesign needed

- **Link back to Carryover review.** The `Carryover Review · 9 open` button in the header answers the open question from `requirement-trace-carryover-review-updates.md` about whether Requirement trace needs a way back — it does, and it's built.
- **Carryover-depth hint.** The `1 iface Δ` tag next to hop count on affected rows answers the open question from `requirements-tracing-design-ideas.md` about whether depth needs to hint at *what* happened, not just how far back. Only note: `1 iface Δ` is terse enough to need a tooltip or a slightly clearer label (`1 interface change`) for a first-time user — a copy check, not a redesign.
- **Compact provenance chain + full chain drawer.** The panel's "Where it comes from" timeline plus the "4 hops back — full chain open below" affordance into the bottom drawer matches the spec exactly, including the drawer staying open independent of the panel.
- **Confirm-propagation button.** `Confirm Changed · applies to 2` matches the resolved spec that confirming a Driven-by signal applies to every requirement sharing that interface, not just the one row.
- **Impact Map button.** Present in the panel actions — confirm during build/demo that it opens the blast-radius network view specced in `requirement-trace-carryover-review-updates.md` §1, not a placeholder with no destination yet.

## Instructions for Claude Design

- Decouple the dangerous-case row highlight (Text=Unchanged + Driven by=Changed) from selection state — every qualifying row gets it, regardless of which row is currently open in the panel.
- Add a source-type tag (RFQ / Carryover / Internal / Supplier / Mfg / Regulatory / Program — reuse the BOM Compare Parts vocabulary) to the Source column and the panel's requirement header, alongside the existing document citation.
- Confirm or build a Manage section in the left sidebar for column visibility, alongside the existing Filters section.
- Make Driven-by confidence-score display consistent across all three states (New/Unchanged/Changed) — always shown or shown by a stated rule, not inconsistent row to row. Leave Text without a score, since it's not a computed signal.
- Clarify the relationship between `Resolve` and the evidence-resolution surface from `requirement-trace-carryover-review-updates.md` §3 — same entry point or distinct action, and label/route accordingly.
- During the next build/demo pass, confirm the `Impact Map` button opens the specced blast-radius view and the `Carryover Review` header button carries scope back correctly — both look done, this is verification, not new design work.

## Open questions

- For the Driven-by confidence-score question in item 4 — always show it, or only below a threshold (and if so, what threshold)?
- Does `Resolve` need its own distinct action after all (separate from evidence-resolution), and if so, what does it do that Confirm/evidence-resolution doesn't already cover?
