import { cents, d } from "@/lib/model/money";
import { num, type VariableValue } from "@/lib/model/variables";

export type EquityRound = {
  id: string;
  label: string;
  monthIndex: number;
  amountUsd: number;
  preMoneyUsd: number;
  postMoneyUsd: number;
  percentSold: number;
};

export type CapRow = {
  id: string;
  name: string;
  klass: "founder" | "investor";
  percent: number;
};

export type CapTable = {
  founderCount: number;
  founderPercentStart: number;
  founderPercentEnd: number;
  eachFounderStart: number;
  eachFounderEnd: number;
  rounds: EquityRound[];
  holdersEnd: CapRow[];
  raisedUsd: number;
};

type Stake = { id: string; name: string; klass: CapRow["klass"]; weight: number };

export function plannedRounds(values: Record<string, VariableValue>): EquityRound[] {
  const specs = [
    {
      id: "r1",
      label: "Round 1 — start operations",
      month: Math.round(num(values, "equityRound1Month")),
      amount: num(values, "equityRound1Usd"),
      pre: num(values, "equityRound1PreMoneyUsd"),
    },
    {
      id: "r2",
      label: "Round 2",
      month: Math.round(num(values, "equityRound2Month")),
      amount: num(values, "equityRound2Usd"),
      pre: num(values, "equityRound2PreMoneyUsd"),
    },
    {
      id: "r3",
      label: "Round 3",
      month: Math.round(num(values, "equityRound3Month")),
      amount: num(values, "equityRound3Usd"),
      pre: num(values, "equityRound3PreMoneyUsd"),
    },
    {
      id: "r4",
      label: "Round 4 (optional)",
      month: Math.round(num(values, "equityRound4Month")),
      amount: num(values, "equityRound4Usd"),
      pre: num(values, "equityRound4PreMoneyUsd"),
    },
  ];
  return specs
    .filter((row) => row.amount > 0)
    .map((row) => {
      const post = cents(d(row.pre).plus(row.amount));
      const percentSold = row.pre > 0 ? d(row.amount).div(post).toNumber() : 0;
      return {
        id: row.id,
        label: row.label,
        monthIndex: row.month,
        amountUsd: row.amount,
        preMoneyUsd: row.pre,
        postMoneyUsd: post,
        percentSold,
      };
    });
}

export function equityProceedsAt(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  return cents(
    plannedRounds(values)
      .filter((row) => row.monthIndex === monthIndex)
      .reduce((sum, row) => d(sum).plus(row.amountUsd), d(0)),
  );
}

/** Five equal TBD partners, then priced rounds. Intervest is not on this cap table. */
export function buildCapTable(values: Record<string, VariableValue>): CapTable {
  const n = Math.max(1, Math.round(num(values, "founderCount")));
  const founders: Stake[] = Array.from({ length: n }, (_, i) => ({
    id: `partner${i + 1}`,
    name: `Partner ${i + 1}`,
    klass: "founder",
    weight: 1 / n,
  }));
  let holders: Stake[] = founders;
  const rounds = plannedRounds(values);
  for (const round of rounds) {
    const sold = d(round.percentSold);
    const keep = d(1).minus(sold);
    holders = holders.map((row) => ({
      ...row,
      weight: d(row.weight).times(keep).toNumber(),
    }));
    holders.push({
      id: round.id,
      name: round.label,
      klass: "investor",
      weight: round.percentSold,
    });
  }
  const total = holders.reduce((sum, row) => d(sum).plus(row.weight), d(0));
  const holdersEnd: CapRow[] = holders.map((row) => ({
    id: row.id,
    name: row.name,
    klass: row.klass,
    percent: total.isZero() ? 0 : d(row.weight).div(total).toNumber(),
  }));
  const founderPercentEnd = holdersEnd
    .filter((row) => row.klass === "founder")
    .reduce((sum, row) => d(sum).plus(row.percent), d(0))
    .toNumber();
  return {
    founderCount: n,
    founderPercentStart: 1,
    founderPercentEnd,
    eachFounderStart: d(1).div(n).toNumber(),
    eachFounderEnd: d(founderPercentEnd).div(n).toNumber(),
    rounds,
    holdersEnd,
    raisedUsd: cents(rounds.reduce((sum, row) => d(sum).plus(row.amountUsd), d(0))),
  };
}

export function founderPayFactor(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  const months = Math.round(num(values, "founderPayHalfMonths"));
  const factor = num(values, "founderPayHalfPct");
  if (monthIndex < months) return factor;
  return 1;
}
