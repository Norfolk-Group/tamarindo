# 04 — Channels

Six channels, one brain, one memory. Nico remembers the WhatsApp thread when
the investor calls, and the call when they meet on Zoom.

## 01 · The Copilot (web)

Full-screen conversation canvas — the conversation is the app. Collapsible
left rail (Documents, Meetings, Admin) slides content over the conversation
rather than navigating away. Artifacts stream as rich cards (spreadsheet
grid, slide thumbnails, audio waveform) that expand to near-full-screen.
Voice mode uses the Grok Voice Agent API with ephemeral tokens in the
browser. See [07-design-system.md](07-design-system.md) for the presence
states and motion rules.

## 02 · Zoom & Google Meet

Recall.ai Output Media bot joins as a participant named "Nico". Its camera
tile renders a webpage we host on Workers showing Nico's animated avatar.
The page receives the meeting's live diarized audio; we pipe it through Grok
Voice speech-to-speech, so Nico hears who said what and talks back in real
time. Because the loop runs through our server, meeting-Nico has his full
toolset: pull up the DCF mid-meeting, screen-share a chart, log follow-ups.
Note: output media is always audio + video together — the avatar tile is the
presence. Works on Zoom, Meet, Teams, Webex.

## 03 · WhatsApp

Nico's own dedicated business number on the Meta WhatsApp Business Platform
(Cloud API), display name "Nico · Tamarindo". Inbound messages hit our
webhook → same procedures → replies with text, documents (the .xlsx or deck
PDF right in the chat), or voice notes (Grok STT in, Grok TTS out).

Meta rules honored: free-form replies within the 24-hour customer service
window; outside it, outbound uses pre-approved templates (e.g. meeting
brief). Requires one-time Meta business verification of the Tamarindo
entity. The number is consumed by the API — never install the WhatsApp app
on that SIM.

## 04 · Phone

A real Twilio number on ConversationRelay. Inbound: Twilio transcribes
(Deepgram), our Nico loop responds, Twilio speaks it back (ElevenLabs voice,
`ttsProvider="ElevenLabs"`), sub-second latency with interruption handling.
Outbound calls ("call Rossi to confirm Thursday") are placed
programmatically but require approval like all outbound (see
[08-guardrails.md](08-guardrails.md)).

## 05 · Email

Outbound via Resend: pre-meeting briefs (agenda, model summary, deck
attached), post-meeting follow-ups drawn from transcripts. Inbound via
Cloudflare Email Routing + Email Workers: mail to `nico@` triggers the
agent; attachments flow into ingestion.

## 06 · The Data Room

A Documents area in the left rail. Admins see everything plus publish
controls; investors see only documents published to them — and only after
their NDA is signed. Files live in R2; downloads go through a procedure that
checks role + NDA and logs every view/download, so Nico can report
engagement ("Rossi opened the deck twice but never touched the model").
Publishing is agent-native: `dataroom.publish` is the same procedure whether
an admin clicks or Nico calls it (with approval).

## Scheduling (cross-channel)

Google Calendar API (or Recall.ai's calendar integration): Nico reads
availability, proposes slots, creates the invite with the meeting link, and
schedules himself into it via Recall. The loop closes across channels:
investor replies on WhatsApp → Nico reschedules → updates calendar → briefs
again.
