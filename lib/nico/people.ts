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
    name: "Dov Tuzman",
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
    line: "Dov Tuzman (Kaleil Dov Isaza Tuzman / KD) — Founder and Managing Director. Leads the calls and the Intervest conversation. Sits in the US, works from home, travels Colombia about every six weeks (Medellín HQ and Cartagena). His ~$30k/mo sketch is the 20% interest strip on a $20M pilot, not OpCo revenue. Paid from Tamarindo Credit US. Vehicle cash does not pay him.",
    slide: "Dov Tuzman — Founder & MD. Capital partners and the Intervest relationship.",
    onPayroll: true,
  },
  {
    id: "rosario",
    name: "Rosario Davi",
    role: "Finance Director",
    aliases: ["rosario", "rosario davi", "rosario david", "davi"],
    line: "Rosario Davi — Finance Director. Investor-deck quarterback. Owns the financial narrative with Ricardo. Human-in-the-loop on US credit, funding, and exceptions — not a second analyst seat. Sits in the US (WFH); Colombia about four times a year for closings and the books. Paid from Tamarindo Credit US.",
    slide: "Rosario Davi — Finance Director. Deck, numbers, and HITL on the book.",
    onPayroll: true,
  },
  {
    id: "ricardo",
    name: "Ricardo Cidale",
    role: "Director of Planning and Corporate Development",
    aliases: ["ricardo", "cidale", "ricardo cidale"],
    line: "Ricardo Cidale — Director of Planning and Corporate Development. Owns projections, the model, and presentation coherence. Sits in the US, works from home, travels Colombia about every six weeks (Medellín HQ and Cartagena). Paid from Tamarindo Credit US. He is also MD of Norfolk AI, the shop that builds this software. Norfolk AI is not Tamarindo, not a capital partner, and has no seat on the deal.",
    slide: "Ricardo Cidale — Director of Planning and Corporate Development. Model and the Nico platform.",
    onPayroll: true,
  },
  {
    id: "tom",
    name: "Tom Herman",
    role: "Director of Information Systems",
    aliases: ["tom", "herman", "tom herman"],
    line: "Tom Herman — Director of Information Systems. Platform and credit-stack. He is the US IT budget — no extra IT FTE. Time box from the sources: 5–10 hours/week. Sits in the US (WFH); Colombia about twice a year for the stack. Paid from Tamarindo Credit US, not the Intervest warehouse. Aug 26: confirm the app shows 12–84 month vehicle terms.",
    slide: "Tom Herman — Director of Information Systems. Platform and credit-stack (part-time at launch).",
    onPayroll: true,
  },
  {
    id: "boris",
    name: "Boris Mulett",
    role: "General Manager, Colombia",
    aliases: ["boris", "mulett", "boris mulett"],
    line: "Boris Mulett — General Manager, Colombia. Closings, field, and the local book.",
    slide: "Boris Mulett — General Manager, Colombia. Closings and the local book.",
    onPayroll: true,
  },
  {
    id: "natalia",
    name: "Natalia Carvajal",
    role: "Director of Marketing, Colombia",
    aliases: ["natalia", "carvajal", "natalia carvajal"],
    line: "Natalia Carvajal — Director of Marketing, Colombia. Colombia-based. Paid by another entity — Tamarindo OpCo loaded pay is $0 for budget.",
    slide: "Natalia Carvajal — Director of Marketing, Colombia. Comp not on the Tamarindo budget.",
    onPayroll: false,
  },
  {
    id: "andres",
    name: "Andrés Sierra",
    role: "Director of Business Development, Colombia",
    aliases: ["andrés", "andres", "sierra", "andrés sierra", "andres sierra"],
    line: "Andrés Sierra — Director of Business Development, Colombia. One of several Colombia BD directors (with Jesi Gomes). Broker and commercial channels.",
    slide: "Andrés Sierra — Director of Business Development, Colombia.",
    onPayroll: true,
  },
  {
    id: "ivan",
    name: "Iván Arias",
    role: "Government Relations, Colombia",
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
    line: "Iván Arias (Atias in the Launch Team WhatsApp) — Government Relations, Colombia (Bogotá). Bank/government alliance conversations sit with him. Not the Intervest vehicle.",
    slide: "Iván Arias — Government Relations, Colombia.",
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
    role: "Stakeholder (Colombia channels)",
    aliases: [
      "juan pablo",
      "hoyos",
      "jphoyosq",
      "juan pablo hoyos",
      "ojos",
    ],
    line: "Juan Pablo Hoyos — stakeholder for now (Medellín / Oriente channels). Not a titled OpCo seat. Not on Tamarindo payroll until that changes.",
    slide: "Juan Pablo Hoyos — Stakeholder. Colombia channels.",
    onPayroll: false,
  },
  {
    id: "jesse",
    name: "Jesi Gomes",
    role: "Director of Business Development, Colombia",
    aliases: [
      "jesse",
      "jesi",
      "gomez",
      "gomes",
      "jesse gomez",
      "jesi gomez",
      "jesi gomes",
      "jesse gomes",
    ],
    line: "Jesi Gomes — Director of Business Development, Colombia. Notes also say Jesse Gomez; same seat. Paid by another entity — Tamarindo OpCo loaded pay is $0 for budget. Aviation is out of this Intervest warehouse.",
    slide: "Jesi Gomes — Director of Business Development, Colombia. Comp not on the Tamarindo budget.",
    onPayroll: false,
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
