import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";
import type { StarSign } from "@/lib/nico/world-intent";

/**
 * Daily parlor horoscope. Entertainment, not astronomy.
 * Seeded by sign + UTC date so the same day is stable.
 */

const LINES: Record<StarSign, string[]> = {
  aries: [
    "Start the thing you have been circling. Do not start three things.",
    "A blunt sentence today is cheaper than a week of hints.",
  ],
  taurus: [
    "Keep the good chair. Change the bad process.",
    "Money likes patience today. So does lunch.",
  ],
  gemini: [
    "Two conversations, one decision. Write the decision down.",
    "Your joke lands if you stop explaining it.",
  ],
  cancer: [
    "Call the person you almost texted. Then get back to work.",
    "Home base first. Then the heroic errand.",
  ],
  leo: [
    "You do not need a bigger entrance. You need a cleaner ask.",
    "Someone is waiting for you to go first. Go first.",
  ],
  virgo: [
    "The spreadsheet can wait ten minutes. The honest sentence cannot.",
    "Fix one messy name. Leave the rest of the mess for Friday.",
  ],
  libra: [
    "Stop splitting the difference. Pick the kind option that still has teeth.",
    "Aesthetics are a strategy today. Ugly slides lose money.",
  ],
  scorpio: [
    "You already know. Act like you know.",
    "Privacy is not secrecy. Share the number, keep the motive.",
  ],
  sagittarius: [
    "A trip is not the only way out. A true sentence works too.",
    "Aim further than the room. Then do the boring next step.",
  ],
  capricorn: [
    "Status is a side effect. The deliverable is the point.",
    "Say no once, clearly. You will get the afternoon back.",
  ],
  aquarius: [
    "The weird idea is the good one. Prototype it before the committee.",
    "People catch up if you leave a map. Leave a map.",
  ],
  pisces: [
    "Feel it, then name it in one line, then file it.",
    "Soft is not weak if the boundary is visible.",
  ],
};

function dayKey(sign: StarSign, isoDay: string): number {
  let n = 0;
  const s = `${sign}:${isoDay}`;
  for (let i = 0; i < s.length; i++) n = (n * 33 + s.charCodeAt(i)) >>> 0;
  return n;
}

export const horoscopeGet = defineProcedure({
  name: "horoscope.get",
  description:
    "A playful daily horoscope line. Entertainment only. Deterministic per sign and UTC day.",
  input: z.object({
    sign: z.enum([
      "aries",
      "taurus",
      "gemini",
      "cancer",
      "leo",
      "virgo",
      "libra",
      "scorpio",
      "sagittarius",
      "capricorn",
      "aquarius",
      "pisces",
    ]),
  }),
  output: z.object({
    sign: z.string(),
    day: z.string(),
    line: z.string(),
    disclaimer: z.string(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ sign }) => {
    const day = new Date().toISOString().slice(0, 10);
    const lines = LINES[sign];
    const line = lines[dayKey(sign, day) % lines.length]!;
    return {
      sign,
      day,
      line,
      disclaimer:
        "Parlor game. Not advice, not astronomy, not a Tamarindo forecast.",
    };
  },
});
