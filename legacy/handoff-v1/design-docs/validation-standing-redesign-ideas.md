# Validation Standing screen — redesign ideas (v1, for review)

Working from the screenshot of `EV Platform 2 · Seat System › Validation standing` and the priority order you just gave: **Undetermined** (highest risk — we don't know what we don't know) → **Gap** (known, action needed) → **Evaluated Elsewhere** (AI-driven, needs human sign-off) → **No Gap** (resolved, low attention). `Not Applicable` doesn't fit that risk ladder at all — it's an administrative bucket, not a risk state — so it's treated separately below rather than forced into the ranking.

## A finding that validates the 5th category

The current screen already has the seam for this, it's just split across two buckets. `Evaluated Elsewhere`'s breakdown has `No definitive answer · 4`, and `Gap`'s breakdown has `No definitive answer · 3`. That's 7 — which is exactly the "7 requirements need a decision" count in the page header. And `REC-09011` (Cable routing bend radius) shows up in both the main decision queue, tagged `Conflicting values`, and inside the `Evaluated Elsewhere` drill-in, tagged `Needs decision` / `2 candidates` / `Conflicting criteria`.

That's a strong signal the decision queue was already, functionally, "the Undetermined bucket" — just not named as one, and scattered across two cards' fine print instead of surfaced as its own state. Worth verifying, but the likely fix is mechanical: pull `No definitive answer` out of both `Evaluated Elsewhere` and `Gap`, and let it become the fifth top-level card.

## The five states, redefined by risk rather than alphabetically

| Priority | State | What it means | What's currently true about it |
|---|---|---|---|
| 1 — highest | **Undetermined** | We don't know if this requirement even applies, what it's asking for, or what would satisfy it. The "unknown unknowns." | New card. Likely absorbs the `No definitive answer` lines from both existing buckets (~7), plus anything where applicability assessment hasn't run yet. |
| 2 | **Gap** | We know what's needed. No evidence exists anywhere. A test plan has to be written. | Existing card (31), minus whatever `No definitive answer` items move out. |
| 3 | **Evaluated Elsewhere** | AI found evidence from another program/part. This is where the system does the most work — and where a mistake is most expensive if it goes unchecked. | Existing card (62), minus the same migration. Needs a visibly distinct "awaiting human sign-off" sub-count, not just `Ready to link` vs `Linked`. |
| 4 — lowest attention | **No Gap** | Proven on this project already. Nothing to plan. | Existing card (478) — correct as-is, just demoted visually. |
| — (separate) | **Not Applicable** | Scoped out deliberately, with a reason and an owner. | Existing card (41) — this is bookkeeping, not risk, so it shouldn't compete for the same visual weight as the four above. |

## Concrete changes to the screen

**Reorder the top row to match risk, left to right: Undetermined, Gap, Evaluated Elsewhere, No Gap.** Right now the row reads No Gap → Evaluated Elsewhere → Gap → Not Applicable, which leads with "everything's fine" and buries the two states that actually need a human. Flipping the order is a small change with an outsized effect on what a validation lead sees first.

**Give `Undetermined` a real card, not just a queue.** Likely contents: a breakdown by *why* it's undetermined — requirement text ambiguous, applicability not yet assessed, multiple conflicting candidate matches with no way to pick — rather than one flat count. Its action button shouldn't be `Generate Test Plan` (that's `Gap`'s action, and it presumes you already know the scope) — something like `Assess Applicability` or `Scope This Requirement`, since the actual next step is investigation, not test authoring.

**Make `Evaluated Elsewhere`'s review burden visible, not just its volume.** 62 is the count of matches found; it isn't the count of matches a human has actually signed off on. Split that card's headline number, or add a second number next to it — matches found vs. matches confirmed — so "the system did a lot of work" and "a human has checked that work" read as two different facts. This is the card where the project's whole confidence/provenance framing earns its keep: `Same part · geometric duplicate` / `Same supplier` / `Same standard`-style reasoning tags (already in the drill-in panel you showed me) probably belong summarized on the card itself, not just one level down.

**Demote, don't remove, `No Gap`.** It's still useful as a denominator and a sanity check, but it shouldn't occupy the same visual weight as the three states above it — consider collapsing it to a compact strip (count + the existing evidence-type breakdown) rather than a full card matching the others.

**Move `Not Applicable` out of the primary row entirely.** It's not part of the "how worried should I be" gradient — put it in a secondary strip alongside metadata like `DV gate in 34 d` / `Last evidence sync`, or as a small tab, so the four risk-ranked states aren't sharing visual real estate with an administrative bucket.

**Promote the decision queue to the top of the page, or at minimum give it equal billing with the cards.** Per the earlier discussion, this table is the actual action list — add an owner/assignee column (Adient's SOR describes an assign-to-team review workflow, not just a status readout), and once `Undetermined` exists as its own state, this table becomes largely *its* contents rather than a separate cross-cutting list bolted onto the bottom.

## Open questions this raises

- Does `Undetermined` need its own gate/deadline framing the way `Gap` implicitly does (a test plan has a due date) — or is its only real deadline "before it can even become a Gap or Evaluated-Elsewhere item"?
- Should `Evaluated Elsewhere`'s "awaiting sign-off" count roll into the decision queue too, or stay separate from `Undetermined`'s items since the nature of the decision is different (confirm a match vs. resolve an unknown)?
- Once this reorders, does the segmented status bar at the top of the page (currently green/blue/red/gray, proportional to the old four-bucket split) get reordered and recolored to match, or does it get replaced by something that visually foregrounds risk more directly than a neutral proportion bar does?
