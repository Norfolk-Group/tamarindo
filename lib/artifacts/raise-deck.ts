import {
  UnpublishedTermsError,
  assertRaisePitchBudget,
  type DeckSlide,
  type DeckSpec,
} from "@/lib/artifacts/deck";
import { pitchBackupSlides } from "@/lib/artifacts/pitch-backups";
import { plTable, useOfFundsTable, formatUsd } from "@/lib/artifacts/pitch-tables";
import { structureDeckSlides } from "@/lib/artifacts/structure-memo";
import type { CashflowModel } from "@/lib/model/types";
import { teamSlideBullets } from "@/lib/nico/people";

export type DeckVariant = "raise" | "raise-draft" | "structure";

export type PublishedTerms = {
  version: number | null;
  status: string | null;
  payload: Record<string, unknown> | null;
};

export type PitchOptions = {
  omitPersonIds?: string[];
  templateKey?: string | null;
};

function text(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (value == null || value === "") return "";
  return String(value);
}

function money(payload: Record<string, unknown>, key: string): string {
  const raw = payload[key];
  if (raw == null || raw === "") return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return String(raw);
  return `$${n.toLocaleString("en-US")}`;
}

function askSlide(payload: Record<string, unknown>, published: boolean): DeckSlide {
  if (!published) {
    return {
      id: "ask",
      kind: "story",
      title: "The ask",
      bullets: [
        "Deal Terms are not published.",
        "Do not show this slide to investors.",
        "Nico will not invent a raise amount.",
      ],
    };
  }
  const ask = money(payload, "seedAskUsd") || text(payload, "seedAskUsd");
  return {
    id: "ask",
    kind: "story",
    title: "The ask",
    bullets: [
      ask ? `OpCo equity raise: ${ask}` : "Ask is blank in published terms",
      text(payload, "instrument") ? `Instrument: ${text(payload, "instrument")}` : "",
      money(payload, "preMoneyUsd")
        ? `Pre-money: ${money(payload, "preMoneyUsd")}`
        : text(payload, "preMoneyUsd")
          ? `Pre-money: ${text(payload, "preMoneyUsd")}`
          : "",
      text(payload, "board") ? `Board: ${text(payload, "board")}` : "",
      "This slide is the published Deal Terms record — not model imagination.",
    ].filter(Boolean),
  };
}

function icpBullets(model: CashflowModel | undefined): string[] {
  if (!model) {
    return [
      "Launch ICP: US SSN-holders, Tier 1 credit, residential in Medellín / Cartagena / Rionegro.",
      "If a deal is not an active ICP, it is not done.",
    ];
  }
  return model.contracts.map(
    (icp) =>
      `${icp.code} ${icp.name} — ${icp.city}, ${icp.neighborhood}. ${formatUsd(icp.purchasePriceUsd)}. ${icp.persona}.`,
  );
}

