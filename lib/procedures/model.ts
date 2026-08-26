import { z } from "zod";
import type { CaseSource } from "@/lib/model/types";
import { renderWorkbookXlsx } from "@/lib/artifacts/excel";
import {
  AUTO_BASE_SCENARIO_NAME,
  diffScenarios,
  explainCell,
  getOwnedScenario,
  latestScenarioId,
  listScenarios,
  pickAllowedVariables,
  saveScenario,
} from "@/lib/model/cell-store";
import { runCashflowModel } from "@/lib/model/engine";
import { cashflowWorkbookSpec } from "@/lib/model/excel-spec";
import { renderCashflowPdf } from "@/lib/model/pdf";
import { buildReportWorkbook } from "@/lib/procedures/reports";
import { workbookForDepth } from "@/lib/model/report-depth";
import { renderReportHtml } from "@/lib/model/sheet-html";
import { renderReportCsv } from "@/lib/model/sheet-csv";
import { saveReportWorkbook } from "@/lib/model/report-store";
import {
  describeModelCase,
  discardPersonalCase,
  loadValuesForActor,
  publishSharedCase,
  saveModelValues,
} from "@/lib/model/store";
import type { ModelVariableView, VariableValue } from "@/lib/model/types";
import { VARIABLE_DEFS, VARIABLE_KEYS } from "@/lib/model/variables";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

const VariableValueSchema = z.union([z.number(), z.string()]);

function viewsForRole(
  values: Record<string, VariableValue>,
  role: string,
): ModelVariableView[] {
  return VARIABLE_DEFS.filter((def) =>
    role === "admin" ? true : def.visibility === "user",
  ).map((def) => ({ ...def, value: values[def.key] ?? def.defaultValue }));
}

function allowedKeys(role: string): Set<string> {
  if (role === "admin") return VARIABLE_KEYS;
  return new Set(
    VARIABLE_DEFS.filter((def) => def.visibility === "user").map((def) => def.key),
  );
}

