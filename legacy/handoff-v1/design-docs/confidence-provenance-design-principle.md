# Confidence & provenance in search results — design principle

Prompted by: how should the UI indicate confidence when a user searches by Part Number and gets back results that were matched probabilistically (text/field matching across systems that mostly don't have a real PN field), rather than joined on a guaranteed key?

Status: reviewed against the actual prototype (Requirements workflow UI directions3.zip — Block Diagram View, DFMEA Hi-Fi Screens, Requirements Workflow Wireframes, 36 screens). The framework below matches what's already built more than expected — this update replaces the original draft with what's confirmed, what's inconsistent, and the one real gap.

## The reframe

Given the data-source research (see `plm-data-source-research.md`), PN is not a reliable join key across the five systems — only Aras and Windchill have a real PN field; DOORS, Polarion, and (contested) Teamcenter don't. The product is a search/exploration tool that has to earn trust per result, aligned with how an engineer reasons about the data, not a database with guaranteed joins.

## Two axes — already present in the prototype

- **Match confidence** — how sure we are a result is genuinely about the part in question. Screen `Block Diagram View 3a` / `DFMEA Hi-Fi Screens 3a` show this exactly right: spatial score and feature score kept separate, never blended into one number, with a "WHY TWO SCORES" panel explaining that a part can share an envelope while having entirely different interfaces.
- **Match type / provenance** — human-authored vs. system-computed vs. reference, independent of confidence. Carried by the legend in `Block Diagram View 1a` and `Wireframes 5b` (solid line = human-authored, dashed = AI-inferred/computed, numeric badge = confidence score).

## Confirm/reject loop — already designed, in two competing forms (open decision)

`Wireframes 5d` puts the actual decision in front of us: an inline banner ("Datum found PLM HS-4412 ↔ CAD hose_inlet_v3, spatial 61%, feature 3/7 — Confirm / Pick another / Leave unresolved," non-blocking, survives a refresh) vs. a modal confirmation dialog ("Datum is 61% confident these are the same part," Cancel/Confirm, blocks the walk).

**Recommendation: default to the banner.** A modal implies every uncertain match needs a decision before the user can continue, which doesn't fit a tool where most links are probabilistic by design — that would mean constant modal-clicking. Reserve the modal for actions with real consequence if wrong (e.g. merging two part records), and let routine ambient uncertainty stay ambient, per the banner's own framing.

## Inconsistency to resolve before more screens build on it

At least five different visual treatments for the same underlying signal ("how sure are we") currently coexist:
- Numeric "Confidence badge · 87%" (`Block Diagram View 1a`)
- Word badge "High confidence" (`3a`)
- Raw score pair, no badge (`Wireframes 5d` — "spatial 61% feature 3/7")
- Word badges "Moderate / Low" in a table column (`3a` match table)
- Greyed-out opacity with no inline label, only in the legend (`Wireframes 5b`)

None are individually wrong, but a user moving between the block diagram, the DFMEA starting-point screen, and the traceability table shouldn't have to re-learn what confidence looks like each time. Worth converging on one shared component before the search-results screen (see Gap below) is built, since that screen will need to display all of them at once.

Separately, **stale reference** (`Wireframes 3e`, `4d` — a value that was correct when copied but the source has since changed) and **unconfirmed match** (a link nobody's validated) are different problems that currently share a similar amber-triangle treatment. A validation engineer's correct response differs: recheck a stale reference vs. investigate an unconfirmed one from scratch. Worth deciding whether these should be visually distinct or whether "needs your attention" is deliberately shared.

## The actual gap: no global search-results screen

Search sits in the top nav on every screen, but every confidence/provenance treatment found lives inside a specific feature (DFMEA starting-point matching, CAD compare mapping, traceability sideways links, block diagram edges) — none is the literal "type a PN, see a results list" moment. That screen needs to show, in one place: exact structured-field match, secondary/custom-field match, fuzzy/normalized match, text mention in an unstructured document, and similar-but-different part (not this part at all) — using one converged vocabulary rather than inventing a sixth treatment. Given how much of the hard thinking already exists in `3a` and `5d`, this is mostly an assembly job, not a fresh design problem.

## Build it once, reuse everywhere (still holds)

This problem recurs across the block diagrams, DFMEA/DRBFM similarity suggestions, and surrogate test data (`Wireframes 2c`, "can I surrogate this?"). One shared confidence/provenance component, reused everywhere rather than styled per-screen, is the target — largely already the direction the prototype is heading, per the shared legend appearing across multiple files.
