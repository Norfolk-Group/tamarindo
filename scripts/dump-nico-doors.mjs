/**
 * One-shot: print spoken live-walk answers. Uses the same runTurn as chat.
 *   node --env-file=.env --import tsx scripts/dump-nico-doors.mjs
 */
import { runTurn } from "../lib/nico/orchestrator.ts";

const actor = {
  kind: "user",
  id: "dev-local",
  displayName: "Ricardo (dev)",
  role: "admin",
};

async function play(message) {
  let spoken = "";
  const labels = [];
  for await (const event of runTurn(message, actor, {
    conversationId: `dump-${Date.now()}`,
  })) {
    if (event.type === "token") spoken += event.text;
    if (event.type === "activity" && event.label) labels.push(event.label);
  }
  return { spoken, labels };
}

const explain = await play("how does Tamarindo work");
console.log("=== THINKING ===");
console.log(explain.labels.filter((l) => /think/i.test(l)).slice(0, 4).join(" | "));
console.log("=== EXPLAIN ===");
console.log(explain.spoken.trim().slice(0, 1200));
console.log("=== TICKET ===");
const ticket = await play("what do we make on a $500k lease");
console.log(ticket.spoken.trim().slice(0, 800));