export const modelGet = defineProcedure({
  name: "model.get",
  description:
    "Return the 10-year cash-flow statement and the variables this caller may see. All math is server-side.",
  input: z.object({}),
  output: z.object({
    model: z.unknown(),
    variables: z.array(z.unknown()),
    canEditAdmin: z.boolean(),
    canEdit: z.boolean(),
    caseSource: z.enum(["personal", "shared", "seed"]),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (_input, ctx) => {
    const profileId = await profileIdFor(ctx.actor.id);
    const described = await describeModelCase(profileId);
    return {
      model: runCashflowModel(described.values),
      variables: viewsForRole(described.values, ctx.actor.role),
      canEditAdmin: ctx.actor.role === "admin",
      canEdit: ctx.actor.role === "admin" || ctx.actor.role === "member",
      caseSource: described.source,
    };
  },
});

export const modelSetVariables = defineProcedure({
  name: "model.setVariables",
  description:
    "Set this caller's personal case. Members may set published keys; admin may set every variable. Recalculates on the server. resetToShared drops the personal case.",
  input: z.object({
    values: z.record(z.string(), VariableValueSchema).optional(),
    resetToShared: z.boolean().optional(),
  }),
  output: z.object({
    model: z.unknown(),
    variables: z.array(z.unknown()),
    canEditAdmin: z.boolean(),
    canEdit: z.boolean(),
    caseSource: z.enum(["personal", "shared", "seed"]),
    applied: z.array(z.string()),
  }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const createdById = await profileIdFor(ctx.actor.id);
    if (input.resetToShared) {
      const described = await discardPersonalCase(createdById);
      return {
        model: runCashflowModel(described.values),
        variables: viewsForRole(described.values, ctx.actor.role),
        canEditAdmin: ctx.actor.role === "admin",
        canEdit: true,
        caseSource: described.source as CaseSource,
        applied: [],
      };
    }
    const current = await loadValuesForActor(ctx.actor);
    const allowed = allowedKeys(ctx.actor.role);
    const applied: string[] = [];
    for (const [key, value] of Object.entries(input.values ?? {})) {
      if (!allowed.has(key)) continue;
      current[key] = value;
      applied.push(key);
    }
    const saved = await saveModelValues(current, createdById);
    return {
      model: runCashflowModel(saved),
      variables: viewsForRole(saved, ctx.actor.role),
      canEditAdmin: ctx.actor.role === "admin",
      canEdit: true,
      caseSource: "personal" as const,
      applied,
    };
  },
});

export const modelPublishShared = defineProcedure({
  name: "model.publishShared",
  description:
    "Write this admin's current case as the shared company case. Humans only — agents may still edit a personal case.",
  input: z.object({
    values: z.record(z.string(), VariableValueSchema).optional(),
  }),
  output: z.object({
    model: z.unknown(),
    variables: z.array(z.unknown()),
    canEditAdmin: z.boolean(),
    canEdit: z.boolean(),
    caseSource: z.literal("shared"),
    applied: z.array(z.string()),
  }),
  minRole: "admin",
  humanOnly: true,
  requiresApproval: false,
  handler: async (input, ctx) => {
    const createdById = await profileIdFor(ctx.actor.id);
    const current = await loadValuesForActor(ctx.actor);
    const allowed = allowedKeys(ctx.actor.role);
    for (const [key, value] of Object.entries(input.values ?? {})) {
      if (!allowed.has(key)) continue;
      current[key] = value;
    }
    const saved = await publishSharedCase(current, createdById);
    return {
      model: runCashflowModel(saved),
      variables: viewsForRole(saved, ctx.actor.role),
      canEditAdmin: true,
      canEdit: true,
      caseSource: "shared" as const,
      applied: ["__shared__"],
    };
  },
});

export const modelExport = defineProcedure({
  name: "model.export",
  description:
    "Build HTML, PDF, CSV, or Excel of a live report (statements, investor returns, or sensitivity). Calculation stays on the server.",
  input: z.object({
    format: z.enum(["html", "pdf", "xlsx", "csv"]),
    kind: z.enum(["statements", "returns", "sensitivity", "income"]).optional(),
    depth: z.enum(["summary", "extended"]).optional(),
  }),
  output: z.object({
    filename: z.string(),
    contentType: z.string(),
    base64: z.string(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ format, kind: rawKind, depth: rawDepth }, ctx) => {
    const kind = rawKind ?? "statements";
    const depth = rawDepth ?? (format === "html" ? "summary" : "extended");
    const values = await loadValuesForActor(ctx.actor);
    const model = runCashflowModel(values);
    const workbook = buildReportWorkbook(kind, model, values, 1, model.fyCount);
    try {
      const createdById = await profileIdFor(ctx.actor.id);
      await saveReportWorkbook(workbook, createdById);
    } catch {
      /* Export still returns bytes if the workbook row cannot persist. */
    }
    const stem =
      kind === "returns"
        ? "tamarindo-returns"
        : kind === "sensitivity"
          ? "tamarindo-sensitivity"
          : kind === "income"
            ? "tamarindo-income"
            : "tamarindo-cashflow";
    const depthTag = `-${depth}`;
    if (format === "html") {
      return {
        filename: `${stem}.html`,
        contentType: "text/html; charset=utf-8",
        base64: Buffer.from(renderReportHtml(workbook, { depth }), "utf8").toString("base64"),
      };
    }
    if (format === "csv") {
      return {
        filename: `${stem}${depthTag}.csv`,
        contentType: "text/csv; charset=utf-8",
        base64: Buffer.from(renderReportCsv(workbookForDepth(workbook, depth)), "utf8").toString(
          "base64",
        ),
      };
    }
    if (format === "xlsx") {
      const bytes = renderWorkbookXlsx(
        cashflowWorkbookSpec(model, {
          admin: ctx.actor.role === "admin",
          values,
        }),
      );
      return {
        filename: "tamarindo-cashflow.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64: bytes.toString("base64"),
      };
    }
    const html = renderReportHtml(workbook, { depth });
    const pdf = await renderCashflowPdf(html);
    return {
      filename: `${stem}${depthTag}.pdf`,
      contentType: "application/pdf",
      base64: pdf.toString("base64"),
    };
  },
});

export const modelSaveScenario = defineProcedure({
  name: "model.saveScenario",
  description:
    "Materialize the current model run into the cell graph as a named scenario — every number stored with its formula and dependencies.",
  input: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2_000).optional(),
    isBase: z.boolean().optional(),
  }),
  output: z.object({
    scenarioId: z.string(),
    cellCount: z.number(),
    depCount: z.number(),
  }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const values = await loadValuesForActor(ctx.actor);
    const createdById = await profileIdFor(ctx.actor.id);
    return saveScenario({
      name: input.name,
      description: input.description,
      values,
      isBase: ctx.actor.role === "admin" ? (input.isBase ?? false) : false,
      createdById,
    });
  },
});

