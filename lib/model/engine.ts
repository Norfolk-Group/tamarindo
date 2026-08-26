import { productAumTargetUsd, usesKpiCapitalCurve } from "@/lib/model/capital-kpis";
import { buildCapTable, equityProceedsAt } from "@/lib/model/equity";
import {
  intervestLineUsd,
  partnerCapacityUsd,
  totalCommittedUsd,
} from "@/lib/model/capital-partners";
import { computeContracts, contractById } from "@/lib/model/contracts";
import { monthDepartmentCash } from "@/lib/model/departments";
import { emptyMonth } from "@/lib/model/engine-acc";
import {
  buildConsolidated,
  buildSucursal,
  buildUs,
  buildVehicle,
} from "@/lib/model/engine-statements";
import { cents, d, monthlyRate } from "@/lib/model/money";
import {
  aircraftOriginationsThisMonth,
  autoOriginationsThisMonth,
  pickProductQuote,
  productQuote,
  productQuotes,
} from "@/lib/model/products";
import type { CashflowModel, IcpComputed, IcpId, Vintage } from "@/lib/model/types";
import { ICP_IDS } from "@/lib/model/types";
import { num, type VariableValue } from "@/lib/model/variables";
import { addMonths, buildPlannedVintages } from "@/lib/model/vintages";

type LiveBook = {
  kind: "home" | "auto" | "aircraft";
  icpId?: IcpId;
  startIndex: number;
  termMonths: number;
  payment: number;
  residual: number;
  outstanding: number;
  purchaseUsd: number;
  fundedUsd: number;
  rateMonthly: ReturnType<typeof d>;
};

function bookVehiclePurchase(
  acc: ReturnType<typeof emptyMonth>,
  purchaseUsd: number,
  fundedUsd: number,
): void {
  acc.assetPurchase += purchaseUsd;
  acc.fundedNew += fundedUsd;
  acc.clientDown += cents(d(purchaseUsd).minus(fundedUsd));
}

function fiscalLabel(fy: number, startYear: number, startMonth: number): string {
  const open = addMonths(startYear, startMonth, (fy - 1) * 12);
  const close = addMonths(open.year, open.month, 11);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `FY${fy} · ${months[open.month - 1]} ${open.year}–${months[close.month - 1]} ${close.year}`;
}

function bookOutstanding(books: LiveBook[], kind?: LiveBook["kind"]): number {
  return books
    .filter((row) => !kind || row.kind === kind)
    .reduce((sum, row) => sum + row.outstanding, 0);
}

