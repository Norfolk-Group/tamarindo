import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";
import { STAR_SIGNS, type StarSign } from "@/lib/nico/world-intent";

const LINES = [
  "A labeled number beats a lucky feeling. Still: drink water.",
  "Someone will want a stacked TAM. You do not have to give it to them.",
  "The meeting is real. The cosmos is a parlor trick. Go if the box is clean.",
  "You already know the ugly sentence. Say it before the coffee cools.",
  "Do not confuse a green day in equities with a green light on the lease.",
  "Take the walk. Leave the spreadsheet on the desk for twenty minutes.",
  "If they cannot name the residual, they cannot name the deal.",
  "Charm is allowed. Padding a rate is not.",
  "The day is ordinary. That is not an insult. Ordinary is where closings happen.",
  "Ask the second question. The first one was a courtesy.",
  "A delay is not a omen. It is a calendar.",
  "Text the person you owe a sentence to. Then we can talk LTV.",
];

function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function pickLine(sign: string, day: string): string {
  let hash = 0;
  const seed = `${sign}:${day}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return LINES[hash % LINES.length]!;
}

export const horoscopeGet = defineProcedure({
  name: "horoscope.get",
  description:
    "A playful daily horoscope line. Entertainment only. Deterministic per sign and UTC day.",
  input: z.object({
    sign: z.enum(STAR_SIGNS),
  }),
  output: z.object({
    sign: z.string(),
    line: z.string(),
    disclaimer: z.string(),
    day: z.string(),
  }),
  minRole: "guest",
  requiresApproval: false,
  handler: async ({ sign }) => {
    const day = utcDay();
    const typed = sign.toLowerCase() as StarSign;
    return {
      sign: typed,
      line: pickLine(typed, day),
      disclaimer: "Parlor card, not astronomy. Not investment advice.",
      day,
    };
  },
});