export const modelListScenarios = defineProcedure({
  name: "model.listScenarios",
  description:
    "List this caller's named what-ifs. Members see only published (blue) keys. Auto-saved base cases are hidden.",
  input: z.object({}),
  output: z.object({ scenarios: z.array(z.unknown()) }),
  minRole: "member",
  requiresApproval: false,
  handler: async (_input, ctx) => {
    const createdById = await profileIdFor(ctx.actor.id);
    const allowed = allowedKeys(ctx.actor.role);
    const scenarios = (await listScenarios(createdById)).map((row) => ({
      ...row,
      variables:
        ctx.actor.role === "admin"
          ? row.variables
          : pickAllowedVariables(row.variables, allowed),
    }));
    return { scenarios };
  },
});

export const modelApplyScenario = defineProcedure({
  name: "model.applyScenario",
  description:
    "Load one of this caller's named what-ifs onto their personal case. Never publishes the company case. Members persist only published keys.",
  input: z.object({
    scenarioId: z.string().min(1),
  }),
  output: z.object({
    model: z.unknown(),
    variables: z.array(z.unknown()),
    canEditAdmin: z.boolean(),
    canEdit: z.boolean(),
    caseSource: z.literal("personal"),
    applied: z.array(z.string()),
  }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const createdById = await profileIdFor(ctx.actor.id);
    const snapshot = await getOwnedScenario(input.scenarioId, createdById);
    const current = await loadValuesForActor(ctx.actor);
    const allowed = allowedKeys(ctx.actor.role);
    const applied: string[] = [];
    for (const [key, value] of Object.entries(snapshot.variables)) {
      if (!allowed.has(key)) continue;
      current[key] = value;
      applied.push(key);
    }
    const saved = await saveModelValues(current, createdById);
    return {
      model: runCashflowModel(saved),
      variables: viewsForRole(saved, ctx.actor.role),
      canEditAdmin: ctx.actor.role === "admin",
      canEdit: true,
      caseSource: "personal" as const,
      applied,
    };
  },
});

export const modelDiffScenarios = defineProcedure({
  name: "model.diffScenarios",
  description:
    "Compare two of this caller's named what-ifs. Members see blue inputs and statement totals, not grey keys.",
  input: z.object({
    scenarioA: z.string(),
    scenarioB: z.string(),
    limit: z.number().int().min(1).max(200).optional(),
  }),
  output: z.object({
    scenarioA: z.unknown(),
    scenarioB: z.unknown(),
    changed: z.array(z.unknown()),
    totalChanged: z.number(),
  }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const createdById = await profileIdFor(ctx.actor.id);
    return diffScenarios(
      input.scenarioA,
      input.scenarioB,
      createdById,
      input.limit ?? 40,
      ctx.actor.role,
    );
  },
});

export const modelExplain = defineProcedure({
  name: "model.explain",
  description:
    "Explain where a number comes from: walk the stored cell graph from a cell key (e.g. us.spread.fy3) down through its formula inputs.",
  input: z.object({
    key: z.string().min(1).max(200),
    scenarioId: z.string().optional(),
    depth: z.number().int().min(0).max(4).optional(),
  }),
  output: z.object({ cell: z.unknown(), scenarioId: z.string() }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const createdById = await profileIdFor(ctx.actor.id);
    let scenarioId = input.scenarioId;
    if (scenarioId) {
      await getOwnedScenario(scenarioId, createdById);
    } else {
      scenarioId = (await latestScenarioId(createdById)) ?? undefined;
    }
    if (!scenarioId) {
      const values = await loadValuesForActor(ctx.actor);
      const saved = await saveScenario({
        name: AUTO_BASE_SCENARIO_NAME,
        values,
        isBase: true,
        createdById,
      });
      scenarioId = saved.scenarioId;
    }
    const cell = await explainCell(scenarioId, input.key, input.depth ?? 2);
    if (!cell) {
      throw new Error(`Unknown cell key "${input.key}" in scenario ${scenarioId}`);
    }
    return { cell, scenarioId };
  },
});
