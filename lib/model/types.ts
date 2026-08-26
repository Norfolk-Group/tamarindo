export const ICP_IDS = [
  "icp1",
  "icp2",
  "icp3",
  "icp4",
  "icp5",
  "icp6",
] as const;

export type IcpId = (typeof ICP_IDS)[number];

export const AUTO_ICP_IDS = ["auto1", "auto2"] as const;
export const AIRCRAFT_ICP_IDS = ["air1", "air2"] as const;

export const CATALOG_ICP_IDS = [
  ...ICP_IDS,
  ...AUTO_ICP_IDS,
  ...AIRCRAFT_ICP_IDS,
] as const;

export type AutoIcpId = (typeof AUTO_ICP_IDS)[number];
export type AircraftIcpId = (typeof AIRCRAFT_ICP_IDS)[number];
export type CatalogIcpId = (typeof CATALOG_ICP_IDS)[number];
export type AssetClass = "property" | "auto" | "aircraft";

export type CitationLabel = "FACT" | "OPINION" | "ASSUMPTION";

export type VariableType = "percent" | "usd" | "integer" | "month" | "text";

export type VariableVisibility = "user" | "admin";

/** Where the live input set came from for this caller. */
export type CaseSource = "personal" | "shared" | "seed";

export type VariableValue = number | string;

export type VariableDef = {
  key: string;
  label: string;
  group: string;
  type: VariableType;
  visibility: VariableVisibility;
  defaultValue: VariableValue;
  min?: number;
  max?: number;
  step?: number;
  citation: {
    label: CitationLabel;
    path: string;
    note: string;
  };
};

export type IcpSource = {
  label: string;
  url: string;
};

export type IcpTemplate = {
  id: IcpId;
  code: string;
  name: string;
  city: string;
  neighborhood: string;
  property: string;
  persona: string;
  explanation: string;
  researchNote: string;
  sources: IcpSource[];
  purchasePriceUsd: number;
  termMonths: number;
  clientRate: number;
  /** Rental strength vs the standard %-of-value pricing rule (1 = standard). */
  rentFactor: number;
  mixWeight: number;
  citation: {
    label: CitationLabel;
    path: string;
    note: string;
  };
};

export type IcpComputed = IcpTemplate & {
  /** Raw per-ICP client rate before the blended FICO-tier spread. `clientRate` holds the effective rate. */
  baseClientRate: number;
  downPaymentUsd: number;
  fundedUsd: number;
  residualUsd: number;
  monthlyLeaseUsd: number;
  /** Gross furnished monthly rent while renting — price × %-of-value × factor. */
  grossRentUsdPerMonth: number;
  /** Tamarindo's slice of that rent after mgmt fee and operating costs. */
  rentalShareUsdPerMonth: number;
};

export type Vintage = {
  monthIndex: number;
  year: number;
  month: number;
  icpId: IcpId;
};

export type StatementLine = {
  id: string;
  label: string;
  section: "operatingIn" | "operatingOut" | "investing" | "financing" | "memo";
  values: number[];
};

export type IcpYearSlice = {
  icpId: IcpId;
  originated: number;
  fundedNewUsd: number;
  activationUsd: number;
  originationUsd: number;
  servicingUsd: number;
  spreadUsd: number;
  rentalUsd: number;
  leaseCollectedUsd: number;
    remittedUsd: number;
    colombiaClientUsd: number;
};

export type DivisionYear = {
  fy: number;
  label: string;
  openingCashUsd: number;
  closingCashUsd: number;
  netChangeUsd: number;
  cfoUsd: number;
  cfiUsd: number;
  cffUsd: number;
  byIcp: IcpYearSlice[];
};

export type DivisionStatement = {
  id: "us" | "sucursal" | "consolidated" | "vehicle";
  title: string;
  years: DivisionYear[];
  lines: StatementLine[];
};

export type ModelSummary = {
  fyLabels: string[];
  homesOriginated: number;
  homesActiveEnd: number;
  autosOriginated: number;
  aircraftOriginated: number;
  fundedAumEndUsd: number;
  homeAumEndUsd: number;
  autoAumEndUsd: number;
  aircraftAumEndUsd: number;
  committedLineEndUsd: number;
  intervestLineEndUsd: number;
  partnerLineEndUsd: number;
  fy1ClosingCashUsd: number;
  fy10ClosingCashUsd: number;
  lineStepUpPct: number;
  januaryCohortYear: number;
};

export type EquityRoundView = {
  id: string;
  label: string;
  monthIndex: number;
  amountUsd: number;
  preMoneyUsd: number;
  postMoneyUsd: number;
  percentSold: number;
};

export type CapRowView = {
  id: string;
  name: string;
  klass: "founder" | "investor";
  percent: number;
};

export type CapTableView = {
  founderCount: number;
  founderPercentStart: number;
  founderPercentEnd: number;
  eachFounderStart: number;
  eachFounderEnd: number;
  rounds: EquityRoundView[];
  holdersEnd: CapRowView[];
  raisedUsd: number;
};

export type CashflowModel = {
  generatedAt: string;
  horizonMonths: number;
  fyCount: number;
  fyLabels: string[];
  contracts: IcpComputed[];
  vintages: Vintage[];
  us: DivisionStatement;
  sucursal: DivisionStatement;
  consolidated: DivisionStatement;
  vehicle: DivisionStatement;
  capTable: CapTableView;
  summary: ModelSummary;
};

export type ModelVariableView = VariableDef & {
  value: VariableValue;
};

export type ModelPayload = {
  model: CashflowModel;
  variables: ModelVariableView[];
  canEditAdmin: boolean;
};
