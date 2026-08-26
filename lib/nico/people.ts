/**
 * Named Tamarindo seats. FACT from the Aug 18 debrief, Aug 19 call,
 * Aug 26 Granola, and thesis 06/09/11/20. Not a cap table — thesis 11
 * still has five equal partners with names unassigned.
 */

export type Person = {
  id: string;
  name: string;
  role: string;
  aliases: string[];
  line: string;
  /** Short line for the investor team slide. */
  slide: string;
  onPayroll: boolean;
};

export const TAMARINDO_PEOPLE: Person[] = [
  {
    id: "dov",
    name: "Kaleil Dov Isaza Tuzman",
    role: "Founder / Managing Director",
    aliases: [
      "dov",
      "kd",
      "kaleil",
      "tuzman",
      "kaleil dov",
      "isaza tuzman",
      "kaleil dov isaza tuzman",
    ],
    line: "Kaleil Dov Isaza Tuzman (Dov / KD) — founder and Managing Director. Leads the calls and the Intervest conversation. His ~$30k/mo sketch is the 20% interest strip on a $20M pilot, not OpCo revenue. Model seat pay.dovLoadedUsd ≈ $26,973/mo loaded. Vehicle cash does not pay him.",
    slide: "Kaleil Dov Isaza Tuzman — Founder & MD. Capital partners and the Intervest relationship.",
    onPayroll: true,
  },
  {
    id: "rosario",
    name: "Rosario David",
    role: "CFO / COO",
    aliases: ["rosario", "rosario david", "rosario davi", "davi"],
    line: "Rosario David (sometimes Davi in the model) — CFO/COO. Investor-deck quarterback. Owns the financial narrative with Ricardo.",
    slide: "Rosario David — CFO/COO. Deck, numbers, and operating cadence.",
    onPayroll: true,
  },
  {
    id: "ricardo",
    name: "Ricardo Cidale",
    role: "Ops / model / technology",
    aliases: ["ricardo", "cidale", "ricardo cidale"],
    line: "Ricardo Cidale — ops, model, and technology-AI for Tamarindo. Owns projections and presentation coherence. He is also MD of Norfolk AI, the shop that builds this software. Norfolk AI is not Tamarindo, not a capital partner, and has no seat on the deal.",
    slide: "Ricardo Cidale — Operations, financial model, and the Nico platform.",
    onPayroll: true,
  },
  {
    id: "tom",
    name: "Tom Herman",
    role: "CTO",
    aliases: ["tom", "herman", "tom herman"],
    line: "Tom Herman — CTO / platform lead. Time box from the sources: 5–10 hours/week. Equity funds this seat, not the Intervest warehouse. Aug 26: confirm the app shows 12–84 month vehicle terms; UX sync with Natalia.",
    slide: "Tom Herman — CTO. Platform and credit-stack build (part-time at launch).",
    onPayroll: true,
  },
  {
    id: "boris",
    name: "Boris Mulett",
    role: "Colombia operations",
    aliases: ["boris", "mulett", "boris mulett"],
    line: "Boris Mulett — Colombia ops anchor. Closings, field, and the local book. Building the Colombian operating budget (property management and local costs).",
    slide: "Boris Mulett — Colombia operations. Closings and the local book.",
    onPayroll: true,
  },
  {
    id: "natalia",
    name: "Natalia Carvajal",
    role: "Marketing Director (interim)",
    aliases: ["natalia", "carvajal", "natalia carvajal"],
    line: "Natalia Carvajal — Marketing Director (for now). Brand, design, and the competitor map. Aug 26: covering brand and deck while Rosario is on vacation; sync with Tom on app UX. FACT — Granola 26 Aug 2026.",
    slide: "Natalia Carvajal — Marketing Director. Brand and the competitive frame.",
    onPayroll: true,
  },
  {
    id: "andres",
    name: "Andrés Sierra",
    role: "GTM / channels",
    aliases: ["andrés", "andres", "sierra", "andrés sierra", "andres sierra"],
    line: "Andrés Sierra — GTM and commercial channels. Broker relationships; long-term marketplace / matching vision.",
    slide: "Andrés Sierra — Go-to-market and broker channels.",
    onPayroll: true,
  },
  {
    id: "ivan",
    name: "Iván Arias",
    role: "Government relations",
    aliases: [
      "iván",
      "ivan",
      "arias",
      "atias",
      "iván arias",
      "ivan arias",
      "iván atias",
      "ivan atias",
    ],
    line: "Iván Arias (Atias in the Launch Team WhatsApp) — government relations (Bogotá). Bank/government alliance conversations sit with him. Not the Intervest vehicle. FACT — WhatsApp Launch Team, Jun–Aug 2026.",
    slide: "Iván Arias — Government relations, Bogotá.",
    onPayroll: true,
  },
  {
    id: "mike",
    name: "Michael Gontar",
    role: "Intervest counterpart",
    aliases: [
      "mike",
      "gontar",
      "gunther",
      "mike gontar",
      "mike gunther",
      "michael gontar",
    ],
    line: "Michael (Mike) Gontar — Intervest counterpart. Notes sometimes say Gunther; same seat. Aug 26 box: $20M both asset classes at once, 780+, ~500 bps over IBOR, 2+20, aviation out of this warehouse. Not Tamarindo payroll.",
    slide: "Michael Gontar — Intervest (capital partner). Not Tamarindo payroll.",
    onPayroll: false,
  },
  {
    id: "juanpablo",
    name: "Juan Pablo Hoyos",
    role: "Medellín / Oriente channels",
    aliases: [
      "juan pablo",
      "hoyos",
      "jphoyosq",
      "juan pablo hoyos",
      "ojos",
    ],
    line: "Juan Pablo Hoyos — channel sales and partnerships in Medellín and Oriente; foreign buyers for homes and cars, with his sister. Added to the Launch Team WhatsApp 14 Aug 2026. FACT — Dov in that thread.",
    slide: "Juan Pablo Hoyos — Medellín / Oriente channels. Homes and cars.",
    onPayroll: true,
  },
  {
    id: "jesse",
    name: "Jesse Gomez",
    role: "Aviation / high-value assets",
    aliases: ["jesse", "jesi", "gomez", "jesse gomez", "jesi gomez"],
    line: "Jesse / Jesi Gomez — high-value assets and commercial. New on the Aug 19 call. Aug 26: on the Tamarindo call; rental-fee framing (insurance vs explicit fee). Aviation is out of the Intervest-pilot model — that is a product decision, not a seat change. FACT — Granola 26 Aug 2026.",
    slide: "Jesse Gomez — High-value assets and commercial. Aviation is not in this warehouse.",
    onPayroll: true,
  },
];

