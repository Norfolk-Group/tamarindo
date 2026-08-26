import { formatPct, formatUsd } from "@/lib/model/format";
import { d } from "@/lib/model/money";

export type TicketSeeds = {
  fundedUsd: number;
  drawUsd: number;
  originationFeePct: number;
  servicingBps: number;
  activationFeePct: number;
  spreadSharePct: number;
  clientRate: number;
};

export type TicketEconomics = TicketSeeds & {
  originationUsd: number;
  activationUsd: number;
  servicingY1Usd: number;
  spreadY1Usd: number;
  platformY1Usd: number;
  stackY1Usd: number;
};

/** Opening-balance sketch. Servicing and spread then decline with outstanding. */
export function calcTicketEconomics(seeds: TicketSeeds): TicketEconomics {
  const funded = d(seeds.fundedUsd);
  const draw = d(seeds.drawUsd);
  const originationUsd = funded.times(seeds.originationFeePct).toNumber();
  const activationUsd = draw.times(seeds.activationFeePct).toNumber();
  const servicingY1Usd = funded.times(seeds.servicingBps).toNumber();
  const spreadY1Usd = funded
    .times(seeds.spreadSharePct)
    .times(seeds.clientRate)
    .toNumber();
  return {
    ...seeds,
    originationUsd,
    activationUsd,
    servicingY1Usd,
    spreadY1Usd,
    platformY1Usd: originationUsd + servicingY1Usd,
    stackY1Usd: originationUsd + activationUsd + servicingY1Usd + spreadY1Usd,
  };
}

export function formatTicketTable(calc: TicketEconomics): string {
  const body = [
    [
      "Origination",
      formatPct(calc.originationFeePct),
      formatUsd(calc.originationUsd),
    ],
    [
      "Activation (of draw)",
      formatPct(calc.activationFeePct),
      formatUsd(calc.activationUsd),
    ],
    [
      "Servicing (opening)",
      `${(calc.servicingBps * 10_000).toFixed(0)} bps`,
      formatUsd(calc.servicingY1Usd),
    ],
    [
      "Spread share",
      `${formatPct(calc.spreadSharePct)} × ${formatPct(calc.clientRate)}`,
      formatUsd(calc.spreadY1Usd),
    ],
    ["Origination + servicing", "—", formatUsd(calc.platformY1Usd)],
    ["Four lines before cost", "—", formatUsd(calc.stackY1Usd)],
  ];
  return [
    "| Line | Live seed | Year-1 $ |",
    "| --- | --- | --- |",
    ...body.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

export function formatTicketNote(calc: TicketEconomics): string {
  return [
    "LIVE SNAPSHOT — compose from this table already on screen. Do not reprint it.",
    `Ticket math from live variables, not the WhatsApp paste. Funded ${formatUsd(calc.fundedUsd)}; draw ${formatUsd(calc.drawUsd)}.`,
    `Origination + first-year servicing (opening) ${formatUsd(calc.platformY1Usd)}. All four lines ${formatUsd(calc.stackY1Usd)} before cost.`,
    "Servicing and spread decline as principal amortizes. No principal on Tamarindo’s balance sheet. Do not call origination a broker fee.",
    "If rates or headlines may have moved, refresh with tools, then speak. Full books: statements, returns, sensitivity — glance, new tab / PDF / CSV / Excel.",
  ].join(" ");
}
