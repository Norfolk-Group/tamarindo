import { cents, d } from "@/lib/model/money";
import type { MonthAcc } from "@/lib/model/engine-acc";
import { sumYear } from "@/lib/model/engine-acc";
import type {
  DivisionStatement,
  DivisionYear,
  StatementLine,
} from "@/lib/model/types";
import { ICP_IDS } from "@/lib/model/types";

const US_DEPT_LABELS: Record<string, string> = {
  leadership: "Leadership (named pay)",
  credit: "Credit",
  success: "Customer Success (phones, email, WhatsApp)",
  service: "Customer Service",
  legal: "Legal / paperwork",
  it: "IT (ex-CTO)",
  finance: "Finance (ex-Rosario)",
  accounting: "Accounting",
  sales: "Sales / origination",
  marketing: "Marketing + paid acquisition",
  autoDesk: "Auto desk",
  aircraftDesk: "Aircraft desk",
  office: "US office seats",
  wfh: "US WFH stipends",
  lump: "US operating expenses",
};

const CO_DEPT_LABELS: Record<string, string> = {
  gm: "Colombia GM",
  closings: "Colombia closings",
  field: "Field inspections (FTE + contractors)",
  success: "Colombia CS / WhatsApp",
  legal: "Colombia legal logistics",
  office: "Colombia office seats",
  lump: "Colombia operating expenses",
};

function line(
  id: string,
  label: string,
  section: StatementLine["section"],
  years: number[],
): StatementLine {
  return { id, label, section, values: years };
}

function buildYears(
  fyCount: number,
  fyLabels: string[],
  cashFor: (acc: MonthAcc) => { cfo: number; cfi: number; cff: number },
  months: MonthAcc[],
): DivisionYear[] {
  let opening = 0;
  const years: DivisionYear[] = [];
  for (let fy = 1; fy <= fyCount; fy += 1) {
    const acc = sumYear(months, fy);
    const { cfo, cfi, cff } = cashFor(acc);
    const net = cfo + cfi + cff;
    const closing = cents(d(opening).plus(net));
    years.push({
      fy,
      label: fyLabels[fy - 1],
      openingCashUsd: opening,
      closingCashUsd: closing,
      netChangeUsd: cents(d(net)),
      cfoUsd: cents(d(cfo)),
      cfiUsd: cents(d(cfi)),
      cffUsd: cents(d(cff)),
      byIcp: ICP_IDS.map((id) => acc.byIcp[id]),
    });
    opening = closing;
  }
  return years;
}

function deptLines(
  prefix: string,
  labels: Record<string, string>,
  yearly: MonthAcc[],
  which: "usDepts" | "coDepts",
): StatementLine[] {
  const keys = new Set<string>();
  for (const year of yearly) {
    for (const key of Object.keys(year[which])) keys.add(key);
  }
  return [...keys].map((key) =>
    line(
      `${prefix}.${key}`,
      labels[key] ?? key,
      "operatingOut",
      yearly.map((y) => y[which][key] ?? 0),
    ),
  );
}

export function buildUs(
  months: MonthAcc[],
  fyCount: number,
  fyLabels: string[],
): DivisionStatement {
  const years = buildYears(
    fyCount,
    fyLabels,
    (acc) => ({
      cfo:
        acc.activation +
        acc.origination +
        acc.servicing +
        acc.spread +
        acc.rental +
        acc.insurance -
        acc.usOpex -
        acc.intercompany,
      cfi: 0,
      cff: acc.seed,
    }),
    months,
  );
  const yearly = Array.from({ length: fyCount }, (_, i) => sumYear(months, i + 1));
  return {
    id: "us",
    title: "Tamarindo US",
    years,
    lines: [
      line("activation", "Activation fees", "operatingIn", yearly.map((y) => y.activation)),
      line("origination", "Origination fees", "operatingIn", yearly.map((y) => y.origination)),
      line("servicing", "Servicing fees", "operatingIn", yearly.map((y) => y.servicing)),
      line("spread", "Interest spread share", "operatingIn", yearly.map((y) => y.spread)),
      line("rental", "Rental revenue share", "operatingIn", yearly.map((y) => y.rental)),
      line("insurance", "Insurance / intermediation commission", "operatingIn", yearly.map((y) => y.insurance)),
      ...deptLines("us", US_DEPT_LABELS, yearly, "usDepts"),
      line(
        "toSucursal",
        "Mandate to Tamarindo Colombia",
        "operatingOut",
        yearly.map((y) => y.intercompany),
      ),
      line("capex", "Platform / capex", "investing", yearly.map(() => 0)),
      line("seed", "Equity proceeds (priced rounds)", "financing", yearly.map((y) => y.seed)),
      line("collections", "Lease collections (agency)", "memo", yearly.map((y) => y.leaseCollected)),
      line("remit", "Remittance to funding vehicles (agency)", "memo", yearly.map((y) => y.remitted)),
      line("line", "Intervest committed line (EOP)", "memo", yearly.map((y) => y.intervestLine)),
      line("partners", "Other capital partners (EOP)", "memo", yearly.map((y) => y.partnerLine)),
      line("vehicles", "All vehicle capacity (EOP)", "memo", yearly.map((y) => y.committedLine)),
      line("aum", "Funded outstanding (EOP)", "memo", yearly.map((y) => y.fundedAum)),
      line("homeAum", "Property book (EOP)", "memo", yearly.map((y) => y.homeAum)),
      line("autoAum", "Auto book (EOP)", "memo", yearly.map((y) => y.autoAum)),
      line("aircraftAum", "Aircraft book (EOP)", "memo", yearly.map((y) => y.aircraftAum)),
      line("homes", "Homes originated", "memo", yearly.map((y) => y.originated)),
      line("autos", "Auto leases originated", "memo", yearly.map((y) => y.autosOriginated)),
      line("aircraft", "Aircraft leases originated", "memo", yearly.map((y) => y.aircraftOriginated)),
      line("ashokaFee", "Ashoka STR fee (sister, memo)", "memo", yearly.map((y) => y.ashokaFee)),
      line("ashokaRepair", "Ashoka repairs + markup (sister, memo)", "memo", yearly.map((y) => y.ashokaRepair)),
    ],
  };
}

