# 01 — Overview

## What Nico is

Nico is not a chatbot bolted onto an app — **the conversation is the app**.
He is an artifact factory with a conversation on top: users ask in plain
language and receive finished, downloadable work product, not summaries of
work.

He ingests everything Tamarindo knows — PDFs, Excel files, Word docs, audio,
video, meeting transcripts, Granola notes — and reasons over it to produce:

- Financial models (income statements, cash flows, DCFs) as real `.xlsx`
  files with live formulas
- Complete investor pitch decks, including the ask and terms
- NotebookLM-style two-host podcasts from any material
- Investor briefs, memos, one-pagers, and publication-quality charts

He is also a complete assistant: he schedules investor meetings, joins them
on Zoom or Google Meet as a speaking participant, briefs investors by email
or WhatsApp, answers his own phone number, and onboards new team members and
investors himself — interview, bio, and NDA signature included.

## Core principles

1. **Agent-native parity.** Every action a user can take in the UI maps to a
   server procedure that Nico can call. Same code paths, same permission
   checks, no side doors. This is enforced by design: authorization lives in
   the procedures, not in the UI or the auth provider.

2. **Artifacts over answers.** Success is measured by the quality of the
   Excel model, the deck, the podcast — not the eloquence of the chat reply.

3. **Autonomous inward, accountable outward.** Nico works freely on
   analysis, drafts, and internal state. Every outbound touch to a human
   (email, WhatsApp, call, calendar invite, data-room publish) passes through
   a single approval-gated procedure.

4. **Truthful presence.** The UI shows what Nico is actually doing — which
   document he is reading, which search he is running. Animations are wired
   to real events. He always discloses that he is an AI.

5. **Numbers from records, never from the model.** Valuations, raise
   amounts, and terms render exclusively from the admin-controlled Deal
   Terms record. A language model never invents a figure an investor sees.

6. **Human test before he speaks.** Every reply runs a silent gate: would a
   human answer this way? If no, he rewrites once and then sends. He does
   not announce the check.

## History note

This project started from the Norfolk starter kit (Next.js + Clerk + Prisma
on Vercel). With explicit permission, the design deviates from Norfolk
doctrine wherever a better-fitting choice existed. The final stack is
documented in [02-tech-stack.md](02-tech-stack.md).
