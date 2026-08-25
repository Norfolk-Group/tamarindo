# 02 — Tech Stack

Final stack, decided 2026-08-21. Cloudflare-first for compute, agent runtime,
files, and security; best-of-breed elsewhere.

## The stack

| Layer | Choice | Why |
|-------|--------|-----|
| Hosting | Cloudflare Workers (Next.js via OpenNext) | Single platform with the agent runtime; edge latency |
| Agent runtime | Cloudflare Agents SDK on Durable Objects | Purpose-built for long-lived stateful agents: WebSocket streaming, resumable streams, human-in-the-loop approvals, scheduling, per-agent SQLite state |
| Durable jobs | Cloudflare Workflows | Multi-step pipelines with retries (ingestion, podcast render, deck build) |
| Database | Neon Postgres + pgvector, via Hyperdrive | Hosted system of record for cells, formulas, memory. Laptop `next dev` stays on Docker Postgres (`DATABASE_URL`). Workers use Hyperdrive. Do not create a second Neon project. D1 is SQLite (no pgvector) — wrong tool |
| ORM | Prisma, engine-less client at the default location, `PrismaPg` driver adapter | Strict types. See "Prisma on Workers" below — the generated client must stay where OpenNext can patch it |
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

- **Excel:** TypeScript cash-flow engine (`decimal.js`) materializes
  `ModelCell` / `ReportCell` on Neon. Downloadable `.xlsx` is hand-rolled
  OOXML (`lib/artifacts/excel.ts` + `zip-store.ts`) with formulas that
  recompute in Excel. No HyperFormula or ExcelJS package.
- **Decks:** Hand-rolled OOXML PPTX (`lib/artifacts/pptx.ts`) plus HTML /
  PDF preview. No PptxGenJS package.
- **PDF:** pdf-lib (NDA merge + signature embed), Browser Rendering (render)
- **Parsing:** extract scripts on ingest (PDF / DOCX / XLSX → knowledge
  extracts). Do not assume SheetJS or ExcelJS are installed.

## Sessions and admin

Two AuthKit defaults do not suit this app, and both are corrected in code:

- **Session length.** AuthKit's cookie defaults to 400 days, so a signed-in
  user is never asked again. `WORKOS_COOKIE_MAX_AGE` (wrangler.toml `[vars]`)
  pins it to 15 minutes, refreshed on activity. `/login` sends the same number
  as OIDC `max_age`, so an expired cookie cannot be revived from a still-warm
  Google session — the user actually re-authenticates.
- **Admin.** Invitations can only grant `member` or `investor`, and the
  `dev-local` admin never exists in production, so a deployed app has no
  reachable admin. `ADMIN_EMAILS` (a Worker secret, comma separated) grants
  admin on sign-in and promotes an existing row, so the owner is not stuck
  behind the guest intake and NDA gates.

## Prisma on Workers

Workers cannot run Prisma's Rust query engine, so the client is engine-less
(`engineType = "client"` in `prisma/schema.prisma`) and the `PrismaPg` driver
adapter carries the connection. Three rules keep that working — breaking any
one of them produces a runtime error only visible on the deployed Worker:

1. **No `output` on the generator.** The client generates to its default
   location so OpenNext can patch it. A custom output directory escapes the
   patch, and the Worker ends up trying to read `query_compiler_bg.wasm` off
   a filesystem it does not have.
2. **`@prisma/client` and `.prisma/client` stay in `serverExternalPackages`**
   (`next.config.ts`). Left to bundle, Next resolves the Node entry; external,
   the bundler picks the `workerd` export condition, which imports the WASM
   query compiler as a module.
3. **Import from `@prisma/client`.** This deviates from the Norfolk starter's
   `lib/generated/prisma` convention, on purpose, for the reason in (1).
4. **No global `pg` pool on Workers.** `PrismaPg` is constructed with
   `maxUses: 1`, and Hyperdrive requests get a per-request client (React
   `cache()`). Reusing a pool across isolate invocations is what produced
   Cloudflare Error 1101 after a successful first query.

Verify with `curl "<host>/api/health?deep=1"` — it round-trips a real query,
and is the only unauthenticated way to prove the Worker reaches Postgres.

## Secrets and environment variables

Native Cloudflare secrets remain the plan:

- **Deployed:** `wrangler secret put <NAME>` per environment (or the
  dashboard Secrets Store)
- **Local dev:** `.dev.vars` (gitignored), documented by `.dev.vars.example`
- **OpenNext bake:** `opennextjs-cloudflare build` copies laptop `.env`
  into the Worker. `DATABASE_URL=localhost` must not win over Hyperdrive
  (`lib/db.ts` `pickDatabaseUrl`). Public URLs are pinned in `.env.production`
  (committed, non-secret) so a production build cannot fall back to the
  localhost values in `.env` and point AuthKit at a laptop.
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
