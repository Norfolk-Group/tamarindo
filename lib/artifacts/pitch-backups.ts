import type { DeckSlide } from "@/lib/artifacts/deck";
import type { CashflowModel } from "@/lib/model/types";
import { formatUsd } from "@/lib/artifacts/pitch-tables";
import { TAMARINDO_PEOPLE } from "@/lib/nico/people";

export type BackupOptions = {
  omitPersonIds?: string[];
};

function icp1(model: CashflowModel) {
  return model.contracts.find((row) => row.id === "icp1");
}

/** Fixed-topic backups after thank you. Numbers may refresh; topics do not. */
export function pitchBackupSlides(
  model: CashflowModel | undefined,
  options: BackupOptions = {},
): DeckSlide[] {
  const omit = new Set(options.omitPersonIds ?? []);
  const first = icp1(model ?? ({ contracts: [] } as unknown as CashflowModel));
  const bios = TAMARINDO_PEOPLE.filter((person) => person.onPayroll && !omit.has(person.id)).map(
    (person) => person.line.split(" FACT")[0] ?? person.slide,
  );

  return [
    {
      id: "backup-methodology",
      kind: "backup",
      title: "Methodology",
      bullets: [
        "Cash-flow engine: lib/model/engine.ts. Same cells as the Excel artifact.",
        "Labels: FACT (sourced), CONTEXT (meetings), OPINION (named), ASSUMPTION (unset).",
        "Ask, pre-money, and instrument come only from published Deal Terms.",
        "Nico will not invent a raise or paste last week's PNG of the book.",
      ],
    },
    {
      id: "backup-bios",
      kind: "backup",
      title: "Team bios",
      bullets:
        bios.length > 0
          ? bios
          : ["No named operators on this cut. Chat asked to omit the roster."],
    },
    {
      id: "backup-regulatory",
      kind: "backup",
      title: "Regulatory environment",
      bullets: [
        "US-law lease + Colombian comodato (use rights). Vehicle sucursal holds title.",
        "Tamarindo originates and services. It is not a Colombian bank and not the lender.",
        "Banks and bank brokers keep the same risk decision — they are not this product.",
        "Volvé is the closest USD/no-bank mortgage. Tamarindo is a lease, not a bank loan. CONTEXT — Natalia benchmark.",
      ],
    },
    {
      id: "backup-unit-econ",
      kind: "backup",
      title: "Unit economics",
      bullets: first
        ? [
            `ICP-1 ${first.name}: ${formatUsd(first.purchasePriceUsd)} home, ${first.termMonths / 12}-year term.`,
            `Down ${formatUsd(first.downPaymentUsd)}; funded ${formatUsd(first.fundedUsd)}; balloon floor ${formatUsd(first.residualUsd)}.`,
            `Effective client rate ${(first.clientRate * 100).toFixed(2)}%. Lease ${formatUsd(first.monthlyLeaseUsd)}/mo. Model output.`,
            "Homes rent ~30% of the time. Ashoka runs the pool when the client is not in the house.",
          ]
        : [
            "Run the cash-flow engine to fill ICP-1. Residual floor is 20% of asset.",
          ],
    },
    {
      id: "backup-structure",
      kind: "backup",
      title: "Corporate structure",
      bullets: [
        "Tamarindo US (OpCo) — platform, origination, servicing. Owns no properties.",
        "Tamarindo-Intervest LLC — first funding vehicle. Warehouse is not OpCo payroll.",
        "Tamarindo Colombia — sucursal: close, comodato, inspections.",
        "Ashoka — sister operator for the rental pool. Related-party, disclosed, terminable.",
      ],
    },
    {
      id: "backup-competition",
      kind: "backup",
      title: "Competitive frame",
      bullets: [
        "Colombian banks: local credit, local risk decision.",
        "Bank brokers: same bank decision, nicer front door.",
        "Volvé: USD, no bank — still a mortgage.",
        "Tamarindo: full break from the Colombian financial system. Draft; no verified demo; no committed OpCo capital. CONTEXT — Natalia.",
      ],
    },
  ];
}
