import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db";
import { mergeValues, type VariableValue } from "@/lib/model/variables";

export const MODEL_VARS_TITLE = "__tamarindo_model_variables__";

export async function loadModelValues(): Promise<Record<string, VariableValue>> {
  const row = await prisma.artifact.findFirst({
    where: { title: MODEL_VARS_TITLE, kind: "memo" },
    orderBy: { updatedAt: "desc" },
  });
  const metadata =
    row?.metadata && typeof row.metadata === "object"
      ? (row.metadata as { overrides?: Record<string, VariableValue> })
      : {};
  return mergeValues(metadata.overrides);
}

export async function saveModelValues(
  overrides: Record<string, VariableValue>,
  createdById: string,
): Promise<Record<string, VariableValue>> {
  const merged = mergeValues(overrides);
  const existing = await prisma.artifact.findFirst({
    where: { title: MODEL_VARS_TITLE, kind: "memo" },
  });
  const metadata = {
    status: "ready",
    overrides: merged,
  } as Prisma.InputJsonValue;
  if (existing) {
    await prisma.artifact.update({
      where: { id: existing.id },
      data: { metadata },
    });
  } else {
    await prisma.artifact.create({
      data: {
        kind: "memo",
        title: MODEL_VARS_TITLE,
        createdById,
        metadata,
        storageRef: "model:variables",
      },
    });
  }
  return merged;
}
