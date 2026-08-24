# 03 — Agents

## Architecture: one orchestrator, specialist engines

Nico follows the orchestrator/specialist/minion pattern. There is exactly one
user-facing personality — Nico — who plans, delegates, and speaks. Specialists
are server-side engines with their own prompts, tools, and model choices; they
never talk to users directly.

| Agent | Role | Model | Responsibilities |
|-------|------|-------|------------------|
| **Nico** | Orchestrator | Claude | Conversation, judgment, planning, delegation, consulting voice, final quality bar |
| **Luca** | Finance specialist | Claude | Financial modeling: statements, DCFs, scenarios, assumption tracing |
| **Sofia** | Research specialist | Grok | Deep web search, market data, comparables, source citation |
| **Matteo** | Meetings specialist | Grok Voice / Claude | Meeting participation, transcription digestion, follow-up extraction |
| **Pietro** | Output specialist | Claude | Decks, memos, podcast scripts, chart specs, brand compliance |
| Minions | Deterministic workers | none | File parsing, formula computation, PDF rendering, TTS calls, uploads |
| **Fee engine** | Luca delegates | Claude / none | One silent engine for fees Tamarindo **charges** and fees it **pays**. Owns `lib/artifacts/fees.ts`. Rates stay blank unless cited. Never user-facing. |
| **Center engines** | Luca delegates | Claude / none | One engine per revenue or cost center in each Tamarindo entity. Estimates FTE, contractors, functions, salaries, benefits, turnover. Never user-facing. Catalog: `lib/artifacts/centers.ts` |
| **Watch engine** | Sofia delegates | Exa or Sonar (Q9) | Scheduled regulation and ecosystem research. Owns `lib/research/watch-topics.ts`. Never user-facing. Cadence is a Workflow (hours), not a tight loop. |

## Runtime

- Each user session is a **Durable Object** (Cloudflare Agents SDK
  `AIChatAgent`): persistent state, WebSocket streaming to the client,
  resumable streams (reload mid-answer and it continues).
- Specialists run as tool calls / sub-loops inside the session or as
  **Cloudflare Workflows** when the job is long (podcast render, bulk
  ingestion, deck build) — durable, retried, step-by-step.
- Scheduling (`schedule` / `scheduleEvery`) drives follow-up briefs, meeting
  prep, nightly memory consolidation, and Sofia's regulation/news watch
  (every 6–24 hours per topic — not a busy-wait).
- LLM calls go through the **Vercel AI SDK** (ToolLoopAgent pattern) pointed
  at **Cloudflare AI Gateway**, so models are swappable slugs.

## Memory and learning

- **Retrieval memory:** embeddings in pgvector, joined directly to the
  relational rows they describe (documents, investors, meetings).
- **Corrections table:** when a user corrects Nico, the correction is stored
  and retrieved into context for similar future tasks.
- **Consolidation:** a scheduled job periodically distills conversation
  history into durable facts and prunes stale memory.

## Agent-native parity

Every capability is a **procedure**: a typed server function with an actor
(human user or agent), permission checks, and an audit log entry. The UI
calls procedures; Nico calls the same procedures. The capability map (to be
generated in the scaffold) lists every procedure and which roles/agents may
call it. Parity is tested: for each UI action there must be a registered
procedure an agent can invoke.