export function runCashflowModel(
  values: Record<string, VariableValue>,
): CashflowModel {
  const contracts = computeContracts(values);
  const planned = buildPlannedVintages(values, contracts);
  const horizon = Math.round(num(values, "horizonMonths"));
  const fyCount = Math.ceil(horizon / 12);
  const startYear = Math.round(num(values, "planStartYear"));
  const startMonth = Math.round(num(values, "planStartMonth"));
  const activationPct = d(num(values, "activationFeePct"));
  const originationPct = d(num(values, "originationFeePct"));
  const servicingAnnual = d(num(values, "servicingBps"));
  const spreadShare = d(num(values, "spreadSharePct"));
  const targetUtil = d(num(values, "targetUtilizationPct"));
  const lumpUs = num(values, "usMonthlyOpexUsd");
  const sucursalFixed = num(values, "sucursalMonthlyOpexUsd");
  const sucursalPer = num(values, "sucursalPerContractUsd");
  const usPerClose = num(values, "sucursalClosingFeeUsd");
  const usMandate = num(values, "usMandateMonthlyUsd");
  const costPlus = d(num(values, "sucursalCostPlusPct"));
  const coClosingFee = num(values, "coClosingFeeUsd");
  const coInspectionFee = num(values, "coInspectionFeeUsd");
  const coAdminFee = num(values, "coAdminPerLeaseUsd");
  const seed = num(values, "seedEquityUsd");
  const useDepts = Math.round(num(values, "useDepartmentOpex")) === 1;
  const insurancePct = d(num(values, "insuranceCommissionPct"));
  const rentedTimeByIcp = Object.fromEntries(
    ICP_IDS.map((id) => [id, d(num(values, `icp.${id}.rentedTimePct`))]),
  ) as Record<IcpId, ReturnType<typeof d>>;

  const months = [];
  const live: LiveBook[] = [];
  const originatedVintages: Vintage[] = [];
  let planCursor = 0;
  let originatedTotal = 0;
  let autosTotal = 0;
  let aircraftTotal = 0;

  const tryOriginate = (
    book: LiveBook,
    funded: number,
    capacity: ReturnType<typeof d>,
    monthIndex: number,
  ): boolean => {
    if (d(bookOutstanding(live)).plus(funded).greaterThan(capacity)) return false;
    const ceiling = productAumTargetUsd(book.kind, monthIndex, values);
    if (d(bookOutstanding(live, book.kind)).plus(funded).greaterThan(ceiling)) {
      return false;
    }
    live.push(book);
    return true;
  };

  for (let m = 0; m < horizon; m += 1) {
    const acc = emptyMonth();
    const intervest = intervestLineUsd(values, m);
    const partners = partnerCapacityUsd(values, m);
    const line = totalCommittedUsd(values, m);
    acc.intervestLine = intervest;
    acc.partnerLine = partners;
    acc.committedLine = line;
    acc.seed = equityProceedsAt(values, m) + (m === 0 ? seed : 0);

    const capacity = usesKpiCapitalCurve(values) ? d(line) : d(line).times(targetUtil);
    while (planCursor < planned.length && planned[planCursor].monthIndex === m) {
      const next = planned[planCursor];
      const icp = contractById(contracts, next.icpId);
      const ok = tryOriginate(
        {
          kind: "home",
          icpId: icp.id,
          startIndex: m,
          termMonths: icp.termMonths,
          payment: icp.monthlyLeaseUsd,
          residual: icp.residualUsd,
          outstanding: icp.fundedUsd,
          purchaseUsd: icp.purchasePriceUsd,
          fundedUsd: icp.fundedUsd,
          rateMonthly: monthlyRate(d(icp.clientRate)),
        },
        icp.fundedUsd,
        capacity,
        m,
      );
      planCursor += 1;
      if (!ok) continue;
      bookVehiclePurchase(acc, icp.purchasePriceUsd, icp.fundedUsd);
      acc.originated += 1;
      originatedTotal += 1;
      acc.activation += cents(d(icp.fundedUsd).times(activationPct));
      acc.origination += cents(d(icp.fundedUsd).times(originationPct));
      acc.insurance += cents(d(icp.fundedUsd).times(insurancePct));
      acc.byIcp[icp.id].originated += 1;
      acc.byIcp[icp.id].fundedNewUsd += icp.fundedUsd;
      acc.byIcp[icp.id].activationUsd += cents(d(icp.fundedUsd).times(activationPct));
      acc.byIcp[icp.id].originationUsd += cents(d(icp.fundedUsd).times(originationPct));
      originatedVintages.push(next);
    }

    const autoBlend = productQuote("auto", values);
    const autoBook = productQuotes("auto", values);
    const autoStart = Math.round(num(values, "autoStartMonth"));
    const autoCap = Math.max(0, Math.round(num(values, "autoMaxPerMonth")));
    const autoMix = autoOriginationsThisMonth(values, m, acc.originated);
    const autoHeadroom = Math.max(
      0,
      productAumTargetUsd("auto", m, values) - bookOutstanding(live, "auto"),
    );
    const autoByAum =
      m >= autoStart && autoBlend.fundedUsd > 0
        ? Math.floor(autoHeadroom / autoBlend.fundedUsd)
        : 0;
    const autoWanted = Math.min(autoCap, Math.max(autoMix, autoByAum));
    for (let i = 0; i < autoWanted; i += 1) {
      const autoQuote = pickProductQuote(autoBook, autosTotal + i);
      const ok = tryOriginate(
        {
          kind: "auto",
          startIndex: m,
          termMonths: autoQuote.termMonths,
          payment: autoQuote.monthlyLeaseUsd,
          residual: autoQuote.residualUsd,
          outstanding: autoQuote.fundedUsd,
          purchaseUsd: autoQuote.ticketUsd,
          fundedUsd: autoQuote.fundedUsd,
          rateMonthly: monthlyRate(d(autoQuote.clientRate)),
        },
        autoQuote.fundedUsd,
        capacity,
        m,
      );
      if (!ok) break;
      bookVehiclePurchase(acc, autoQuote.ticketUsd, autoQuote.fundedUsd);
      acc.autosOriginated += 1;
      autosTotal += 1;
      acc.activation += cents(d(autoQuote.fundedUsd).times(activationPct));
      acc.origination += cents(d(autoQuote.fundedUsd).times(originationPct));
      acc.insurance += cents(d(autoQuote.fundedUsd).times(insurancePct));
    }

    const airBook = productQuotes("aircraft", values);
    const airWanted = aircraftOriginationsThisMonth(values, m);
    for (let i = 0; i < airWanted; i += 1) {
      const airQuote = pickProductQuote(airBook, aircraftTotal + i);
      const ok = tryOriginate(
        {
          kind: "aircraft",
          startIndex: m,
          termMonths: airQuote.termMonths,
          payment: airQuote.monthlyLeaseUsd,
          residual: airQuote.residualUsd,
          outstanding: airQuote.fundedUsd,
          purchaseUsd: airQuote.ticketUsd,
          fundedUsd: airQuote.fundedUsd,
          rateMonthly: monthlyRate(d(airQuote.clientRate)),
        },
        airQuote.fundedUsd,
        capacity,
        m,
      );
      if (!ok) break;
      bookVehiclePurchase(acc, airQuote.ticketUsd, airQuote.fundedUsd);
      acc.aircraftOriginated += 1;
      aircraftTotal += 1;
      acc.activation += cents(d(airQuote.fundedUsd).times(activationPct));
      acc.origination += cents(d(airQuote.fundedUsd).times(originationPct));
      acc.insurance += cents(d(airQuote.fundedUsd).times(insurancePct));
    }

    const stillLive: LiveBook[] = [];
    for (const lease of live) {
      const age = m - lease.startIndex;
      const interest = cents(d(lease.outstanding).times(lease.rateMonthly));
      const last = age === lease.termMonths - 1;
      const principal = last
        ? cents(d(lease.outstanding).minus(lease.residual))
        : Math.min(lease.payment - interest, lease.outstanding);
      const collected = last
        ? cents(d(interest).plus(principal).plus(lease.residual))
        : lease.payment;
      if (last) acc.balloon += lease.residual;
      const usSpread = cents(d(interest).times(spreadShare));
      const usServicing = cents(d(lease.outstanding).times(servicingAnnual).div(12));
      const usKeep = usSpread + usServicing;
      const remit = Math.max(0, collected - usKeep);
      acc.leaseCollected += collected;
      acc.remitted += remit;
      acc.spread += usSpread;
      acc.servicing += usServicing;
      if (lease.kind === "home" && lease.icpId) {
        const rentalThisMonth = cents(
          d(contractById(contracts, lease.icpId).rentalShareUsdPerMonth).times(
            rentedTimeByIcp[lease.icpId],
          ),
        );
        acc.rental += rentalThisMonth;
        acc.byIcp[lease.icpId].spreadUsd += usSpread;
        acc.byIcp[lease.icpId].servicingUsd += usServicing;
        acc.byIcp[lease.icpId].rentalUsd += rentalThisMonth;
        acc.byIcp[lease.icpId].leaseCollectedUsd += collected;
        acc.byIcp[lease.icpId].remittedUsd += remit;
      }
      lease.outstanding = cents(d(lease.outstanding).minus(principal));
      if (!last) stillLive.push(lease);
    }
    live.length = 0;
    live.push(...stillLive);

    const homes = live.filter((row) => row.kind === "home").length;
    const active = live.length;
    acc.fundedAum = cents(d(bookOutstanding(live)));
    acc.homeAum = cents(d(bookOutstanding(live, "home")));
    acc.autoAum = cents(d(bookOutstanding(live, "auto")));
    acc.aircraftAum = cents(d(bookOutstanding(live, "aircraft")));

    if (useDepts) {
      const depts = monthDepartmentCash(values, homes, acc.originated, m);
      acc.usDepts = depts.us;
      acc.coDepts = depts.colombia;
      acc.usOpex = depts.usTotal;
      acc.sucursalOpex = depts.colombiaTotal;
      acc.usHeads = depts.usHeads;
      acc.coHeads = depts.coHeads;
    } else {
      acc.usDepts = { lump: lumpUs };
      acc.usOpex = lumpUs;
      acc.sucursalOpex = cents(d(sucursalFixed).plus(d(sucursalPer).times(homes)));
      acc.coDepts = { lump: acc.sucursalOpex };
    }

    acc.intercompany = cents(
      d(usMandate).plus(d(usPerClose).times(acc.originated)).times(costPlus.plus(1)),
    );
    acc.coClosing = cents(d(coClosingFee).times(acc.originated));
    acc.coInspection = cents(d(coInspectionFee).times(acc.originated));
    acc.coAdmin = cents(d(coAdminFee).times(homes));
    if (acc.originated > 0) {
      const perNew = cents(d(coClosingFee).plus(coInspectionFee));
      for (const id of ICP_IDS) {
        acc.byIcp[id].colombiaClientUsd += acc.byIcp[id].originated * perNew;
      }
    }
    if (homes > 0 && acc.coAdmin > 0) {
      const liveByIcp = Object.fromEntries(ICP_IDS.map((id) => [id, 0])) as Record<
        IcpId,
        number
      >;
      for (const lease of live) {
        if (lease.icpId) liveByIcp[lease.icpId] += 1;
      }
      for (const id of ICP_IDS) {
        acc.byIcp[id].colombiaClientUsd += cents(d(coAdminFee).times(liveByIcp[id]));
      }
    }

    let rentedHomeTime = d(0);
    for (const lease of live) {
      if (lease.kind === "home" && lease.icpId) {
        rentedHomeTime = rentedHomeTime.plus(rentedTimeByIcp[lease.icpId]);
      }
    }
    const pooled = rentedHomeTime.times(num(values, "rentalPoolOptInPct"));
    acc.ashokaFee = cents(pooled.times(num(values, "ashokaGrossRentUsd")).times(num(values, "ashokaMgmtFeePct")));
    acc.ashokaRepair = cents(
      pooled.times(num(values, "ashokaRepairUsd")).times(d(1).plus(num(values, "ashokaRepairMarkupPct"))),
    );
    months.push(acc);
  }

  const fyLabels = Array.from({ length: fyCount }, (_, i) =>
    fiscalLabel(i + 1, startYear, startMonth),
  );
  const us = buildUs(months, fyCount, fyLabels);
  const sucursal = buildSucursal(months, fyCount, fyLabels);
  const consolidated = buildConsolidated(us, sucursal, months, fyCount, fyLabels);
  const vehicle = buildVehicle(months, fyCount, fyLabels);
  const last = months[months.length - 1];

  return {
    generatedAt: new Date().toISOString(),
    horizonMonths: horizon,
    fyCount,
    fyLabels,
    contracts,
    vintages: originatedVintages,
    us,
    sucursal,
    consolidated,
    vehicle,
    capTable: buildCapTable(values),
    summary: {
      fyLabels,
      homesOriginated: originatedTotal,
      homesActiveEnd: live.filter((row) => row.kind === "home").length,
      autosOriginated: autosTotal,
      aircraftOriginated: aircraftTotal,
      fundedAumEndUsd: last?.fundedAum ?? 0,
      homeAumEndUsd: last?.homeAum ?? 0,
      autoAumEndUsd: last?.autoAum ?? 0,
      aircraftAumEndUsd: last?.aircraftAum ?? 0,
      committedLineEndUsd: last?.committedLine ?? 0,
      intervestLineEndUsd: last?.intervestLine ?? 0,
      partnerLineEndUsd: last?.partnerLine ?? 0,
      fy1ClosingCashUsd: consolidated.years[0]?.closingCashUsd ?? 0,
      fy10ClosingCashUsd: consolidated.years[fyCount - 1]?.closingCashUsd ?? 0,
      lineStepUpPct: num(values, "lineStepUpPct"),
      januaryCohortYear: Math.round(num(values, "januaryCohortYear")),
    },
  };
}

export function assertConsolidatedIdentity(model: CashflowModel): void {
  for (let i = 0; i < model.fyCount; i += 1) {
    const us = model.us.years[i];
    const sucursal = model.sucursal.years[i];
    const con = model.consolidated.years[i];
    const sum = cents(d(us.netChangeUsd).plus(sucursal.netChangeUsd));
    if (sum !== con.netChangeUsd) {
      throw new Error(
        `Consolidation broken in ${con.label}: US+sucursal ${sum} ≠ ${con.netChangeUsd}`,
      );
    }
  }
}

export function contractsOnly(values: Record<string, VariableValue>): IcpComputed[] {
  return computeContracts(values);
}