export function buildSucursal(
  months: MonthAcc[],
  fyCount: number,
  fyLabels: string[],
): DivisionStatement {
  const years = buildYears(
    fyCount,
    fyLabels,
    (acc) => ({
      cfo:
        acc.intercompany +
        acc.coClosing +
        acc.coInspection +
        acc.coAdmin -
        acc.sucursalOpex,
      cfi: 0,
      cff: 0,
    }),
    months,
  );
  const yearly = Array.from({ length: fyCount }, (_, i) => sumYear(months, i + 1));
  return {
    id: "sucursal",
    title: "Tamarindo Colombia (sucursal)",
    years,
    lines: [
      line("coClosing", "Local closing fees (client)", "operatingIn", yearly.map((y) => y.coClosing)),
      line("coInspection", "Diligence / inspection fees (client)", "operatingIn", yearly.map((y) => y.coInspection)),
      line("coAdmin", "Local administration (client)", "operatingIn", yearly.map((y) => y.coAdmin)),
      line("fromUs", "Mandate from Tamarindo US", "operatingIn", yearly.map((y) => y.intercompany)),
      ...deptLines("co", CO_DEPT_LABELS, yearly, "coDepts"),
      line("capex", "Capex", "investing", yearly.map(() => 0)),
      line("financing", "Financing", "financing", yearly.map(() => 0)),
    ],
  };
}

export function buildConsolidated(
  us: DivisionStatement,
  sucursal: DivisionStatement,
  months: MonthAcc[],
  fyCount: number,
  fyLabels: string[],
): DivisionStatement {
  const years = buildYears(
    fyCount,
    fyLabels,
    (acc) => ({
      cfo:
        acc.activation +
        acc.origination +
        acc.servicing +
        acc.spread +
        acc.rental +
        acc.insurance +
        acc.coClosing +
        acc.coInspection +
        acc.coAdmin -
        acc.usOpex -
        acc.sucursalOpex,
      cfi: 0,
      cff: acc.seed,
    }),
    months,
  );
  const yearly = Array.from({ length: fyCount }, (_, i) => sumYear(months, i + 1));
  return {
    id: "consolidated",
    title: "Consolidated",
    years,
    lines: [
      line("activation", "Activation fees", "operatingIn", yearly.map((y) => y.activation)),
      line("origination", "Origination fees", "operatingIn", yearly.map((y) => y.origination)),
      line("servicing", "Servicing fees", "operatingIn", yearly.map((y) => y.servicing)),
      line("spread", "Interest spread share", "operatingIn", yearly.map((y) => y.spread)),
      line("rental", "Rental revenue share", "operatingIn", yearly.map((y) => y.rental)),
      line("insurance", "Insurance / intermediation commission", "operatingIn", yearly.map((y) => y.insurance)),
      line("coClosing", "Colombia closing fees", "operatingIn", yearly.map((y) => y.coClosing)),
      line("coInspection", "Colombia diligence fees", "operatingIn", yearly.map((y) => y.coInspection)),
      line("coAdmin", "Colombia administration", "operatingIn", yearly.map((y) => y.coAdmin)),
      ...deptLines("us", US_DEPT_LABELS, yearly, "usDepts"),
      ...deptLines("co", CO_DEPT_LABELS, yearly, "coDepts"),
      line("capex", "Platform / capex", "investing", yearly.map(() => 0)),
      line("seed", "Equity proceeds (priced rounds)", "financing", yearly.map((y) => y.seed)),
      line("elims", "Intercompany eliminated", "memo", yearly.map((y) => y.intercompany)),
      line("line", "Intervest committed line (EOP)", "memo", yearly.map((y) => y.intervestLine)),
      line("partners", "Other capital partners (EOP)", "memo", yearly.map((y) => y.partnerLine)),
      line("vehicles", "All vehicle capacity (EOP)", "memo", yearly.map((y) => y.committedLine)),
      line("aum", "Funded outstanding (EOP)", "memo", yearly.map((y) => y.fundedAum)),
      line("homeAum", "Property book (EOP)", "memo", yearly.map((y) => y.homeAum)),
      line("autoAum", "Auto book (EOP)", "memo", yearly.map((y) => y.autoAum)),
      line("aircraftAum", "Aircraft book (EOP)", "memo", yearly.map((y) => y.aircraftAum)),
      line("homes", "Homes originated", "memo", yearly.map((y) => y.originated)),
      line("autos", "Auto leases originated", "memo", yearly.map((y) => y.autosOriginated)),
      line("aircraft", "Aircraft leases originated", "memo", yearly.map((y) => y.aircraftOriginated)),
      line("ashokaFee", "Ashoka STR fee (sister, memo)", "memo", yearly.map((y) => y.ashokaFee)),
      ...usIcpFeeLines(us, sucursal),
    ],
  };
}

