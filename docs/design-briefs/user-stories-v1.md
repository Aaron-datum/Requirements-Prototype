# Datum — Requirements Workflow: User Stories (v1)

Synthesizes two sets of field notes — a DRE's design-lifecycle pain points and a Validation engineer's sign-off pain points — into three user stories, one per persona. Each sub-story is grounded in a specific note; where a story is inferred rather than directly observed, it's flagged. These are the seed set for the next pass: mapping to features/functionality and acceptance criteria.

## Story 1 — DRE designing a part for a new program

Core pain, in their words: manually walking every component to hand-draw block diagrams ("this can take weeks → months"), "have we seen this before" failing under fatigue late in a review, no good way to link/send requirements to suppliers, and ECRs that chain out of sync because nothing propagates automatically.

Primary story: As a DRE starting a new part, I want the system to tell me what's required for this part and generate a starting point from similar prior parts, so I don't have to manually rediscover scope or redraw boundary diagrams from a blank sheet.

Sub-stories:

1. As a DRE, I want the system to surface what design-lifecycle steps apply to this part (manufacturability checks, required testing, program-specific special requirements) so I don't have to track that down from an expert every time. (Grounds: "what do I even need to do... consult an expert on what pass/fail is, special program needs")
2. As a DRE, I want a boundary/interface diagram generated automatically from the CAD assembly so I'm not manually walking every component to hand-draw block diagrams. (Grounds: "walk through every component & create block diagrams... weeks → months depending on complexity")
3. As a DRE, I want the system to suggest similar prior DFMEAs/DRBFMs based on CAD similarity, not memory, so "have we seen this before" isn't a fatigue-dependent guess late in a review. (Grounds: "have we seen this before... fatigue, rush through → failed")
4. As a DRE, I want to share the relevant requirement excerpt with a supplier without forcing them to separately purchase the full source spec, so I'm not stuck choosing between giving no context or hitting a licensing wall. (Grounds: "no good way to link/send to suppliers"; GMW snip-vs-purchase problem)
5. As a DRE, I want an ECR's downstream effects to propagate automatically, so I don't have to manually re-run and re-sync a whole chain of ECRs by hand. (Grounds: "chaining ECRs → easy to get out of sync, have to go back and rerun ECRs to fix all")
6. As a DRE, I want to add a requirement or test mid-program without it getting lost or looking like an error, so late-arriving scope doesn't end up as a verbal note buried in a CAD metadata field. (Grounds: "include requirements mid program... late releases communicated verbally, added note to meta data notes section of CAD")

## Story 2 — Validation engineer testing and evaluating for sign-off

Core pain, in their words: "knowing why a test was needed, and what it really meant to pass or fail... as the engineer in charge of signing off on validation, raising issues, and determining the risk of an issue — this was a problem."

Primary story: As a validation engineer, I want to see why each test exists and what pass/fail actually means for it, with full traceability back to its source requirement, so I can sign off with confidence instead of guessing.

Sub-stories:

1. As a validation engineer, I want every test linked back to the requirement it verifies, with the requirement's origin visible, so I can judge whether I trust the requirement before I trust the result. (Grounds: "where did requirements come from? can I trust them?")
2. As a validation engineer, I want explicit pass/fail/miss criteria stated for each test and gate, not inferred from dates, so "what constitutes a miss" is never ambiguous. (Grounds: "what constitutes a miss, what constitutes pass/other status")
3. As a validation engineer, I want to see which tests could be substituted with surrogate data from a similar part or program, and how that surrogate performed, so I'm not reconstructing that judgment call from scratch each time. (Grounds: "tests we might be able to surrogate... what has to be the same? what program can we perform? how did it perform?")
4. As a validation engineer, I want test dependencies flagged as internal vs. external, so I know whether a delay is mine to resolve or someone else's. (Grounds: "test blocks dev — internally/externally")
5. As a validation engineer, I want to see the downstream impact of a failed test — severity, and who/what it affects (other teams, program, safety, customer) — so I can prioritize and escalate correctly. (Grounds: "what happens if we fail? severity of issues, impact on other teams/overall program/safety/customer")
6. As a validation engineer, I want to see what changed on a part since I last reviewed it — what changed, from what, what it impacts, when — so I know whether a DRE's change affects my test plan. (Grounds: "did my DRE just change that? what changed, from what, what does this impact, when")
7. As a validation engineer, I want a subsystem view that can zoom out to full-vehicle context, so I can see both the detail I'm testing and where it sits in the bigger picture. (Grounds: sketch — subsystem detail fading out to full-vehicle silhouette)

## Story 3 — Program manager tracking overall progress top-down

Note on evidence: weaker direct support than Stories 1 and 2 — no PM wrote these notes. This is synthesized mainly from the validation engineer's "program view" lens plus general needs implied across both note sets. Treat as a draft to validate with an actual PM, not field-verified yet.

Primary story: As a program manager, I want a single top-down view of status, risk, and deadlines across every part in my program, so I can see where things stand and where they're headed without chasing individual engineers.

Sub-stories:

1. As a program manager, I want an at-a-glance status/issues overview across every part and owner in the program, so I know where attention is needed without asking each person individually. (Grounds: "everyone's status, issues overview")
2. As a program manager, I want deadlines and dependencies across parts, including predicted timeliness and what a slip pushes forward or back, so I can see cascading risk before it becomes a missed gate. (Grounds: "deadlines and dependencies... predicted timeliness, updates on program status, push forwards/backs")
3. As a program manager, I want to see where a part is shared or similar across other programs, so I understand cross-program risk and reuse opportunity, not just this program in isolation. (Grounds: "cross program → where is my part shared/similar")
4. As a program manager, I want visibility into which gates are at risk and the consequence of missing them, so I can intervene before a miss rather than learn about it after the fact. (Grounds: "consequence of missing... what constitutes a miss")
5. (Inferred, not directly observed) As a program manager, I want to distinguish a delay caused by something within my program's control from an external dependency, so I know where I actually have leverage to act.

## Mapping note

Together these three roughly confirm the entry points already in the dev handoff doc, with one adjustment worth carrying forward: Story 1 maps to Part/assembly, Story 3 maps to Person/Org plus cross-program Timeline, but Story 2 doesn't sit cleanly under Gate/release — it wants its own requirement-trust and surrogate-test-tracing content that Gate alone doesn't cover. Recommend treating Testing as its own entry point (or a clearly distinct lens under Gate) when the feature/AC pass starts, rather than folding validation engineer needs entirely into the existing Gate definition.
