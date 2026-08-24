/**
 * Live AE2 probe against the sibling Worker: start a useAgentChat turn,
 * disconnect mid-stream, reconnect, and apply leftover tokens.
 *
 * Usage: node scripts/ae2-resume.mjs
 * Expects wrangler dev on 127.0.0.1:8788 with workers/nico-agent/.dev.vars.
 */
import { signHandshake } from "../lib/nico/handshake.ts";
import { sessionKey } from "../lib/nico/session-key.ts";
import { tokenEventsFromAgentWire } from "../lib/nico/agent-chat-wire.ts";
import {
  applyStreamEvent,
  emptyAppliedTurn,
} from "../lib/nico/stream-apply.ts";

const HOST = process.env.NICO_AGENT_HOST ?? "127.0.0.1:8788";
const SECRET = process.env.NICO_HANDSHAKE_SECRET ?? "handshake-secret-at-least-16";
const PROFILE_ID = process.env.NICO_PROFILE_ID ?? "cmt3z333m0000xxet6oh3bklh";
const AUTH = "dev-local";

function openAgentSocket(name, token) {
  const url = new URL(`ws://${HOST}/agents/nico-agent/${encodeURIComponent(name)}`);
  url.searchParams.set("handshake", token);
  return new WebSocket(url);
}

function waitOpen(ws) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ws open timeout")), 5000);
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      resolve();
    });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("ws error"));
    });
  });
}

function collectUntil(ws, predicate, ms = 8000) {
  return new Promise((resolve, reject) => {
    const messages = [];
    const timer = setTimeout(() => {
      cleanup();
      resolve(messages);
    }, ms);
    const onMsg = (event) => {
      messages.push(String(event.data));
      if (predicate(messages)) {
        cleanup();
        resolve(messages);
      }
    };
    const onErr = () => {
      cleanup();
      reject(new Error("ws collect error"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      ws.removeEventListener("message", onMsg);
      ws.removeEventListener("error", onErr);
    };
    ws.addEventListener("message", onMsg);
    ws.addEventListener("error", onErr);
  });
}

const tokenEventsFromWire = tokenEventsFromAgentWire;

const conversationId = `ae2-${Date.now()}`;
const token = await signHandshake(
  { authSubject: AUTH, profileId: PROFILE_ID, conversationId },
  { secret: SECRET },
);
const name = sessionKey(PROFILE_ID, conversationId);

const first = openAgentSocket(name, token);
await waitOpen(first);
first.send(
  JSON.stringify({
    type: "cf_agent_use_chat_request",
    id: "ae2-turn-1",
    init: {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            id: "u1",
            role: "user",
            parts: [{ type: "text", text: "What is Tamarindo?" }],
          },
        ],
      }),
    },
  }),
);

const firstBatch = await collectUntil(
  first,
  (msgs) => tokenEventsFromWire(msgs).length >= 1,
  15000,
);
first.close();

const before = emptyAppliedTurn();
let applied = before;
for (const event of tokenEventsFromWire(firstBatch)) {
  applied = applyStreamEvent(applied, event);
}
if (!applied.reply) {
  console.error("AE2 fail: no tokens before disconnect");
  console.error(firstBatch.slice(0, 8));
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 400));

const second = openAgentSocket(name, token);
await waitOpen(second);
second.send(
  JSON.stringify({
    type: "cf_agent_stream_resume_request",
    probeId: "ae2-probe",
  }),
);
const announced = await collectUntil(
  second,
  (msgs) => msgs.some((raw) => raw.includes("cf_agent_stream_resuming")),
  4000,
);
second.send(
  JSON.stringify({
    type: "cf_agent_stream_resume_ack",
    id: "ae2-turn-1",
  }),
);
const secondBatch = [...announced, ...(await collectUntil(second, () => false, 6000))];
second.close();

const leftover = tokenEventsFromWire(secondBatch);
// Replay frames start at the beginning of the in-flight message.
const after = leftover.reduce(applyStreamEvent, emptyAppliedTurn());

console.log(
  JSON.stringify(
    {
      before: applied.reply,
      leftoverCount: leftover.length,
      after: after.reply,
      firstWire: firstBatch.length,
      secondWire: secondBatch.length,
      secondSample: secondBatch.slice(0, 6),
    },
    null,
    2,
  ),
);

if (
  leftover.length === 0 ||
  !after.reply.startsWith(applied.reply) ||
  after.reply.length <= applied.reply.length
) {
  console.error("AE2 fail: reconnect did not continue the in-flight reply");
  process.exit(2);
}
console.log("AE2 ok: leftover tokens applied after reconnect");
