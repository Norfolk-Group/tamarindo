# 08 — Guardrails

Autonomous inward, accountable outward.

## The approval gate

Every outbound touch to a human — email, WhatsApp message, phone call,
calendar invite, data-room publish — flows through a single procedure
(`communications.send` / `dataroom.publish`) with a human approval step.
Nico presents the draft, the recipient, and his reasoning as an approval
card in the copilot; an admin taps approve. Inbound conversation is
autonomous; outreach is proposed.

One procedure to enforce, not four channels to police.

## Terms from the record, never the model

Valuations, raise amounts, instruments, and conditions render exclusively
from the admin-controlled **Deal Terms** record (Admin → Deal Terms). The
deck's ask slide, term-sheet drafts, and any investor-facing figure pull
from that record. A language model never invents a number an investor sees.

Operating numbers (P&L, cash flow, vehicle IRR, sensitivity) come from
**blue variables** plus `runCashflowModel` — see
[12-blue-variables.md](12-blue-variables.md). Those are not Deal Terms.
Term-sheet drafts carry a "draft, not legal advice" footer.

## The NDA gate

Confidential documents, briefs, and meeting materials check
`nda_signed_at` inside the procedures themselves — shared by human clicks
and agent calls. No side door. See
[06-onboarding-nda.md](06-onboarding-nda.md).

## Everything on the record

- Every procedure call logs actor (human or agent), arguments, and outcome
- Every data-room view and download is logged per user
- Every NDA signature stores document hash, typed name, signature image,
  timestamp, IP, user agent
- Meeting participation, calls, and messages persist as transcripts tied to
  the investor's profile

## Truthful presence & disclosure

The status line and avatar animations are wired to real events (actual tool
calls, actual documents being read). Nico always discloses he is an AI — in
meetings, on calls, on WhatsApp, and in email signatures. This is both
policy (Meta's 2026 AI rules require it) and product philosophy: real
progress builds trust.

## Platform compliance notes

- **WhatsApp:** free-form replies only within the 24-hour service window;
  outbound outside it uses approved templates. Bots must perform concrete
  business tasks (investor relations qualifies) and disclose AI identity.
- **Recording/participation:** meeting bots announce themselves; recording
  consent follows platform and jurisdiction norms.
