# Nico — Documentation

Nico is Tamarindo's resident AI consultant: a McKinsey-grade analyst that builds
financial models, pitch decks, and podcasts, briefs investors, joins meetings,
and onboards new people — all from one conversation.

This folder is the source of truth for what Nico is and how he is built.
The interactive explainer lives at [`docs/nico.html`](../nico.html).

## Contents

| File | What it covers |
|------|----------------|
| [01-overview.md](01-overview.md) | What Nico is, core principles, agent-native parity |
| [02-tech-stack.md](02-tech-stack.md) | Final stack and the reasoning behind each choice |
| [03-agents.md](03-agents.md) | Nico as orchestrator, the specialist engines, model routing |
| [04-channels.md](04-channels.md) | The six channels: copilot, meetings, WhatsApp, phone, email, data room |
| [05-artifacts.md](05-artifacts.md) | Excel models, decks, podcasts, memos — how each is produced |
| [06-onboarding-nda.md](06-onboarding-nda.md) | Intake interview, bio, NDA click-wrap signature, access gating |
| [07-design-system.md](07-design-system.md) | The "quiet instrument" visual language, tokens, motion, avatar states |
| [08-guardrails.md](08-guardrails.md) | Approval gates, deal-terms record, audit trail, AI disclosure |
| [09-build-plan.md](09-build-plan.md) | Build order and current status |
| [10-r2-library.md](10-r2-library.md) | File drawers on R2 and how files become something Nico can quote |
| [11-pitch-deck.md](11-pitch-deck.md) | 10-slide raise + 6 backups; live P&L / Use of Funds; chat limits |
| [12-blue-variables.md](12-blue-variables.md) | Blue inputs, live statements / returns / sensitivity / structure, cells in DB |
| [design/pitch-deck.md](design/pitch-deck.md) | Tokens, type, table chrome for HTML / PPTX / PDF |
| [design/financial-reports.md](design/financial-reports.md) | Excel-like HTML grid for financial reports |

## One-paragraph summary

Nico runs as a stateful agent on Cloudflare (Agents SDK on Durable Objects),
with memory in Neon Postgres + pgvector, files in R2, identity via WorkOS
AuthKit, and models (Claude, Grok, GPT, Gemini) behind Cloudflare AI Gateway.
He reaches the world through a full-screen web copilot, Recall.ai meeting bots,
a Twilio phone number and WhatsApp line, and Resend email. He works
autonomously on analysis and drafts; anything outbound to a human requires
explicit approval. Confidential access is gated on a signed Tamarindo NDA.
