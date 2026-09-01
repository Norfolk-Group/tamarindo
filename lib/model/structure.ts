/**
 * Tamarindo family map. Source: knowledge/thesis/02-entities.md.
 * Credit manages Intervest — it does not own it. Ashoka is a sister, not OpCo.
 */

export type StructureEntity = {
  id: string;
  name: string;
  jurisdiction: string;
  role: string;
  ownsAssets: string;
  relationship: string;
  earns: string;
};

export type StructureFlowStep = {
  id: string;
  step: string;
  who: string;
  what: string;
};

export const STRUCTURE_ENTITIES: readonly StructureEntity[] = [
  {
    id: "intervest-global",
    name: "Intervest / Global",
    jurisdiction: "Capital partner",
    role: "Owns 100% of the funding vehicle",
    ownsAssets: "No — owns the vehicle",
    relationship: "Counterparty. Not a Tamarindo subsidiary.",
    earns: "Warehouse return on the lease book",
  },
  {
    id: "credit",
    name: "Tamarindo Credit, LLC",
    jurisdiction: "Delaware OpCo",
    role: "Originator, servicer, biller. Manages the vehicle.",
    ownsAssets: "No — never owns properties",
    relationship: "Manages Tamarindo Intervest. Does not own it.",
    earns: "Activation, origination, servicing, ~20% interest strip, rental share",
  },
  {
    id: "vehicle",
    name: "Tamarindo Intervest, LLC",
    jurisdiction: "Delaware vehicle",
    role: "Funding vehicle #1. US-law lease lives here.",
    ownsAssets: "Yes — via its Colombian sucursal",
    relationship: "100% owned by Intervest. Credit services it.",
    earns: "Down payment, remittance, purchase-option balloon",
  },
  {
    id: "partner",
    name: "Tamarindo-[Partner] LLC",
    jurisdiction: "Future US LLC",
    role: "Vehicles #2..N — same template, new owner",
    ownsAssets: "Yes — same sucursal pattern",
    relationship: "Not formed. Same rails, new economics page.",
    earns: "Same vehicle cash, different LP",
  },
  {
    id: "credit-sucursal",
    name: "Tamarindo Credit, Sucursal Colombia",
    jurisdiction: "Colombia branch of Credit",
    role: "Local ops: bills, repairs, PM liaison, notary support",
    ownsAssets: "No",
    relationship: "Owned by Credit. Not a third OpCo.",
    earns: "Client closing, diligence, admin fees + US mandate (model)",
  },
  {
    id: "vehicle-sucursal",
    name: "Tamarindo Intervest, Sucursal Colombia",
    jurisdiction: "Colombia branch of the vehicle",
    role: "Buys and holds title to the asset",
    ownsAssets: "Yes — title sits here until the option",
    relationship: "Owned by Tamarindo Intervest, LLC",
    earns: "Title / recovery. Formulario 4 funds it from the US parent.",
  },
  {
    id: "ashoka",
    name: "Ashoka",
    jurisdiction: "Sister company",
    role: "Property management, maintenance, rental pool",
    ownsAssets: "No",
    relationship: "Related-party operator. Not OpCo and not Intervest.",
    earns: "Market-rate PM fees; repair charge-through + markup",
  },
  {
    id: "client",
    name: "Client",
    jurisdiction: "US lessee",
    role: "Comodato use rights + purchase option",
    ownsAssets: "No until the balloon / option",
    relationship: "US-law lease with the Intervest vehicle",
    earns: "Use of the home; rental credit when away",
  },
];

export const STRUCTURE_FLOW: readonly StructureFlowStep[] = [
  {
    id: "close",
    step: "1. Closing",
    who: "Client → Intervest vehicle",
    what: "Wires ~40% down. Vehicle sucursal buys the asset. Credit takes 2% activation on the draw + origination.",
  },
  {
    id: "monthly",
    step: "2. Monthly",
    who: "Client → vehicle (via Credit)",
    what: "Pays the US-law lease. Credit keeps servicing + ~20% of billings; remits the rest to the vehicle.",
  },
  {
    id: "rental",
    step: "3. When rented",
    who: "Ashoka → waterfall",
    what: "Default ~30% of time. Gross → Ashoka mgmt → costs → Tamarindo share → client credit against the lease.",
  },
  {
    id: "exit",
    step: "4. Exit",
    who: "Client exercises option",
    what: "Pays the residual balloon. Title leaves the sucursal. Vehicle recycles capital.",
  },
  {
    id: "default",
    step: "5. Default",
    who: "Vehicle sucursal",
    what: "Comodato ends. Title already sits here. Re-lease or sell. Down payment is the cushion.",
  },
];
