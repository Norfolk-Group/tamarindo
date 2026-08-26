import type { ReportDepth } from "@/lib/model/report-depth";
import type { ReportKind } from "@/lib/model/report-workbook";
import { detectReplyLanguage } from "@/lib/nico/reply-language";

export type ReportAsk = {
  kind: ReportKind;
  fromFy?: number;
  toFy?: number;
  depth?: ReportDepth;
  /** Not on the shelf — say wait, draft on screen, build from the live model. */
  liveBuild?: boolean;
  waitLine?: string;
};

const RETURNS_RE =
  /\b(investor returns?|returns? report|vehicle irr|unit irr|irr|tir|moic|cash[- ]on[- ]cash|what (are|is) (the )?(investor )?returns|retornos?( del inversionista)?|cu[aá]l es (la )?(tir|irr))\b/i;

const SENS_RE =
  /\b(sensitivity( analysis)?|tornado|stress tests?|what[- ]if grid|shock (the )?(model|residual|balloon|down|ltv)|sensibilidad|prueba de estr[eé]s|estresar (el )?(modelo|globo|cuota))\b/i;

const INCOME_RE =
  /\b(income statement|p&l|p and l|profit and loss|operating p&l|estado de resultados|p&g|p y g)\b/i;

const STATEMENTS_RE =
  /\b(financial statements?|statement of cash|scf|ias 7|period report|cash ?flow|show (me )?(the )?(live )?books?|estados? financieros?|flujo de caja|mu[eé]strame (los )?libros|los libros)\b/i;

const FY_RANGE_RE =
  /\b(?:fy|fiscal years?|years?|a[nñ]os?)\s*(\d{1,2})\s*(?:to|-|–|—|through|thru|a)\s*(?:fy|fiscal year|year|a[nñ]o)?\s*(\d{1,2})\b/i;

const FY_SINGLE_RE = /\b(?:fy|fiscal year)\s*(\d{1,2})\b/i;

const YEAR_SINGLE_RE = /\b(?:year|a[nñ]o)\s+(\d{1,2})\b/i;

const TEN_YEAR_RE = /\b(10-year|ten-year|10 year|10 a[nñ]os|diez a[nñ]os)\b/i;

function clampFy(n: number): number {
  return Math.min(10, Math.max(1, Math.round(n)));
}

function fyFrom(text: string): { fromFy: number; toFy: number } | null {
  const range = text.match(FY_RANGE_RE);
  if (range) return { fromFy: clampFy(Number(range[1])), toFy: clampFy(Number(range[2])) };
  const fy = text.match(FY_SINGLE_RE);
  if (fy) {
    const n = clampFy(Number(fy[1]));
    return { fromFy: n, toFy: n };
  }
  const year = text.match(YEAR_SINGLE_RE);
  if (year) {
    const n = clampFy(Number(year[1]));
    return { fromFy: n, toFy: n };
  }
  return null;
}

const EXTENDED_RE =
  /\b(extended|detailed|every line|line items|full detail|detallado|extendido)\b/i;
const SUMMARY_RE =
  /\b(summar(?:y|ised|ized)|high[- ]level|totals only|resumen|resumido)\b/i;

function depthFrom(text: string): ReportDepth | undefined {
  if (EXTENDED_RE.test(text)) return "extended";
  if (SUMMARY_RE.test(text)) return "summary";
  return undefined;
}

function withFy(kind: ReportKind, text: string, extra: Partial<ReportAsk> = {}): ReportAsk {
  const fy = fyFrom(text);
  const depth = depthFrom(text);
  return fy
    ? { kind, ...fy, ...(depth ? { depth } : {}), ...extra }
    : { kind, ...(depth ? { depth } : {}), ...extra };
}

/**
 * Live report from the cash-flow engine.
 * Income / P&L is not on the shelf — Nico builds it while the user waits.
 */
export function parseReportAsk(message: string): ReportAsk | null {
  const text = message.trim();
  if (!text) return null;

  if (RETURNS_RE.test(text)) {
    return withFy("returns", text);
  }
  if (SENS_RE.test(text)) {
    return withFy("sensitivity", text);
  }
  if (INCOME_RE.test(text)) {
    return withFy("income", text, {
      liveBuild: true,
      waitLine:
        detectReplyLanguage(text) === "es"
          ? "Un momento — ese estado de resultados no está en el estante. Lo estoy armando ahora con el modelo en vivo."
          : "Give me a moment — I don't have that income statement on the shelf. Building it now from the live model.",
    });
  }

  if (TEN_YEAR_RE.test(text) && !FY_RANGE_RE.test(text) && !STATEMENTS_RE.test(text)) {
    return null;
  }

  const fy = fyFrom(text);
  if (fy && (STATEMENTS_RE.test(text) || FY_RANGE_RE.test(text) || FY_SINGLE_RE.test(text))) {
    return withFy("statements", text);
  }
  if (STATEMENTS_RE.test(text)) {
    return withFy("statements", text, fy ?? { fromFy: 1, toFy: 10 });
  }
  return null;
}

export function isPeriodReportRequest(message: string): boolean {
  return parseReportAsk(message) !== null;
}
