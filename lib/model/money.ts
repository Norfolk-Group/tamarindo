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
