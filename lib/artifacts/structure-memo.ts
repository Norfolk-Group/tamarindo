import type { DeckSlide } from "@/lib/artifacts/deck";

/**
 * Corporate map Nico can turn into a memo or slides.
 * Numbers stay labeled. Ashoka is a sister operator, not OpCo.
 */

export function structureDeckSlides(): DeckSlide[] {
  return [
    {
      id: "structure-map",
      title: "The Tamarindo family",
      bullets: [
        "Tamarindo US (OpCo) — platform, origination, underwriting, servicing, billing.",
        "Tamarindo-Intervest LLC — funding vehicle #1. Intervest capital. Owns assets via its sucursal.",
        "Tamarindo Colombia — local close, title/notary, comodato, inspections.",
        "Ashoka — sister company: maintenance, property management, rental pool. Not the OpCo.",
      ],
    },
    {
      id: "structure-us",
      title: "Tamarindo US — where the venture value sits",
      bullets: [
        "Investors in the raise buy into this entity — brand, policy, rails, partner relationships.",
        "Earns activation, origination, servicing, ~20% interest strip, rental share.",
        "Owns no properties, ever.",
      ],
    },
    {
      id: "structure-vehicle",
      title: "Tamarindo-Intervest — vehicle #1",
      bullets: [
        "Warehouse funds leases. Client default and recovery sit here, cushioned by ~40% down / 60% LTV.",
        "Template for Tamarindo-[Partner] LLC #2..N — same rails, new economics page.",
        "Vehicle cash is not OpCo payroll.",
      ],
    },
    {
      id: "structure-colombia",
      title: "Tamarindo Colombia",
      bullets: [
        "Sucursal / local execution: diligence support, notary, comodato, recovery.",
        "Model override (Ricardo 23 Aug): for-profit sucursal — client closing, diligence, admin fees + US mandate.",
        "Allowed to run cash-flow negative while the book is thin. Not a nonprofit cost center.",
      ],
    },
    {
      id: "structure-ashoka",
      title: "Ashoka — the service layer",
      bullets: [
        "Runs the rental pool when the client is not in the home (~30% of time in the model).",
        "Earns mgmt fee (~20% of gross STR, ASSUMPTION), repair charge-through + markup.",
        "Related-party: market rates, disclosed, terminable. Sloppy Ashoka is a diligence red flag.",
      ],
    },
    {
      id: "structure-flow",
      title: "Money on one deal",
      bullets: [
        "Client wires down payment; vehicle draws the funded amount; US takes activation + origination.",
        "Monthly: client pays the US-law lease. US keeps servicing + spread; remits the rest to the vehicle.",
        "If rented: Ashoka splits gross → mgmt → costs → Tamarindo share → client credit.",
        "Exit: balloon / purchase option; title leaves the sucursal. Default: comodato ends; sucursal already holds title.",
      ],
    },
  ];
}

export function structureMemoMarkdown(): { title: string; body: string } {
  return {
    title: "Tamarindo family — corporate structure",
    body: `# Tamarindo family — corporate structure

*FACT / OPINION / ASSUMPTION labeled. Source: knowledge/thesis/02-entities.md.*

## Who does what

| Entity | Role | Owns assets? | Pays the team? |
|---|---|---|---|
| **Tamarindo US (OpCo / Tamarindo Credit LLC)** | Platform, origination, underwriting, servicing, billing | No | Yes — this is the venture |
| **Tamarindo-Intervest LLC** | Funding vehicle #1 | Yes, via Colombian sucursal | No |
| **Future Tamarindo-[Partner] LLC** | Same template, new capital | Yes | No |
| **Tamarindo Colombia** | Close, title, comodato, inspections, recovery | No (the vehicle sucursal holds title) | Local desks; billed from US + client fees |
| **Ashoka** | Maintenance, property management, rental operations | No | Its own P&L (sister, related-party) |

## How they connect

1. The vehicle sucursal holds title and grants the client a comodato + purchase option.
2. The client pays a US-law lease to Tamarindo US.
3. Tamarindo US keeps fees and the spread strip, remits the rest to the vehicle.
4. Tamarindo US mandates Tamarindo Colombia for local work.
5. Tamarindo Colombia contracts Ashoka to manage and rent the unit when the client is away.

## Ashoka, plainly

Ashoka is **not** Tamarindo US and **not** Intervest. It is the operator of the homes: cleaning, repairs, listings, guest/tenant work. Vehicle LPs will read the related-party contract. Price at documented market rates. Make it terminable.

## What this memo is not

- Not a cap table. Five equal partners at t=0; names unassigned (thesis 11).
- Not the Intervest 2-and-20 story. Tamarindo's take is fees + spread.
- Not legal advice. Lease characterization and tax of the sucursal are still open.
`,
  };
}
