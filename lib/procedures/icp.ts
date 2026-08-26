import { z } from "zod";
import { computeContracts } from "@/lib/model/contracts";
import { CATALOG_BY_ID, isPropertyIcpId } from "@/lib/model/icp-catalog";
import { runCashflowModel } from "@/lib/model/engine";
import { productQuotes } from "@/lib/model/products";
import { loadValuesForActor, saveModelValues } from "@/lib/model/store";
import type { CatalogIcpId, IcpComputed, IcpId, Vintage } from "@/lib/model/types";
import { CATALOG_ICP_IDS, ICP_IDS } from "@/lib/model/types";
import { VARIABLE_DEFS, VARIABLE_KEYS } from "@/lib/model/variables";
import { buildPlannedVintages } from "@/lib/model/vintages";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

export const IcpIdSchema = z.enum(CATALOG_ICP_IDS);
export const PropertyIcpIdSchema = z.enum(ICP_IDS);

const CitationSchema = z.object({
  label: z.enum(["FACT", "OPINION", "ASSUMPTION"]),
  path: z.string(),
  note: z.string(),
});

export const IcpCatalogSchema = z.object({
  id: IcpIdSchema,
  assetClass: z.enum(["property", "auto", "aircraft"]),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  asset: z.string(),
  persona: z.string(),
  explanation: z.string(),
  researchNote: z.string(),
  sources: z.array(z.object({ label: z.string(), url: z.string() })),
  purchasePriceUsd: z.number(),
  fundedUsd: z.number(),
  downPaymentUsd: z.number(),
  residualUsd: z.number(),
  clientRate: z.number(),
  baseClientRate: z.number(),
  termMonths: z.number(),
  monthlyLeaseUsd: z.number(),
  mixWeight: z.number(),
  citation: CitationSchema,
});

export type IcpCatalog = z.infer<typeof IcpCatalogSchema>;

const ICP_FIELD_KEYS = [
  "purchasePriceUsd",
  "termMonths",
  "clientRate",
  "rentedTimePct",
  "rentFactor",
  "mixWeight",
] as const;

export type IcpFieldKey = (typeof ICP_FIELD_KEYS)[number];

const IcpFieldValuesSchema = z.object({
  purchasePriceUsd: z.number().optional(),
  termMonths: z.number().optional(),
  clientRate: z.number().optional(),
  rentedTimePct: z.number().optional(),
  rentFactor: z.number().optional(),
  mixWeight: z.number().optional(),
});

export function toIcpCatalog(icp: IcpComputed): IcpCatalog {
  return {
    id: icp.id,
    assetClass: "property",
    code: icp.code,
    name: icp.name,
    city: icp.city,
    neighborhood: icp.neighborhood,
    asset: icp.property,
    persona: icp.persona,
    explanation: icp.explanation,
    researchNote: icp.researchNote,
    sources: icp.sources,
    purchasePriceUsd: icp.purchasePriceUsd,
    fundedUsd: icp.fundedUsd,
    downPaymentUsd: icp.downPaymentUsd,
    residualUsd: icp.residualUsd,
    clientRate: icp.clientRate,
    baseClientRate: icp.baseClientRate,
    termMonths: icp.termMonths,
    monthlyLeaseUsd: icp.monthlyLeaseUsd,
    mixWeight: icp.mixWeight,
    citation: icp.citation,
  };
}

function toProductCatalog(
  id: CatalogIcpId,
  quote: {
    ticketUsd: number;
    fundedUsd: number;
    residualUsd: number;
    monthlyLeaseUsd: number;
    termMonths: number;
    clientRate: number;
    mixWeight: number;
  },
): IcpCatalog {
  const profile = CATALOG_BY_ID[id];
  return {
    id,
    assetClass: profile.assetClass,
    code: profile.code,
    name: profile.name,
    city: profile.city,
    neighborhood: profile.neighborhood,
    asset: profile.asset,
    persona: profile.persona,
    explanation: profile.explanation,
    researchNote: profile.researchNote,
    sources: profile.sources,
    purchasePriceUsd: quote.ticketUsd,
    fundedUsd: quote.fundedUsd,
    downPaymentUsd: quote.ticketUsd - quote.fundedUsd,
    residualUsd: quote.residualUsd,
    clientRate: quote.clientRate,
    baseClientRate: profile.clientRate,
    termMonths: quote.termMonths,
    monthlyLeaseUsd: quote.monthlyLeaseUsd,
    mixWeight: quote.mixWeight,
    citation: profile.citation,
  };
}

export function computeCatalog(
  values: Parameters<typeof computeContracts>[0],
): IcpCatalog[] {
  const homes = computeContracts(values).map(toIcpCatalog);
  const autos = productQuotes("auto", values).map((quote) =>
    toProductCatalog(quote.id, quote),
  );
  const aircraft = productQuotes("aircraft", values).map((quote) =>
    toProductCatalog(quote.id, quote),
  );
  return [...homes, ...autos, ...aircraft];
}

export function catalogById(
  values: Parameters<typeof computeContracts>[0],
  id: CatalogIcpId,
): IcpCatalog {
  const found = computeCatalog(values).find((row) => row.id === id);
  if (!found) throw new Error(`Unknown ICP ${id}`);
  return found;
}

export function icpVariableKey(id: CatalogIcpId, field: IcpFieldKey): string {
  return `icp.${id}.${field}`;
}

function allowedKeys(role: string): Set<string> {
  if (role === "admin") return VARIABLE_KEYS;
  return new Set(
    VARIABLE_DEFS.filter((def) => def.visibility === "user").map((def) => def.key),
  );
}

