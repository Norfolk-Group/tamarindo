# Handoff: `nico-durable-memory` — consult before any push

**Date:** 2026-08-24 (~06:30 America/Chicago)  
**Status:** **local commit only. Not pushed. No PR. Do not `git reset --hard`. Do not push until you answer.**  
**Repo:** `/Users/rcidale/repos/Tamarindo` · remote `https://github.com/Norfolk-Group/tamarindo.git`

This file is the full briefing. A short paste for this session is at the bottom.

---

## Why this exists

Ricardo asked the **prose / personality / live-world** Cursor session to **commit**, then **merge when green**, then **consult this session before pushing**.

That prose session is waiting. It will not push, open a PR, merge to `main`, or rewrite your uncommitted tree until **you** say what it should do.

You are the live owner of runtime, login, cash-flow `lib/model`, artifacts, R2, ticker, Worker `8788`, and — as of this morning — the chat stack this branch also touched.

---

## Who is who

| | Session | Cursor conversation | Role |
|---|---|---|---|
| **You (read this)** | Nico runtime / product | [Nico's work status](c6bd44cd-9ac5-48e7-affc-6906015d0686) | Owns Worker, model, artifacts, R2, composer/orchestrator/memory as of 2026-08-24 ~05:21 |
| **Them (waiting)** | Nico prose / personality / live-world | [Tamarindo statistics request](7a94a806-0a91-4a82-8bb3-4eb50680d89d) | Weather/markets/headlines, then CI on `main`, then a **local** memory commit. **Not pushing.** |

The waiting session searched your transcript (not this file) before stopping. Conclusion: you wrote durable memory, new conversation, and composer `fullStream` in this working tree, then kept going (prompts, who/people, media, given-name). You never released those files. You told a sibling subagent not to overwrite `composer.ts`.

---

## Git coordinates (verify with `git status` / `git log`)

```
branch:     nico-durable-memory          (checked out NOW — this is the shared worktree)
HEAD:       226ac3a  Let Nico keep what he learns when you start a new conversation.
origin/main:c74d83d  Keep the committed knowledge corpus intact in CI.
remote:     nico-durable-memory does NOT exist on origin. Nothing to pull from GitHub for this branch.
PR:         none
```

`nico-durable-memory` is **one local commit** on top of `origin/main`:

```
c74d83d  (origin/main) Keep the committed knowledge corpus intact in CI
226ac3a  (HEAD)        Let Nico keep what he learns when you start a new conversation.
```

**Working tree is dirty.** Your later work is uncommitted **on top of `226ac3a`**, not on `main`. That is the dangerous part.

---

## Decision we need from you

Reply in your session (Ricardo will paste it back, or you can write it here for him) with **one** of these, or a better instruction:

1. **You own the chat stack.** The other session **abandons** `nico-durable-memory` without pushing. You keep the uncommitted work. You decide whether `226ac3a` stays as a parent commit when you commit, or you cherry-pick / squash / recommit. Tell them **exactly** how to leave the worktree (stay on this branch vs `git checkout main` with dirty files).
2. **Wait.** You are still mid-edit. They stay idle. No checkout, no push, no reset. You ping when the chat files are free.
3. **They may push `226ac3a` only.** You will rebase/continue your dirty work after CI. Confirm you have stashed or committed **your** overlay first — a push of this branch while the worktree is dirty is fine, but a later `checkout main` is not.
4. **You will fold memory into your next commit** and they should **delete the local branch** after you have the snapshot. Spell out the git commands you want them to run (or “do nothing”).
5. **Something else.** Be specific: files, branch, whether Worker `8788` must keep running.

Until that answer, the other session’s default is: **do nothing to git remotes, do not reset, do not discard your dirty files.**

---

## Danger — read before any git command

The shared checkout is **`nico-durable-memory`**, not `main`.

Your uncommitted edits (composer, orchestrator, memory, people, prompts, model, R2, thesis 14–18, …) are diffs **against `226ac3a`**.

| Command | Risk |
|---------|------|
| `git reset --hard` | **Destroys your uncommitted morning work.** Never. |
| `git checkout main` | Git will try to carry dirty files. Overlap with `226ac3a` (copilot, composer, orchestrator, memory, left-rail, agent-copilot, thesis 08) can **block checkout or silently mis-apply**. |
| `git push -u origin nico-durable-memory` | Publishes **only** `226ac3a`, not your dirty overlay. Safe for the remote; **does not save** your uncommitted files. |
| `git stash -u` | Can save dirty work, but this tree is large (model + media + thesis + nico). Easy to get wrong. Prefer **you** stash/commit, not the other session. |
| `git merge` / PR to `main` | Would ship the **stale slice** in `226ac3a` and miss prompts/who/people/media/thinking that you added after. |

The other session will not run those commands unless you name them.

---

## What `226ac3a` actually is (their snapshot, ~21:48 Sun / committed ~22:00)

Intent: **a new chat only clears the window.** Standing facts, preferences, and corrections persist in `MemoryChunk` (`sourcePath = memory/learned`) and are injected into the composer as `memoryNote`.

### Files in that commit only (10)

| Path | What 226ac3a did |
|------|------------------|
| `lib/nico/memory.ts` | Heuristic extract (`remember that` / `from now on` / `that's wrong` / name) + optional Haiku JSON extract; `saveLearned` / `recallLearned` / `learnFromTurn`. Fail-open. |
| `lib/nico/memory.test.ts` | Heuristic extract unit tests. |
| `lib/nico/orchestrator.ts` | `recallLearned` before compose; `learnFromTurn` after reply; memory must not force Sonnet (`conversational` unchanged by memory). |
| `lib/nico/orchestrator.test.ts` | Mock memory; assert recall → `memoryNote` and `learnFromTurn` after. |
| `lib/nico/composer.ts` | `memoryNote` on `ComposeContext`; inject into prompt + `devAnswer`; **`fullStream`** so provider errors are not silent empty successes. |
| `lib/nico/composer.test.ts` | `fullStream` mocks; memory appears in the model prompt. |
| `components/nico/copilot.tsx` | Mutable `conversationId`; `mintConversationId` / `startNewConversation`; remount `AgentAttach` with `key={conversationId}`. |
| `components/nico/left-rail.tsx` | **New conversation** button (`MessageSquarePlus`). |
| `components/nico/agent-copilot.tsx` | Clear handshake bundle when `conversationId` changes. |
| `knowledge/thesis/08-nico-voice.md` | Voice: new conversation does not wipe what Nico learned. |

No Prisma schema change in that commit. Reuses existing `MemoryChunk` + `Correction`.

### What 226ac3a is *not*

- Not `lib/nico/prompts.ts` (voice lives in the composer system string in that snapshot).
- Not `lib/nico/who.ts` / `given-name.ts` / `people.ts`.
- Not media / Gemini / R2 library / raise deck / cash-flow engine edits.
- Not pushed; CI has **not** run on this commit.

---

## What you added *after* `226ac3a` (uncommitted overlay, still in this worktree)

`git diff HEAD` on the overlapping chat files (as of this handoff) is **not zero**. You kept going. Approximate overlay:

| Path | Direction of later work (from the waiting session’s read) |
|------|-----------------------------------------------------------|
| `lib/nico/composer.ts` | System prompt pulled into `prompts.ts`; `whoNote`, `givenName`, `askGivenName`, `mediaNote`, `peopleNote`, `onThinking`, `channel`. |
| `lib/nico/orchestrator.ts` | `loadWho`, `peopleNoteFor`, media preface, thinking/speaking activity events, `learnFromTurn` also gets `pendingNameAsk` / `givenName`. |
| `lib/nico/memory.ts` | Imports `given-name`; `LearnTurnInput` extended. |
| `components/nico/agent-copilot.tsx` | Further attach/presence/media motion (~61 lines vs HEAD). |
| `knowledge/thesis/08-nico-voice.md` | More voice text than the four lines in `226ac3a`. |
| **New (untracked)** | `lib/nico/prompts.ts`, `who.ts`, `people.ts`, `media-intent.ts`, `media-store.ts`, plus tests. |

**Other uncommitted tracks that are yours, not theirs** (do not let a memory PR swallow these unless you intend it):

- Cash-flow: `lib/model/*`, `components/nico/model-workspace.tsx`
- Artifacts: `lib/artifacts/*`, `lib/procedures/artifacts.ts`, raise-deck / structure-memo
- R2 / ingest: `lib/storage/`, `docs/nico/10-r2-library.md`, `docs/plans/2026-08-24-001-feat-r2-library-kb-ingest.md`, `.cursor/rules/r2-uploads.mdc`, embed/ingest scripts
- Thesis 14–18 (Medellín/Cartagena market, living, lease characterization, title, KYC)
- Worker: `lib/nico/sibling-http.ts`, `workers/nico-agent/.dev.vars.example`
- Chat chrome: `chat-rich-text`, `chat-chart`, `chat-media`, `chat-presence`, `app/api/nico/media/`

If you commit “everything dirty” later, that is **your** product commit, not a clean memory PR.

---

## Historical split (why they thought they should stay off your files)

Earlier in the prose thread, Ricardo’s rule was:

- **That session:** Nico voice, live-world (weather, NASDAQ, headlines, Medellín / Cartagena housing news), not `lib/model` math.
- **This session:** login, attach, admin vs user chrome, data room, artifacts, R2, 10-year cash-flow engine.

`main` already contains (pushed, CI green): live-world kit `1b80c02`, hybrid recall + settings rail + GitHub Actions `89a0c2b`–`c74d83d`.

The memory/new-conversation work **started in your session**, then the other session **committed a slice of it** because Ricardo said `commit` while those files were dirty in the shared tree. That is the collision.

---

## CI (only relevant if you say push)

Workflow: `.github/workflows/ci.yml`  
- Node 22, `npm ci` (`.npmrc` has `legacy-peer-deps=true`)  
- Service: `pgvector/pgvector:pg16` (same creds as Docker)  
- `npx prisma migrate deploy` then `npm test`  
- Corpus sync **skipped when `CI=true`** so gitignored `knowledge/qa` stays in `corpus.generated.ts`  
- Lint is **not** gated (existing `react-hooks/set-state-in-effect` errors)

`origin/main` last green: https://github.com/Norfolk-Group/tamarindo/actions/runs/32684077821  

A push of `nico-durable-memory` would run CI on **`226ac3a` only**, not on your overlay. Tests on that slice may still pass locally; they will **not** include your who/people/media tests until those files are committed.

---

## Questions for you (answer in prose)

1. Do you still own `composer.ts`, `orchestrator.ts`, `memory.ts`, `copilot.tsx`, `left-rail.tsx`, `agent-copilot.tsx`?
2. Should `226ac3a` remain the parent of your next commit, or do you want it squashed/reworded/dropped?
3. Is Worker `8788` still yours to restart after chat-stack edits?
4. Is there anything in `226ac3a` you **do not** want (heuristic memory, new-conversation UX, `fullStream`)?
5. When you next commit, should memory stay separate from model/R2/thesis, or one mixed commit?
6. Exact instruction for the other session: **do nothing** / **delete local branch after you commit** / **push after you stash** / other.

---

## What the waiting session will do once you answer

They will follow your instruction literally. Defaults if you say nothing extra:

- No `git push`
- No PR
- No `reset --hard`
- No edits to `lib/model`, artifacts, R2, Worker, unless you hand those off
- They can idle or switch to work you mark as free (e.g. thesis voice copy that does not touch composer)

---

## Paste this into the other session (short)

```
Read docs/handoffs/2026-08-24-nico-durable-memory.md end to end before touching git.

You own this worktree. We are on local branch nico-durable-memory at 226ac3a
(durable memory + new conversation). That commit is NOT on GitHub.

Your uncommitted work is stacked on top of that commit (composer, orchestrator,
memory, prompts, who/people, media, model, R2, thesis 14–18, Worker).

Do not reset --hard. Do not checkout main until you have a plan for the dirty
files. Do not push unless you intend to publish 226ac3a without your overlay.

Reply with what the prose session (7a94a806) should do: abandon the branch,
wait, push after you stash/commit, or a specific git recipe. They will not
move until you say.
```
