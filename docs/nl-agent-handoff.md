# NL interface and agentic system: state of play and research guide

Branch: `nl-integration`. Written to guide research before more agent work is built.

## 1. What exists today (offline, deterministic)

- **Settings > Navigation > Chat** replaces the left sidebar with a slim icon rail and a chat panel (340px). One thread per project, saved in the browser.
- **The agent is a stub** (`nl-agent`, `src/services/stubs/nlAgent.ts`). It matches phrases to a fixed set of actions. It is not a model.
- **What it can do:** create a BOM from an attached assembly (walks intake, tree, review, search), find similar parts, catalogue lookup and compare, open any screen by name, filter the table on screen in plain English, clear filters.
- **Seams that already exist and are the integration points:**
  - Every screen reaches simulated services through typed interfaces (`src/domain/types.ts`: `GeometricEngine`, `ViewerController`, `CompareService`, `CatalogueService`, and the new `NlAgent`).
  - App state lives in the URL (route, filters, selection, search state), so navigation and filtering are single actions.
  - A table registry (`src/features/chat/tableRegistry.ts`) lets the chat read and drive the table on screen.
  - The autonomy gate and audit trail already model "what an agent may do alone" and "what a human confirms".
- **Groundwork not yet wired (commit `c9d384d`):** `ScreenSnapshot` and `NlMemory` types, `src/services/stubs/nlScreen.ts` (questions and actions over visible rows), extra effect kinds (select, sort, group, columns, layout, undo). The chat panel does not send snapshots yet.

## 2. The model we sketched

The shell is something a model operates through typed tools. Four contracts:

1. **Screen manifest (shell to model):** route, step, table columns, visible rows, selection, filters, sort, available actions.
2. **Tool manifest (model to shell):** fixed actions with schemas (`navigate`, `set_filters`, `select_rows`, `sort`, `open_panel`, `start_workflow_step`, `propose_decision`). Arguments validated. Writes become confirm cards and write an audit entry.
3. **Event stream (agent to shell):** message text, tool-call started/finished, progress, UI actions, artifacts. CAD work is slow, so jobs report status.
4. **Artifact schema:** agents return a spec (KPI, chart, table, with data and sources); the shell renders it with design-system components. This replaces hard-coded dashboards.

Agents behind the chat: orchestrator (the chat), CAD agent (measurements, viewing, alignment; behind `ViewerController` and `GeometricEngine`), data and visualization agent, workflow agent.

**Private mode:** the browser talks only to a gateway on the customer side, which holds keys, calls the model, enforces the tool allowlist and logs every call. CAD and part data stay inside that boundary. The scripted stub stays as the offline default; private mode swaps the `nlAgent` implementation for an HTTP and streaming one with no screen changes.

## 3. Open questions to research (in priority order)

1. **Hosting and data boundary.** Customer cloud with a managed model (Bedrock, Azure OpenAI, Vertex), fully on-prem model, or vendor-hosted? What data may the model see: screen manifest only, or rows, part numbers, CAD-derived values? Any redaction or tenant isolation requirements? Which security reviews or certifications do target customers require?
2. **Protocol choice.** Adopt an existing standard or define our own? Look at: MCP (tools and resources), AG-UI or similar agent-to-UI event protocols, and generative-UI approaches. Decide what the shell must own (tool schemas, event types) versus what agents own.
3. **Who exposes tools.** Does the shell publish its tool manifest to the agent, or does the agent service define tools and the shell implements them? Affects versioning and how the AI dev works independently.
4. **CAD agent contract with the AI dev.** What do measurements, viewing, alignment and overlap return? Latency and job model (sync, async with progress, streaming)? How are viewer commands expressed (set view, highlight face, camera)? Which of today's stubs (`ViewerController`, `GeometricEngine`, `CompareService`) does it replace first?
5. **Generated visualizations.** What chart and card types are needed? Does the spec reuse an existing grammar (for example Vega-Lite) or a small custom schema limited to our components? How are sources and confidence shown (this must follow the design system rules: color is never the only signal)?
6. **Trust and approvals.** Which actions may the model take alone (navigate, filter) versus only propose (decisions, approvals, exports)? Does this map onto the autonomy gate rules? How is a model-made decision attributed in the audit trail (actor, prompt, tool call)?
7. **Failure behavior.** What happens when the model is slow, wrong or offline: fallback to the scripted agent, to plain navigation, or an inline error? How does the user see and undo what the agent did?
8. **Evaluation.** How will we know the agent is good enough: a set of real user requests per journey, pass/fail on tool calls chosen, and latency targets?
9. **UX of the chat as the shell.** How much should be conversational versus direct manipulation? Do users still need the rail and breadcrumbs (current answer: yes, as the click fallback)? What do users see while an agent works (progress, cancel)?

## 4. Questions for the AI dev

- Which framework and orchestration are they using, and does it already emit a streaming event format?
- What does their CAD agent need from the shell (current view state, selected geometry) and what does it return?
- How are tools described to the model today, and can they publish a manifest we can render and test against?
- What are their latency and cost numbers for a typical measurement or alignment request?
- How do they plan to run privately (model location, secrets, logging)?

## 5. How to pick this back up

- Read `docs/05-decisions-log.md` (D-30) and `docs/02-implementation-plan.md` section 6 (stub registry).
- Try the chat: Settings > Navigation > Chat, then `npm run dev`.
- The agent entry point is `src/services/stubs/nlAgent.ts`; the panel and effect runner are `src/features/chat/ChatPanel.tsx`.
- When ready to build, the proposed order was: (1) write the four contracts as TypeScript types and JSON schemas plus a short spec for the AI dev, (2) a mock agent runtime that streams events using the real protocol so CAD jobs and generated charts can be seen in the shell, (3) replace one hard-coded dashboard tile with an artifact spec rendered by the shell.
