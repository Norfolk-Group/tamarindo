import type { IcpId, IcpYearSlice } from "@/lib/model/types";
import { ICP_IDS } from "@/lib/model/types";

export type MonthAcc = {
  activation: number;
  origination: number;
  servicing: number;
  spread: number;
  rental: number;
  insurance: number;
  usOpex: number;
  sucursalOpex: number;
  intercompany: number;
  coClosing: number;
  coInspection: number;
  coAdmin: number;
  seed: number;
  leaseCollected: number;
  remitted: number;
  clientDown: number;
  assetPurchase: number;
  balloon: number;
  fundedNew: number;
  originated: number;
  autosOriginated: number;
  aircraftOriginated: number;
  intervestLine: number;
  partnerLine: number;
  committedLine: number;
  fundedAum: number;
  homeAum: number;
  autoAum: number;
  aircraftAum: number;
  ashokaFee: number;
  ashokaRepair: number;
  usHeads: number;
  coHeads: number;
  usDepts: Record<string, number>;
  coDepts: Record<string, number>;
  byIcp: Record<IcpId, IcpYearSlice>;
};

export function emptyIcp(icpId: IcpId): IcpYearSlice {
  return {
    icpId,
    originated: 0,
    fundedNewUsd: 0,
    activationUsd: 0,
    originationUsd: 0,
    servicingUsd: 0,
    spreadUsd: 0,
    rentalUsd: 0,
    leaseCollectedUsd: 0,
    remittedUsd: 0,
    colombiaClientUsd: 0,
  };
}

export function emptyMonth(): MonthAcc {
  return {
    activation: 0,
    origination: 0,
    servicing: 0,
    spread: 0,
    rental: 0,
    insurance: 0,
    usOpex: 0,
    sucursalOpex: 0,
    intercompany: 0,
    coClosing: 0,
    coInspection: 0,
    coAdmin: 0,
    seed: 0,
    leaseCollected: 0,
    remitted: 0,
    clientDown: 0,
    assetPurchase: 0,
    balloon: 0,
    fundedNew: 0,
    originated: 0,
    autosOriginated: 0,
    aircraftOriginated: 0,
    intervestLine: 0,
    partnerLine: 0,
    committedLine: 0,
    fundedAum: 0,
    homeAum: 0,
    autoAum: 0,
    aircraftAum: 0,
    ashokaFee: 0,
    ashokaRepair: 0,
    usHeads: 0,
    coHeads: 0,
    usDepts: {},
    coDepts: {},
    byIcp: Object.fromEntries(ICP_IDS.map((id) => [id, emptyIcp(id)])) as Record<
      IcpId,
      IcpYearSlice
    >,
  };
}

export function sumYear(months: MonthAcc[], fy: number): MonthAcc {
  const acc = emptyMonth();
  const start = (fy - 1) * 12;
  const slice = months.slice(start, start + 12);
  for (const month of slice) {
    acc.activation += month.activation;
    acc.origination += month.origination;
    acc.servicing += month.servicing;
    acc.spread += month.spread;
    acc.rental += month.rental;
    acc.insurance += month.insurance;
    acc.usOpex += month.usOpex;
    acc.sucursalOpex += month.sucursalOpex;
    acc.intercompany += month.intercompany;
    acc.coClosing += month.coClosing;
    acc.coInspection += month.coInspection;
    acc.coAdmin += month.coAdmin;
    acc.seed += month.seed;
    acc.leaseCollected += month.leaseCollected;
    acc.remitted += month.remitted;
    acc.clientDown += month.clientDown;
    acc.assetPurchase += month.assetPurchase;
    acc.balloon += month.balloon;
    acc.fundedNew += month.fundedNew;
    acc.originated += month.originated;
    acc.autosOriginated += month.autosOriginated;
    acc.aircraftOriginated += month.aircraftOriginated;
    acc.ashokaFee += month.ashokaFee;
    acc.ashokaRepair += month.ashokaRepair;
    acc.intervestLine = month.intervestLine;
    acc.partnerLine = month.partnerLine;
    acc.committedLine = month.committedLine;
    acc.fundedAum = month.fundedAum;
    acc.homeAum = month.homeAum;
    acc.autoAum = month.autoAum;
    acc.aircraftAum = month.aircraftAum;
    acc.usHeads = month.usHeads;
    acc.coHeads = month.coHeads;
    for (const [key, value] of Object.entries(month.usDepts)) {
      acc.usDepts[key] = (acc.usDepts[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(month.coDepts)) {
      acc.coDepts[key] = (acc.coDepts[key] ?? 0) + value;
    }
    for (const id of ICP_IDS) {
      const src = month.byIcp[id];
      const dst = acc.byIcp[id];
      dst.originated += src.originated;
      dst.fundedNewUsd += src.fundedNewUsd;
      dst.activationUsd += src.activationUsd;
      dst.originationUsd += src.originationUsd;
      dst.servicingUsd += src.servicingUsd;
      dst.spreadUsd += src.spreadUsd;
      dst.rentalUsd += src.rentalUsd;
      dst.leaseCollectedUsd += src.leaseCollectedUsd;
      dst.remittedUsd += src.remittedUsd;
      dst.colombiaClientUsd += src.colombiaClientUsd;
    }
  }
  return acc;
}
