import { VARIABLE_DEFS } from "@/lib/model/variables";

export type VariableSection = {
  id: string;
  title: string;
  blurb: string;
  order: number;
};

/** Display copy for assumption groups. `id` matches VariableDef.group. */
export const VARIABLE_SECTIONS: VariableSection[] = [
  { id: "Capital", title: "Funding lines", blurb: "Intervest capacity and how the book steps up.", order: 10 },
  { id: "Capital partners", title: "Later vehicles", blurb: "Partners after Intervest exclusivity.", order: 20 },
  { id: "Year-10 goals", title: "Year-10 book", blurb: "Where funded AUM and lines should land.", order: 30 },
  { id: "Lease", title: "Lease terms", blurb: "Down payment, balloon floor, and the lease math.", order: 40 },
  { id: "Fees", title: "Tamarindo fees", blurb: "Activation, origination, servicing.", order: 50 },
  { id: "Fees Credit is paid", title: "Fees Credit is paid", blurb: "Industry-standard income. Zero until Credit turns a lever on.", order: 52 },
  { id: "Fees Credit pays", title: "Fees Credit pays", blurb: "Warehouse, hedge, referring-partner, bureau. Zero until scheduled.", order: 54 },
  { id: "Rental pricing", title: "Rental share", blurb: "How OpCo takes a slice of furnished rent.", order: 60 },
  { id: "Ashoka", title: "Ashoka pool", blurb: "STR management, opt-in, and related-party repairs.", order: 70 },
  { id: "ICP contracts", title: "Ideal Contract Profiles", blurb: "Admin-only — edit under Admin → ICPs.", order: 80 },
  { id: "Credit pricing", title: "Credit and FICO", blurb: "Spreads and credit tiers on the lease rate.", order: 90 },
  { id: "Origination", title: "Volume and mix", blurb: "How many homes, and which ICP, each year.", order: 100 },
  { id: "2027 ramp", title: "2027 ramp", blurb: "The pilot-year climb off the January cohort.", order: 110 },
  { id: "Autos", title: "Auto leases", blurb: "When cars start and how many versus homes. Tickets live under Admin → ICPs.", order: 120 },
  { id: "Aircraft", title: "Aircraft leases", blurb: "When aviation starts and yearly count. Hulls live under Admin → ICPs.", order: 130 },
  { id: "OpCo", title: "US operating cost", blurb: "Lump opex when the department roster is off.", order: 140 },
  { id: "Colombia", title: "Colombia operating cost", blurb: "Sucursal fees, lumps, and local cost.", order: 150 },
  { id: "People US", title: "US team", blurb: "Named pay and department seats.", order: 160 },
  { id: "People Colombia", title: "Colombia team", blurb: "GM, closings, field, and WhatsApp seats.", order: 170 },
  { id: "Workplace", title: "Workplace", blurb: "Office seats and work-from-home.", order: 180 },
  { id: "Equity", title: "Ownership and pay", blurb: "Partners, rounds, and founder pay windows.", order: 190 },
  { id: "Horizon", title: "Plan horizon", blurb: "Fiscal years and the start month.", order: 200 },
];

export const ASSUMPTION_HIDDEN_GROUPS = new Set(["ICP contracts"]);

export const ASSUMPTION_HIDDEN_KEYS = new Set([
  "autoTicketUsd",
  "autoTermMonths",
  "autoClientRate",
  "aircraftTicketUsd",
  "aircraftTermMonths",
  "aircraftClientRate",
]);

const BY_ID = new Map(VARIABLE_SECTIONS.map((section) => [section.id, section]));

export const DEFAULT_OPEN_SECTIONS = ["Capital", "Lease", "Fees"];

export function sectionForGroup(group: string): VariableSection {
  return (
    BY_ID.get(group) ?? {
      id: group,
      title: group,
      blurb: "",
      order: 500,
    }
  );
}

export function groupedVariableIds(): string[] {
  return [...new Set(VARIABLE_DEFS.map((def) => def.group))];
}
