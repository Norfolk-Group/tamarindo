import { founderPayFactor } from "@/lib/model/equity";
import { cents, d } from "@/lib/model/money";
import { num, type VariableValue } from "@/lib/model/variables";

export type DeptCash = {
  us: Record<string, number>;
  colombia: Record<string, number>;
  usTotal: number;
  colombiaTotal: number;
  usHeads: number;
  coHeads: number;
};

function headsForBook(baseFte: number, activeHomes: number, perRep: number): number {
  const extra = perRep > 0 ? Math.max(0, Math.ceil(activeHomes / perRep) - baseFte) : 0;
  return baseFte + extra;
}

/** Monthly cash opex by desk. Named pay is loaded (09). */
export function monthDepartmentCash(
  values: Record<string, VariableValue>,
  activeHomes: number,
  closes: number,
  monthIndex: number,
): DeptCash {
  const us: Record<string, number> = {};
  const colombia: Record<string, number> = {};

  us.leadership = cents(
    d(num(values, "pay.dovLoadedUsd"))
      .plus(num(values, "pay.rosarioLoadedUsd"))
      .plus(num(values, "pay.ricardoLoadedUsd"))
      .plus(num(values, "pay.tomLoadedUsd"))
      .times(founderPayFactor(values, monthIndex)),
  );

  const creditFte = num(values, "dept.us.credit.fte");
  us.credit = cents(d(num(values, "dept.us.credit.loadedUsd")).times(creditFte));

  const perRep = Math.max(1, Math.round(num(values, "dept.csHomesPerRep")));
  const successFte = headsForBook(num(values, "dept.us.success.fte"), activeHomes, perRep);
  const serviceFte = headsForBook(num(values, "dept.us.service.fte"), activeHomes, perRep);
  const channel = d(num(values, "dept.channelPerRepUsd"));
  us.success = cents(
    d(num(values, "dept.us.success.loadedUsd")).times(successFte).plus(channel.times(successFte)),
  );
  us.service = cents(
    d(num(values, "dept.us.service.loadedUsd")).times(serviceFte).plus(channel.times(serviceFte)),
  );

  const legalFte = num(values, "dept.us.legal.fte");
  us.legal = cents(
    d(num(values, "dept.us.legal.loadedUsd"))
      .times(legalFte)
      .plus(num(values, "dept.us.legal.contractorUsd")),
  );
  const itFte = num(values, "dept.us.it.fte");
  us.it = cents(d(num(values, "dept.us.it.loadedUsd")).times(itFte));
  const finFte = num(values, "dept.us.finance.fte");
  us.finance = cents(d(num(values, "dept.us.finance.loadedUsd")).times(finFte));
  const acctFte = num(values, "dept.us.accounting.fte");
  us.accounting = cents(d(num(values, "dept.us.accounting.loadedUsd")).times(acctFte));
  const salesPer = Math.max(1, Math.round(num(values, "dept.salesHomesPerRep")));
  const salesFte = headsForBook(num(values, "dept.us.sales.fte"), closes, salesPer);
  us.sales = cents(d(num(values, "dept.us.sales.loadedUsd")).times(salesFte));
  const mktFte = num(values, "dept.us.marketing.fte");
  us.marketing = cents(
    d(num(values, "dept.us.marketing.loadedUsd"))
      .times(mktFte)
      .plus(num(values, "dept.us.marketing.spendUsd")),
  );

  const autoOn = monthIndex >= Math.round(num(values, "autoStartMonth"));
  us.autoDesk = autoOn
    ? cents(d(num(values, "dept.us.credit.loadedUsd")).times(autoOn ? 1 : 0))
    : 0;
  const airOn = monthIndex >= Math.round(num(values, "aircraftStartMonth"));
  us.aircraftDesk = airOn ? cents(d(12_000)) : 0;

  const usPeople =
    4 +
    creditFte +
    successFte +
    serviceFte +
    legalFte +
    itFte +
    finFte +
    acctFte +
    salesFte +
    mktFte +
    (autoOn ? 1 : 0) +
    (airOn ? 1 : 0);
  const wfh = d(num(values, "dept.us.wfhPct"));
  const remote = d(usPeople).times(wfh);
  const onSite = d(usPeople).minus(remote);
  us.office = cents(onSite.times(num(values, "dept.officeSeatUsd")));
  us.wfh = cents(remote.times(num(values, "dept.wfhStipendUsd")));

  colombia.gm = cents(d(num(values, "pay.gmLoadedUsd")));
  const closeFte = num(values, "dept.co.closings.fte");
  colombia.closings = cents(d(num(values, "dept.co.closings.loadedUsd")).times(closeFte));
  const fieldFte = num(values, "dept.co.field.fte");
  const capacity = fieldFte * Math.max(1, num(values, "dept.co.inspectFteCapacity"));
  const overflow = Math.max(0, closes - capacity);
  colombia.field = cents(
    d(num(values, "dept.co.field.loadedUsd"))
      .times(fieldFte)
      .plus(d(num(values, "dept.co.inspectContractorUsd")).times(overflow)),
  );
  const coCs = headsForBook(num(values, "dept.co.success.fte"), activeHomes, perRep);
  colombia.success = cents(
    d(num(values, "dept.co.success.loadedUsd")).times(coCs).plus(channel.times(coCs)),
  );
  const coLegal = num(values, "dept.co.legal.fte");
  colombia.legal = cents(d(num(values, "dept.co.legal.loadedUsd")).times(coLegal));
  const coPeople = 1 + closeFte + fieldFte + coCs + coLegal;
  const coWfh = d(num(values, "dept.co.wfhPct"));
  colombia.office = cents(
    d(coPeople).times(d(1).minus(coWfh)).times(num(values, "dept.co.officeSeatUsd")),
  );

  const usTotal = cents(Object.values(us).reduce((sum, value) => d(sum).plus(value), d(0)));
  const colombiaTotal = cents(
    Object.values(colombia).reduce((sum, value) => d(sum).plus(value), d(0)),
  );
  return {
    us,
    colombia,
    usTotal,
    colombiaTotal,
    usHeads: usPeople,
    coHeads: coPeople,
  };
}
