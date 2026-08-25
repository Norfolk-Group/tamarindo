import Decimal from "decimal.js";

const MONEY = Decimal.clone({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function d(value: number | string | Decimal): Decimal {
  return value instanceof Decimal ? value : new MONEY(value);
}

/** Bank-style cents. Deterministic. */
export function cents(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function money(value: number | string | Decimal): Decimal {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Excel PMT(rate, nper, -pv, fv): level payment that amortizes `pv` to `fv`.
 */
export function pmt(
  periodicRate: Decimal,
  periods: number,
  presentValue: Decimal,
  futureValue: Decimal,
): Decimal {
  if (periods <= 0) return money(0);
  if (periodicRate.isZero()) {
    return money(presentValue.minus(futureValue).div(periods));
  }
  const growth = periodicRate.plus(1).pow(periods);
  const numerator = presentValue.minus(futureValue.div(growth)).times(periodicRate);
  const denominator = new MONEY(1).minus(new MONEY(1).div(growth));
  return money(numerator.div(denominator));
}

export function monthlyRate(annual: Decimal): Decimal {
  return annual.div(12);
}

/**
 * Periodic IRR (Newton–Raphson on NPV). Same sign-change rule as Excel IRR.
 * Returns null when the series cannot be solved.
 */
export function irr(cashflows: number[], guess = 0.01): number | null {
  const hasPos = cashflows.some((value) => value > 0);
  const hasNeg = cashflows.some((value) => value < 0);
  if (cashflows.length < 2 || !hasPos || !hasNeg) return null;

  let rate = guess;
  for (let i = 0; i < 80; i += 1) {
    let npv = 0;
    let derivative = 0;
    for (let t = 0; t < cashflows.length; t += 1) {
      const denom = (1 + rate) ** t;
      npv += cashflows[t] / denom;
      if (t > 0) derivative -= (t * cashflows[t]) / (denom * (1 + rate));
    }
    if (Math.abs(derivative) < 1e-12) break;
    const next = rate - npv / derivative;
    if (!Number.isFinite(next) || next <= -0.99) return null;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
  }
  return Number.isFinite(rate) ? rate : null;
}

/** Monthly IRR → effective annual. */
export function annualizeMonthlyIrr(monthly: number | null): number | null {
  if (monthly == null) return null;
  return (1 + monthly) ** 12 - 1;
}