const IcpYearSliceSchema = z.object({
  fy: z.number(),
  label: z.string(),
  icpId: IcpIdSchema,
  originated: z.number(),
  fundedNewUsd: z.number(),
  activationUsd: z.number(),
  originationUsd: z.number(),
  servicingUsd: z.number(),
  spreadUsd: z.number(),
  rentalUsd: z.number(),
  leaseCollectedUsd: z.number(),
  remittedUsd: z.number(),
  colombiaClientUsd: z.number(),
});

export function filterPlannedVintages(
  vintages: Vintage[],
  query: { year?: number; month?: number; limit?: number },
) {
  let rows = vintages;
  if (query.year !== undefined) {
    rows = rows.filter((row) => row.year === query.year);
  }
  if (query.month !== undefined) {
    rows = rows.filter((row) => row.month === query.month);
  }
  const byMonthMap = new Map<string, { year: number; month: number; count: number }>();
  const byIcpMap = new Map<IcpId, number>();
  for (const row of rows) {
    const key = `${row.year}-${row.month}`;
    const bucket = byMonthMap.get(key) ?? {
      year: row.year,
      month: row.month,
      count: 0,
    };
    bucket.count += 1;
    byMonthMap.set(key, bucket);
    byIcpMap.set(row.icpId, (byIcpMap.get(row.icpId) ?? 0) + 1);
  }
  const limit = query.limit ?? 120;
  const capped = Math.min(2000, Math.max(1, Math.round(limit)));
  return {
    total: rows.length,
    vintages: rows.slice(0, capped),
    byMonth: [...byMonthMap.values()],
    byIcp: ICP_IDS.map((id) => ({ icpId: id as IcpId, count: byIcpMap.get(id) ?? 0 })),
  };
}

export const icpList = defineProcedure({
  name: "icp.list",
  description:
    "List the ten Ideal Contract Profiles — six property, two auto, two aircraft — with explanations and live lease math.",
  input: z.object({}),
  output: z.object({ icps: z.array(IcpCatalogSchema) }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (_input, ctx) => {
    const values = await loadValuesForActor(ctx.actor);
    return { icps: computeCatalog(values) };
  },
});

export const icpGet = defineProcedure({
  name: "icp.get",
  description:
    "Return one computed ICP and its consolidated year slices from the cash-flow engine.",
  input: z.object({ id: IcpIdSchema }),
  output: z.object({
    icp: IcpCatalogSchema,
    years: z.array(IcpYearSliceSchema),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const values = await loadValuesForActor(ctx.actor);
    const model = runCashflowModel(values);
    const icp = catalogById(values, input.id);
    return {
      icp,
      years: model.consolidated.years.map((year) => {
        const slice = isPropertyIcpId(input.id)
          ? year.byIcp.find((row) => row.icpId === input.id)
          : undefined;
        return {
          fy: year.fy,
          label: year.label,
          icpId: input.id,
          originated: slice?.originated ?? 0,
          fundedNewUsd: slice?.fundedNewUsd ?? 0,
          activationUsd: slice?.activationUsd ?? 0,
          originationUsd: slice?.originationUsd ?? 0,
          servicingUsd: slice?.servicingUsd ?? 0,
          spreadUsd: slice?.spreadUsd ?? 0,
          rentalUsd: slice?.rentalUsd ?? 0,
          leaseCollectedUsd: slice?.leaseCollectedUsd ?? 0,
          remittedUsd: slice?.remittedUsd ?? 0,
          colombiaClientUsd: slice?.colombiaClientUsd ?? 0,
        };
      }),
    };
  },
});

export const icpSet = defineProcedure({
  name: "icp.set",
  description:
    "Set per-ICP contract variables (price, term, rate, rented time, rent factor, mix). Admin only. Recalculates on the server.",
  input: z.object({
    id: IcpIdSchema,
    values: IcpFieldValuesSchema,
  }),
  output: z.object({
    icp: IcpCatalogSchema,
    applied: z.array(z.string()),
    model: z.unknown(),
  }),
  minRole: "admin",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const current = await loadValuesForActor(ctx.actor);
    const allowed = allowedKeys(ctx.actor.role);
    const applied: string[] = [];
    for (const field of ICP_FIELD_KEYS) {
      const value = input.values[field];
      if (value === undefined) continue;
      const key = icpVariableKey(input.id, field);
      if (!allowed.has(key)) continue;
      current[key] = value;
      applied.push(key);
    }
    const createdById = await profileIdFor(ctx.actor.id);
    const saved = await saveModelValues(current, createdById);
    const model = runCashflowModel(saved);
    return { icp: catalogById(saved, input.id), applied, model };
  },
});

export const icpVintages = defineProcedure({
  name: "icp.vintages",
  description:
    "Read the planned origination vintages — counts by month and ICP — from the cash-flow plan. Does not write originations.",
  input: z.object({
    year: z.number().int().optional(),
    month: z.number().int().min(1).max(12).optional(),
    limit: z.number().int().min(1).max(2000).optional(),
  }),
  output: z.object({
    total: z.number(),
    vintages: z.array(
      z.object({
        monthIndex: z.number(),
        year: z.number(),
        month: z.number(),
        icpId: PropertyIcpIdSchema,
      }),
    ),
    byMonth: z.array(
      z.object({
        year: z.number(),
        month: z.number(),
        count: z.number(),
      }),
    ),
    byIcp: z.array(z.object({ icpId: PropertyIcpIdSchema, count: z.number() })),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const values = await loadValuesForActor(ctx.actor);
    const contracts = computeContracts(values);
    const planned = buildPlannedVintages(values, contracts);
    return filterPlannedVintages(planned, input);
  },
});