/**
 * Tamarindo-Intervest (and later vehicles) — not consolidated into OpCo.
 * Client down, monthly remittance, and the purchase-option balloon land here.
 * The warehouse draw funds the 60%; the vehicle buys the asset at full price.
 */
export function buildVehicle(
  months: MonthAcc[],
  fyCount: number,
  fyLabels: string[],
): DivisionStatement {
  const years = buildYears(
    fyCount,
    fyLabels,
    (acc) => ({
      cfo: acc.clientDown + acc.remitted - acc.activation - acc.origination,
      cfi: -acc.assetPurchase,
      cff: acc.fundedNew,
    }),
    months,
  );
  const yearly = Array.from({ length: fyCount }, (_, i) => sumYear(months, i + 1));
  return {
    id: "vehicle",
    title: "Tamarindo-Intervest (funding vehicle)",
    years,
    lines: [
      line(
        "clientDown",
        "Client down payment (40% homes / 20% autos / 30% aircraft)",
        "operatingIn",
        yearly.map((y) => y.clientDown),
      ),
      line(
        "remitExBalloon",
        "Lease remittances from Tamarindo US (ex balloon)",
        "operatingIn",
        yearly.map((y) => cents(d(y.remitted).minus(y.balloon))),
      ),
      line(
        "balloon",
        "Purchase option / balloon (lessee takes title)",
        "operatingIn",
        yearly.map((y) => y.balloon),
      ),
      line(
        "activation",
        "Activation fee to Tamarindo US (2% of draw)",
        "operatingOut",
        yearly.map((y) => y.activation),
      ),
      line(
        "origination",
        "Origination fee to Tamarindo US",
        "operatingOut",
        yearly.map((y) => y.origination),
      ),
      line(
        "purchases",
        "Asset purchases (homes, autos, aircraft at ticket)",
        "investing",
        yearly.map((y) => -y.assetPurchase),
      ),
      line(
        "draws",
        "Warehouse / line draws (funded amount)",
        "financing",
        yearly.map((y) => y.fundedNew),
      ),
      line("line", "Intervest committed line (EOP)", "memo", yearly.map((y) => y.intervestLine)),
      line("aum", "Funded outstanding (EOP)", "memo", yearly.map((y) => y.fundedAum)),
      line("homes", "Homes originated", "memo", yearly.map((y) => y.originated)),
      line("autos", "Auto leases originated", "memo", yearly.map((y) => y.autosOriginated)),
      line("aircraft", "Aircraft leases originated", "memo", yearly.map((y) => y.aircraftOriginated)),
    ],
  };
}

function usIcpFeeLines(
  us: DivisionStatement,
  _sucursal: DivisionStatement,
): StatementLine[] {
  return us.years[0]
    ? ICP_IDS.map((id) =>
        line(
          `icp.${id}.fees`,
          `${id.toUpperCase()} US fee cash`,
          "memo",
          us.years.map((year) => {
            const slice = year.byIcp.find((row) => row.icpId === id);
            if (!slice) return 0;
            return (
              slice.activationUsd +
              slice.originationUsd +
              slice.servicingUsd +
              slice.spreadUsd +
              slice.rentalUsd
            );
          }),
        ),
      )
    : [];
}
