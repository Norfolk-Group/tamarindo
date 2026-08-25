# 09 — Build Plan

Build order, from foundation to channels. Each slice is shippable and
demoable on its own.

## Status

| # | Slice | Status |
|---|-------|--------|
| 1 | App shell: Workers + OpenNext, WorkOS AuthKit, left rail, full-screen conversation canvas, design tokens | **shipped** — hosted `tamarindo-web.norfolk-ai.workers.dev` + sibling `tamarindo-nico-agent`; local AuthKit admin signed NDA |
| 2 | Data layer: Neon schema via Prisma — profiles, NDA audit, artifacts, data room, deal terms, memory (pgvector), cell graph | **shipped** — Tamarindo Neon (`lively-voice-04777651`) has the full worksheet (`ModelScenario` / `ModelCell` / `ReportCell`) and is the hosted system of record via Hyperdrive `ep-plain-bird-a6pzy4b1`. Laptop `next dev` stays on Docker Postgres. |
| 3 | Nico core: Agents SDK session, procedures + capability map, approval gates, resumable streaming, avatar state machine | **shipped** — DO handshake + chrome AE2; SSE `/api/nico/chat` removed |
| 4 | Artifact engines: Excel, decks, podcasts via Workflows | **shipped** — custom OOXML + `tamarindo-nico-artifacts` / `tamarindo-nico-watch` deployed; OpenNext workflow binds still commented |
| 5 | Intake flow: invite → interview → bio → NDA click-wrap → data-room gating | **shipped** — +f4 invite accepted as investor; bio + `nda-v1` signed; confidential `dataroom.list` unlocked |
| 6 | Channels: Recall.ai meeting bot page, Twilio phone/WhatsApp webhooks, Resend email, Grok Voice in copilot | **shipped** — live Resend, Twilio call, WhatsApp, Meet (`in_call_recording`); Grok Voice deferred |
| 7 | Avatar rig + motion: Rive states, Framer Motion transitions, truthful activity ticker | **shipped** — seven CSS states + ticker from real events; Rive / Framer Motion deferred |

## Definition of done per slice

1. **Shell** — sign in with WorkOS, see the dressed conversation screen
   (tokens, fonts, orb, one styled exchange), rail collapses.
2. **Data** — hosted Neon is current (including the cell-graph and report
   book). Local Docker is for laptop work only. `db:generate` produces
   typed client; seed script creates an admin.
3. **Core** — a message round-trips through the Durable Object with
   streaming; a demo procedure appears in the capability map; an approval
   card blocks a demo outbound action; reload resumes the stream.
4. **Artifacts** — "build a 3-statement model" returns a downloadable .xlsx
   whose formulas recompute in Excel; a 5-slide deck renders from the Deal
   Terms record; a 2-minute podcast renders from a sample memo.
5. **Intake** — a fresh invite completes interview → bio → signed NDA PDF in
   R2 → data room unlocks; unsigned users are blocked by the procedure.
6. **Channels** — Nico answers a phone call; replies on WhatsApp sandbox;
   joins a test Meet and speaks; sends an approved brief via Resend.
7. **Presence** — all seven avatar states reachable and wired to real
   events; reduced-motion honored.

## Environment / accounts needed

- Cloudflare account (Workers, R2, AI Gateway, Turnstile, Email Routing,
  Browser Rendering)
- Neon project
- WorkOS project (AuthKit + Invitations)
- API keys: Anthropic, xAI, OpenAI, Google (Gemini) — wired into AI Gateway
- Exa API key (Sofia watch — Q9 settled; no SDK until `EXA_API_KEY` is set)
- Recall.ai account
- Twilio account (+ number); Meta WABA (business verification, 2–5 days)
- Resend domain

## Repo

- GitHub: `Norfolk-Group/tamarindo`
- Started from the Norfolk starter kit; deviations documented in
  [02-tech-stack.md](02-tech-stack.md)
