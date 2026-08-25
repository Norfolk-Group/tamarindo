# 07 — Design System: "Quiet Instrument"

Avant-garde business aesthetic in the lineage of Grok and Perplexity:
near-black canvases, one jewel-tone accent, editorial type with a monospace
undercurrent, motion that's felt more than seen. Dark-first.

A living reference implementation is [`docs/nico.html`](../nico.html).

## Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#091414` | Canvas — off-black with a green cast (the undertone is half the personality) |
| `--bg-card` | `#0b1717` | Cards |
| `--ink` | `#f2f7f6` | Primary text (paper white) |
| `--ink-dim` | `#93a8a5` | Secondary text |
| `--teal` | `#23a5b4` / deep `#20808d` | The accent. Nico's presence: orb, streaming cursor, active states, links |
| `--gold` | `#ffc94d` | Money only: figures, deltas, the ask slide |
| `--line` | `rgba(242,247,246,0.08)` | Hairline 1px borders instead of drop shadows |

Two accents, never more. Restraint is what reads as avant-garde.

## Typography

- **Space Grotesk** — display/headers (technical, editorial voice)
- **Geist** — body
- **Geist Mono** (or JetBrains Mono) — every number, ticker line, and
  financial figure. Numbers in monospace is the single cheapest trick for
  making a finance product look serious.

## Texture

Faint dot-grid on the canvas, generous negative space, cards as instruments
(hairline borders, no drop shadows), 1.5px-stroke Lucide icons matching the
border weight.

## Layout

- Full-viewport conversation canvas, center column ~min(100%, 860px)
- Collapsible left rail (icons-only when collapsed): Documents, Meetings,
  Admin — content slides over the conversation, Nico stays present
- Nico's avatar anchored and persistent, never scrolled away
- Artifact cards expand to near-full-screen; chat compresses to a strip

## Presence: the avatar state machine

Nico must never look frozen. States drive the avatar rig + a status line:

| State | Motion |
|-------|--------|
| Idle | Slow breathing loop, occasional blink, ambient gradient drift |
| Listening | Head tilt; live waveform ring pulsing with actual mic amplitude |
| Thinking | Considering loop; status cycles the real reasoning stage |
| Researching | Busier animation; ticker shows real activity ("Reading Q2 transcript…") |
| Drafting | Typing indicator + artifact skeleton assembling (rows filling, slides stacking) |
| Speaking | Mouth/head motion synced to TTS audio envelope |
| Awaiting approval | Calm attentive pose; approval card pulses once |

Rules:
1. **The status line is truthful.** Wired to real tool-call events streamed
   from the Agents SDK — never theatrical. Fake progress reads as fake
   within a day.
2. **Motion is cheap and layered.** Framer Motion for layout/cards/message
   entrances (staggered fade-up ~200ms); the avatar is a Rive (or Lottie)
   rig with named state animations; micro-details (streaming cursor with
   teal glow trail, caret pulse) are pure CSS. `prefers-reduced-motion`
   collapses everything to gentle fades.
3. **Resumable presence.** State lives in the Durable Object, so a reload
   mid-research shows him still researching, not reset to idle.

Avatar art: start with a polished orb (ships day one, ages well); a
character rig can replace the skin later without code changes.

Pitch-deck chrome (16:9, gold for money only, mono tables) is specified in
[design/pitch-deck.md](design/pitch-deck.md) — do not invent a second deck look.

## UI stack

| Layer | Choice |
|-------|--------|
| Foundation | Tailwind v4 + shadcn/ui (tokens in `globals.css`) |
| Chat components | Vercel AI Elements (restyled to tokens) |
| Motion | Framer Motion + CSS |
| Showpieces | Magic UI / Aceternity, cherry-picked (text shimmer, border beams, number tickers) |
| Avatar | Rive |
| Charts | Recharts, restyled (monochrome + teal, mono axes) |
| Icons | Lucide, 1.5px stroke |
