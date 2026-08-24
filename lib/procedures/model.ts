import { z } from "zod";
import { renderWorkbookXlsx } from "@/lib/artifacts/excel";
import {
  diffScenarios,
  explainCell,
  latestScenarioId,
  listScenarios,
  saveScenario,
} from "@/lib/model/cell-store";
import { runCashflowModel } from "@/lib/model/engine";
import { cashflowWorkbookSpec } from "@/lib/model/excel-spec";
import { renderCashflowHtml } from "@/lib/model/html";
import { renderCashflowPdf } from "@/lib/model/pdf";
import { loadModelValues, saveModelValues } from "@/lib/model/store";
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
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (_input, ctx) => {
    const values = await loadModelValues();
    return {
      model: runCashflowModel(values),
      variables: viewsForRole(values, ctx.actor.role),
      canEditAdmin: ctx.actor.role === "admin",
    };
  },
});

export const modelSetVariables = defineProcedure({
  name: "model.setVariables",
  description:
    "Set cash-flow model variables. Members may set the published key set; admin may set every variable. Recalculates on the server.",
  input: z.object({
    values: z.record(z.string(), VariableValueSchema),
  }),
  output: z.object({
    model: z.unknown(),
    variables: z.array(z.unknown()),
    canEditAdmin: z.boolean(),
    applied: z.array(z.string()),
  }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const current = await loadModelValues();
    const allowed = allowedKeys(ctx.actor.role);
    const applied: string[] = [];
    for (const [key, value] of Object.entries(input.values)) {
      if (!allowed.has(key)) continue;
      current[key] = value;
      applied.push(key);
    }
    const createdById = await profileIdFor(ctx.actor.id);
    const saved = await saveModelValues(current, createdById);
    return {
      model: runCashflowModel(saved),
      variables: viewsForRole(saved, ctx.actor.role),
      canEditAdmin: ctx.actor.role === "admin",
      applied,
    };
  },
});

export const modelExport = defineProcedure({
  name: "model.export",
  description:
    "Build HTML, PDF, or Excel of the current cash-flow statement. Calculation stays on the server.",
  input: z.object({
    format: z.enum(["html", "pdf", "xlsx"]),
  }),
  output: z.object({
    filename: z.string(),
    contentType: z.string(),
    base64: z.string(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ format }, ctx) => {
    const values = await loadModelValues();
    const model = runCashflowModel(values);
    if (format === "html") {
      const html = renderCashflowHtml(model);
      return {
        filename: "tamarindo-cashflow.html",
        contentType: "text/html; charset=utf-8",
        base64: Buffer.from(html, "utf8").toString("base64"),
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
    const pdf = await renderCashflowPdf(renderCashflowHtml(model));
    return {
      filename: "tamarindo-cashflow.pdf",
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
    const values = await loadModelValues();
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
  description: "List stored cell-graph scenarios (base case and what-ifs).",
  input: z.object({}),
  output: z.object({ scenarios: z.array(z.unknown()) }),
  minRole: "investor",
  requiresApproval: false,
  handler: async () => ({ scenarios: await listScenarios() }),
});

export const modelDiffScenarios = defineProcedure({
  name: "model.diffScenarios",
  description:
    "Compare two stored scenarios cell by cell — inputs that moved and every statement number they changed, largest moves first.",
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
  minRole: "investor",
  requiresApproval: false,
  handler: async (input) =>
    diffScenarios(input.scenarioA, input.scenarioB, input.limit ?? 40),
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
    let scenarioId = input.scenarioId ?? (await latestScenarioId());
    if (!scenarioId) {
      const values = await loadModelValues();
      const createdById = await profileIdFor(ctx.actor.id);
      const saved = await saveScenario({
        name: "Base case (auto)",
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
