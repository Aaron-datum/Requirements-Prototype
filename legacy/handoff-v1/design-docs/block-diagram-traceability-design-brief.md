# Block Diagram & Traceability Diagram — design brief

For design kickoff / brainstorming. This is intentionally not a spec — it's the problem, the goals, and the constraints, so several different visual directions can be explored against the same foundation. (The detailed edge taxonomy and data model live separately in `block-diagram-vs-traceability-diagram-spec.md`, for whenever the brainstorm needs to check against the underlying data.)

## The core idea, in one sentence

One connected graph of engineering data — parts, CAD, documents, ECRs, tests, lessons learned, all of it — viewed through two different lenses depending on what question the user is asking.

## The two questions each diagram answers

**Block Diagram** — "What is this thing made of, and how do its parts actually connect?" This is an engineer's mental model of the assembly itself: physical structure, physical interfaces, nothing else.

**Traceability Diagram** — "What does this thing touch, and where did it come from?" This is the exploratory model: history, evidence, related documentation, similar parts elsewhere — connections of meaning and lineage, not physical touch.

Same underlying data, two different reasons to look at it.

## What's fundamentally different between them

- **Anchor.** Block Diagram is anchored to an assembly — you're looking at a system and its composition. Traceability is anchored to one node — you're standing on a single part (or test, or ECR) and looking outward.
- **What's allowed to appear.** Block Diagram only shows physical things (parts, assemblies) connected by physical relationships (contained-in, interfaces-with). Traceability shows anything connected by meaning — a document, a test report, a lessons-learned note, a similar part on another program.
- **Shape.** Block Diagram's layout mirrors real-world structure — spatial, hierarchical, "this is physically inside that." Traceability's layout mirrors time and causality — a chain, a radial burst outward, "this produced that, that resolved this."
- **Certainty.** Block Diagram connections are mostly binary and definitive — it's real hardware, either physically connected or not. Traceability connections range across a whole spectrum, from a system-of-record fact down to an AI's best guess — so traceability has to carry and display that uncertainty in a way the block diagram mostly doesn't need to.

## Shared design goals, regardless of which diagram

- **Overview first, detail on demand.** The canvas should be readable at a glance from across the room. Anything that requires actual reading belongs one click away, not sitting on the canvas.
- **Trustworthy at a glance.** A user should be able to tell what's confirmed fact versus a computed suggestion without inspecting every element individually or checking a legend each time.
- **Same shell, different lens.** Global nav, a left sidebar for finding your way, a right sidebar for detail, and a center stage for the diagram itself — that shell stays constant across both diagrams, so the mental model transfers and only the canvas content changes.

## Information tiering — what earns a place where

| Tier | Where it lives | What belongs there |
|---|---|---|
| **Tier 1 — always visible** | On the block/node itself, in the canvas | Identity (what is this, by name and type), an attention flag if something needs eyes on it (changed, at-risk, failing), and one light line of orienting context (where does this sit). If it takes more than a glance to decide "do I care," it's too much for this tier. |
| **Tier 2 — one click away** | Right sidebar / peek panel | The specifics behind a flag — what changed and when, what's failing, what it connects to, the handful of attributes that matter for a decision. Enough to judge whether to act, without leaving the diagram. |
| **Tier 3 — dig in** | Full page / dedicated view | The complete record — full PLM data, full test history, the actual document or CAD file, edit and action controls. Where you go to do the work, not just assess it. |

## The shell, in brainstorming terms

- **Top — global nav.** Search, create, project switching. Wayfinding, not diagram-specific.
- **Left sidebar — finding your way.** A structural or categorical tree depending on the lens, filters to narrow what's drawn, and a panel for customizing how the diagram is drawn plus reading the key.
- **Right sidebar — the detail behind whatever you clicked.** Same shape and behavior regardless of which diagram surfaced it.
- **Center stage — the diagram itself.** This is the one piece that's fundamentally different between the two, and where the design exploration should concentrate.

## Prompts to brainstorm against

- How do we make "this is real and physical" versus "this is a computed suggestion" readable at a glance, across both diagrams, without a legend lookup every time?
- How does a node stay small and scannable while still carrying an attention flag that never gets missed?
- What does "zooming in" feel like on a traceability diagram, if it isn't spatial zoom the way it is on a block diagram — time-based? radial? a drill-down list? something else entirely?
- How much of the canvas interaction (select, hover, expand) should feel identical between the two diagrams versus adapt to what's actually being explored?
- Where's the line between "this belongs on the canvas" and "this belongs in the sidebar" — and does that line move depending on how zoomed in the user is?
