# 02 — Tech Stack

Final stack, decided 2026-08-21. Cloudflare-first for compute, agent runtime,
files, and security; best-of-breed elsewhere.

## The stack

| Layer | Choice | Why |
|-------|--------|-----|
| Hosting | Cloudflare Workers (Next.js via OpenNext) | Single platform with the agent runtime; edge latency |
| Agent runtime | Cloudflare Agents SDK on Durable Objects | Purpose-built for long-lived stateful agents: WebSocket streaming, resumable streams, human-in-the-loop approvals, scheduling, per-agent SQLite state |
| Durable jobs | Cloudflare Workflows | Multi-step pipelines with retries (ingestion, podcast render, deck build) |
| Database | Neon Postgres + pgvector, via Hyperdrive | Relational data and vector memory side by side in one query. Cloudflare D1 is SQLite (no pgvector) — wrong tool |
| ORM | Prisma (client generated to `lib/generated/prisma`) | Already configured in the starter; strict types |
| Files | Cloudflare R2 | S3-compatible, zero egress fees — matters for a data room with repeated downloads |
| Identity | WorkOS AuthKit | Consistency with all other portfolio apps; orgs, roles, invitations, MFA; free to 1M MAU. Authorization stays in our procedures, so swapping later is cheap |
| Model routing | Cloudflare AI Gateway | BYO keys, caching, failover, cost tracking across providers |
| Email out | Resend | Transactional sending |
| Email in | Cloudflare Email Routing + Email Workers | `nico@` receives mail and triggers the agent |
| Meetings | Recall.ai (Output Media API) | Bot joins Zoom/Meet/Teams, hears diarized audio, speaks back, renders Nico's avatar as its camera tile |
| Phone | Twilio ConversationRelay | Real phone number; Twilio handles telephony STT/TTS (ElevenLabs voices built in); we handle text turns |
| WhatsApp | Meta WhatsApp Business Platform (Cloud API), Twilio as BSP option | Nico's own business number; 24-hour window + approved templates for outbound |
| Security | Cloudflare Turnstile, WAF, DNS | Bot protection on sign-up; free hardening |
| PDF/screenshot | Cloudflare Browser Rendering | Headless Chrome for NDA PDFs and deck previews |

## Models (all behind AI Gateway)

| Role | Model |
|------|-------|
| Judgment / orchestration / consulting voice | Claude |
| Deep research, live market data | Grok (xAI) for synthesis; Exa **or** Perplexity Sonar for scheduled web watch (Q9 — not installed yet) |
| Realtime voice (copilot + meetings) | Grok Voice Agent API (`wss://api.x.ai/v1/realtime`, OpenAI Realtime-compatible) |
| Speech-to-text (voice notes, uploads) | Grok STT |
| Podcast rendering (two-host) | Gemini TTS (multi-speaker) |
| Failover | GPT (OpenAI) |

### Voice consistency note

Nico's voice differs slightly per channel at launch (Grok voice in
copilot/meetings, an ElevenLabs voice on the phone via Twilio, Gemini in
podcasts). Mitigation: pick closest-matching warm voices on each. If
one-voice-everywhere becomes important, adopt ElevenLabs as the single voice
vendor (it is the only one usable in all four places) and optionally clone a
canonical Nico voice. Text pipelines are unaffected either way.

## Artifact engines (libraries)

- **Excel:** HyperFormula (server-side formula computation) + ExcelJS
  (writes `.xlsx` with live formulas)
- **Decks:** PptxGenJS (`.pptx` with Tamarindo template) + React preview
- **PDF:** pdf-lib (NDA merge + signature embed), Browser Rendering (render)
- **Parsing:** unpdf (PDF), SheetJS/ExcelJS (Excel), mammoth (DOCX)

## Secrets and environment variables

Native Cloudflare secrets remain the plan:

- **Deployed:** `wrangler secret put <NAME>` per environment (or the
  dashboard Secrets Store)
- **Local dev:** `.dev.vars` (gitignored), documented by `.dev.vars.example`
- **Doppler:** optional later, not now. It is a better *team* secrets
  store, but Workers has no native Doppler sync — only a CLI pipe
  (`doppler secrets --json | wrangler secret bulk`). Doppler's native
  sync is Vercel. Adding it today would not improve the Cloudflare path.

## What was considered and rejected

- **Vercel hosting + Inngest** — replaced by Workers + Agents SDK +
  Workflows for a single platform and a better agent runtime.
  Reconsidered 2026-08-22: the Next.js slice would deploy to Vercel
  easily, and Doppler syncs natively there. Still rejected — we want
  Cloudflare services, including Workers, as the home for Nico.
- **Clerk** — easier prebuilt UI, but WorkOS wins on portfolio consistency
  and the custom shell doesn't use prebuilt auth widgets anyway.
- **Cloudflare D1 + Vectorize** — would split relational data from vectors;
  Neon + pgvector keeps them joined.
- **Custom Zoom SDK bot** — Recall.ai abstracts Zoom/Meet/Teams behind one
  API, including output media.
- **Doppler + Railway** — Railway is out. Doppler stays on the shelf until
  secret sprawl across environments is a real pain.