const WHO_RE = /\bwho(?:'s|’s| is| was)\b/i;

export function namedPeopleIn(message: string): Person[] {
  const lower = message.toLowerCase();
  return TAMARINDO_PEOPLE.filter((person) =>
    person.aliases.some((alias) => {
      if (!alias.includes(" ")) return new RegExp(`\\b${escapeRe(alias)}\\b`, "i").test(lower);
      return lower.includes(alias);
    }),
  );
}

export function isPersonAsk(message: string): boolean {
  return namedPeopleIn(message).length > 0 || WHO_RE.test(message);
}

export function peopleNoteFor(message: string): string | undefined {
  const hits = namedPeopleIn(message);
  if (hits.length === 0) return undefined;
  return [
    "Tamarindo people (FACT from the Aug 18 debrief, Aug 19 call, and Aug 26 Granola — not a cap table):",
    ...hits.map((p) => `- ${p.line}`),
    "Thesis 11: five equal partners at t=0; names not assigned to the 20% seats.",
    "Norfolk AI builds Nico. It is not Tamarindo and is not a capital partner.",
    "Do not discuss anyone's personal or legal matters — history, litigation, family, health, finances. Role and seat only. Stay on the Tamarindo brief.",
  ].join("\n");
}

export function teamSlideBullets(opts?: { omitIds?: string[] }): string[] {
  const omit = new Set(opts?.omitIds ?? []);
  return TAMARINDO_PEOPLE.filter((p) => p.onPayroll && !omit.has(p.id)).map((p) => p.slide);
}

export function personIdSetFromMessage(message: string): string[] {
  return namedPeopleIn(message).map((person) => person.id);
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
