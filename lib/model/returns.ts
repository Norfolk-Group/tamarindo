import { runCashflowModel } from "@/lib/model/engine";
import { annualizeMonthlyIrr, cents, d, irr } from "@/lib/model/money";
import type { CashflowModel, IcpComputed, VariableValue } from "@/lib/model/types";
import { num } from "@/lib/model/variables";

export type UnitReturn = {
  icpId: string;
  code: string;
  name: string;
  fundedUsd: number;
  residualUsd: number;
  monthlyLeaseUsd: number;
  totalRemittedUsd: number;
  vehicleIrrAnnual: number | null;
};

export type InvestorReturns = {
  generatedAt: string;
  units: UnitReturn[];
  icp1: UnitReturn | undefined;
  vehicleBookIrrAnnual: number | null;
  vehicleBookNetUsd: number;
  opCoEquityInUsd: number;
  opCoCfoUsd: number;
  opCoCashOnCash: number | null;
  note: string;
};

function vehicleUnitFlows(
  icp: IcpComputed,
  values: Record<string, VariableValue>,
): { flows: number[]; remitted: number } {
  const activationPct = d(num(values, "activationFeePct"));
  const originationPct = d(num(values, "originationFeePct"));
  const spreadShare = d(num(values, "spreadSharePct"));
  const servicingAnnual = d(num(values, "servicingBps"));
  const activation = cents(d(icp.fundedUsd).times(activationPct));
  const origination = cents(d(icp.fundedUsd).times(originationPct));
  const flows = new Array<number>(icp.termMonths + 1).fill(0);
  flows[0] = cents(d(-icp.fundedUsd).minus(activation).minus(origination));
  let outstanding = icp.fundedUsd;
  const rateMonthly = d(icp.clientRate).div(12);
  let remitted = 0;
  for (let age = 0; age < icp.termMonths; age += 1) {
    const last = age === icp.termMonths - 1;
    const interest = cents(d(outstanding).times(rateMonthly));
    const principal = last
      ? cents(d(outstanding).minus(icp.residualUsd))
      : Math.min(icp.monthlyLeaseUsd - interest, outstanding);
    const collected = last
      ? cents(d(interest).plus(principal).plus(icp.residualUsd))
      : icp.monthlyLeaseUsd;
    const usSpread = cents(d(interest).times(spreadShare));
    const usServicing = cents(d(outstanding).times(servicingAnnual).div(12));
    const remit = Math.max(0, collected - usSpread - usServicing);
    flows[age + 1] = remit;
    remitted += remit;
    outstanding = cents(d(outstanding).minus(principal));
  }
  return { flows, remitted };
}

function vehicleBookFlows(model: CashflowModel): number[] {
  return model.vehicle.years.map((year) => year.netChangeUsd);
}

export function computeInvestorReturns(
  values: Record<string, VariableValue>,
  model: CashflowModel = runCashflowModel(values),
): InvestorReturns {
  const units = model.contracts.map((icp) => {
    const { flows, remitted } = vehicleUnitFlows(icp, values);
    return {
      icpId: icp.id,
      code: icp.code,
      name: icp.name,
      fundedUsd: icp.fundedUsd,
      residualUsd: icp.residualUsd,
      monthlyLeaseUsd: icp.monthlyLeaseUsd,
      totalRemittedUsd: remitted,
      vehicleIrrAnnual: annualizeMonthlyIrr(irr(flows)),
    };
  });
  const book = vehicleBookFlows(model);
  const equityIn = model.capTable.raisedUsd + num(values, "seedEquityUsd");
  const opCoCfo = model.us.years.reduce((sum, year) => sum + year.cfoUsd, 0);
  return {
    generatedAt: model.generatedAt,
    units,
    icp1: units.find((row) => row.icpId === "icp1"),
    vehicleBookIrrAnnual: irr(book),
    vehicleBookNetUsd: book.reduce((sum, value) => sum + value, 0),
    opCoEquityInUsd: equityIn,
    opCoCfoUsd: opCoCfo,
    opCoCashOnCash: equityIn > 0 ? opCoCfo / equityIn : null,
    note: "Unit IRR is the Intervest-style vehicle return on one lease (funded out, remittance + balloon in, after the 20% strip and servicing). Book IRR uses annual vehicle net cash — warehouse draws make that series noisy. OpCo cash-on-cash is US CFO over priced equity in; there is no published exit, so no OpCo IRR.",
  };
}