export function raiseDeckSpec(
  terms: PublishedTerms,
  variant: Exclude<DeckVariant, "structure"> = "raise",
  model?: CashflowModel,
  options: PitchOptions = {},
): DeckSpec {
  const published =
    Boolean(terms.version) &&
    terms.status === "published" &&
    terms.payload != null;
  if (variant === "raise" && !published) {
    throw new UnpublishedTermsError();
  }
  const payload = terms.payload ?? {};
  const omit = options.omitPersonIds;
  const first = model?.contracts.find((row) => row.id === "icp1");

  const slides: DeckSlide[] = [
    {
      id: "cover",
      kind: "story",
      title: "Tamarindo Credit",
      bullets: [
        "Credit translation for US-credit Colombians buying in Colombia.",
        "Lease-to-own homes (then autos, aircraft) — Tamarindo originates and services; vehicles hold the assets.",
        "Confidential. Not an offer until Deal Terms are published.",
      ],
    },
    {
      id: "problem",
      kind: "story",
      title: "The problem",
      bullets: [
        "A prime US borrower is a stranger at a Colombian bank.",
        "Local credit is unavailable or punitive; US banks will not take foreign collateral.",
        "The result is an all-cash market for buyers who least need to pay cash. FACT — thesis 01.",
      ],
    },
    {
      id: "why-now",
      kind: "story",
      title: "Why Tamarindo, why now",
      bullets: [
        "US credit quality does not travel; the diaspora still wants a home in Medellín or Cartagena.",
        "Intervest is the first funding vehicle — warehouse cash is not OpCo working capital.",
        "The missing piece for day-one operations is the OpCo equity raise.",
      ],
    },
    {
      id: "product",
      kind: "story",
      title: "The product",
      bullets: [
        "US-law lease + Colombian comodato (use rights). Vehicle sucursal holds title.",
        "Target 40% down, 60% max LTV. Monthly interest + local charges. Balloon / purchase option at term.",
        "Tamarindo US is a fee machine: activation, origination, servicing, ~20% interest strip. Not a lender.",
      ],
    },
    {
      id: "icp",
      kind: "story",
      title: "Who we serve",
      bullets: icpBullets(model),
    },
    {
      id: "pnl",
      kind: "story",
      title: "P&L — Tamarindo US",
      bullets: [
        "Live from the cash-flow engine. Change a variable and rebuild — do not paste a stale book.",
        first
          ? `ICP-1 lease ${formatUsd(first.monthlyLeaseUsd)}/mo at ${(first.clientRate * 100).toFixed(2)}% effective.`
          : "Run the model to place unit economics next to this table.",
      ],
      table: model
        ? plTable(model)
        : {
            headers: ["Line", "FY1"],
            rows: [["Model not loaded", "—"]],
            footnote: "Rebuild after runCashflowModel.",
          },
    },
    {
      id: "use-of-funds",
      kind: "story",
      title: "Use of funds",
      bullets: [
        "OpCo equity: people, WhatsApp/voice, legal paper, credit stack, Colombia close capability.",
        "Not for buying properties — vehicles buy assets.",
      ],
      table: model
        ? useOfFundsTable(model)
        : {
            headers: ["Use", "FY1", "Share"],
            rows: [["Model not loaded", "—", "—"]],
            footnote: "Rebuild after runCashflowModel.",
          },
    },
    {
      id: "team",
      kind: "story",
      title: "The team",
      bullets: teamSlideBullets({ omitIds: omit }),
    },
    askSlide(payload, published),
    {
      id: "close",
      kind: "story",
      title: "Next conversation",
      bullets: [
        published
          ? "The ask is the published Deal Terms record."
          : "Publish Deal Terms so the ask slide is a record, not a guess.",
        "Mike / Intervest conversation: week after Labor Day 2026 (~8 Sep). CONTEXT — thesis 06.",
        "Backup slides after thank you: method, bios, regulatory, unit economics, structure, competition.",
      ],
    },
    {
      id: "thankyou",
      kind: "thankyou",
      title: "Thank you",
      bullets: [
        "Tamarindo Credit — confidential.",
        "Questions to the working group. This is not an offer of securities.",
      ],
    },
    ...pitchBackupSlides(model, { omitPersonIds: omit }),
  ];

  assertRaisePitchBudget(slides);
  return {
    termsVersion: terms.version ?? 0,
    variant,
    generatedAt: model?.generatedAt,
    templateKey: options.templateKey ?? null,
    slides,
  };
}

export function deckSpecFromPublishedTerms(
  terms: PublishedTerms,
  model?: CashflowModel,
  options?: PitchOptions,
): DeckSpec {
  return raiseDeckSpec(terms, "raise", model, options);
}

export function structureOnlyDeckSpec(): DeckSpec {
  return {
    termsVersion: 0,
    variant: "structure",
    slides: [
      {
        id: "cover",
        title: "Tamarindo family — corporate structure",
        bullets: [
          "How the companies relate. Not a cap table. Not the ask.",
          "Source: thesis 02 (Aug 18 debrief, Aug 19 call, Ashoka Aug 21).",
        ],
      },
      ...structureDeckSlides(),
    ],
  };
}
