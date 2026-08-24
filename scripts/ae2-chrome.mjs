/**
 * Chrome-path AE2: Next issues the handshake (session-gated), the sibling
 * hydrates get-messages with CORS, then useAgentChat wire disconnects
 * mid-stream and continues leftover tokens.
 *
 * Usage: node scripts/ae2-chrome.mjs
 * Expects `npm run dev` on :3000 and wrangler on :8788.
 */
import { sessionKey } from "../lib/nico/session-key.ts";
import { tokenEventsFromAgentWire } from "../lib/nico/agent-chat-wire.ts";
import {
  applyStreamEvent,
  emptyAppliedTurn,
} from "../lib/nico/stream-apply.ts";

const NEXT = process.env.NICO_NEXT_ORIGIN ?? "http://127.0.0.1:3000";
const HOST = process.env.NICO_AGENT_HOST ?? "127.0.0.1:8788";
const ORIGIN = process.env.NICO_CHROME_ORIGIN ?? "http://localhost:3000";

function openAgentSocket(name, token) {
  const url = new URL(`ws://${HOST}/agents/nico-agent/${encodeURIComponent(name)}`);
  url.searchParams.set("handshake", token);
  return new WebSocket(url, { headers: { Origin: ORIGIN } });
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

const conversationId = `ae2-chrome-${Date.now()}`;
const handshakeRes = await fetch(`${NEXT}/api/nico/handshake`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ conversationId }),
});
if (!handshakeRes.ok) {
  console.error("AE2 chrome fail: Next handshake", handshakeRes.status);
  process.exit(1);
}
const handshakeBody = await handshakeRes.json();
const token = handshakeBody?.data?.token;
const profileId = handshakeBody?.data?.profileId;
if (!handshakeBody?.ok || !token || !profileId) {
  console.error("AE2 chrome fail: handshake envelope", handshakeBody);
  process.exit(1);
}

const name = sessionKey(profileId, conversationId);
const messagesUrl = new URL(
  `http://${HOST}/agents/nico-agent/${encodeURIComponent(name)}/get-messages`,
);
messagesUrl.searchParams.set("handshake", token);
const hydrate = await fetch(messagesUrl, {
  headers: { Origin: ORIGIN, "x-nico-handshake": token },
});
if (!hydrate.ok || hydrate.headers.get("access-control-allow-origin") !== ORIGIN) {
  console.error("AE2 chrome fail: get-messages CORS", {
    status: hydrate.status,
    acao: hydrate.headers.get("access-control-allow-origin"),
  });
  process.exit(1);
}

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
  (msgs) => tokenEventsFromAgentWire(msgs).length >= 1,
  15000,
);
first.close();

let applied = emptyAppliedTurn();
for (const event of tokenEventsFromAgentWire(firstBatch)) {
  applied = applyStreamEvent(applied, event);
}
if (!applied.reply) {
  console.error("AE2 chrome fail: no tokens before disconnect");
  console.error(firstBatch.slice(0, 8));
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 400));

const second = openAgentSocket(name, token);
await waitOpen(second);
second.send(
  JSON.stringify({
    type: "cf_agent_stream_resume_request",
    probeId: "ae2-chrome-probe",
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

const leftover = tokenEventsFromAgentWire(secondBatch);
const after = leftover.reduce(applyStreamEvent, emptyAppliedTurn());

console.log(
  JSON.stringify(
    {
      handshakeFrom: NEXT,
      profileId,
      conversationId,
      hydrateStatus: hydrate.status,
      before: applied.reply,
      leftoverCount: leftover.length,
      after: after.reply,
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
  console.error("AE2 chrome fail: reconnect did not continue the in-flight reply");
  process.exit(2);
}
console.log("AE2 chrome ok: Next handshake + leftover tokens after reconnect");
