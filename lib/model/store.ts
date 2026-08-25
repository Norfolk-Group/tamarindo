import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db";
import type { CaseSource } from "@/lib/model/types";
import { defaultValues, mergeValues, type VariableValue } from "@/lib/model/variables";
import { profileIdFor } from "@/lib/procedures/profile";

export const MODEL_VARS_TITLE = "__tamarindo_model_variables__";

export type { CaseSource };

export function personalVarsTitle(profileId: string): string {
  return `${MODEL_VARS_TITLE}:${profileId}`;
}

export function resolveModelCase(
  personal: Record<string, VariableValue> | null | undefined,
  shared: Record<string, VariableValue> | null | undefined,
): { values: Record<string, VariableValue>; source: CaseSource } {
  if (personal && Object.keys(personal).length > 0) {
    return { values: mergeValues(personal), source: "personal" };
  }
  if (shared && Object.keys(shared).length > 0) {
    return { values: mergeValues(shared), source: "shared" };
  }
  return { values: defaultValues(), source: "seed" };
}

async function overridesFor(
  title: string,
): Promise<Record<string, VariableValue> | null> {
  const row = await prisma.artifact.findFirst({
    where: { title, kind: "memo" },
    orderBy: { updatedAt: "desc" },
  });
  const metadata =
    row?.metadata && typeof row.metadata === "object"
      ? (row.metadata as { overrides?: Record<string, VariableValue> })
      : {};
  return metadata.overrides ?? null;
}

/** Live inputs for this person. Personal save wins; else the shared company row; else seeds. */
export async function loadModelValues(
  profileId?: string | null,
): Promise<Record<string, VariableValue>> {
  const caseRow = await describeModelCase(profileId);
  return caseRow.values;
}

export async function describeModelCase(profileId?: string | null): Promise<{
  values: Record<string, VariableValue>;
  source: CaseSource;
}> {
  const personal = profileId ? await overridesFor(personalVarsTitle(profileId)) : null;
  const shared = await overridesFor(MODEL_VARS_TITLE);
  return resolveModelCase(personal, shared);
}

export async function loadValuesForActor(actor: { id: string }): Promise<Record<string, VariableValue>> {
  try {
    const profileId = await profileIdFor(actor.id);
    return loadModelValues(profileId);
  } catch {
    return loadModelValues();
  }
}

export async function saveModelValues(
  overrides: Record<string, VariableValue>,
  createdById: string,
): Promise<Record<string, VariableValue>> {
  const merged = mergeValues(overrides);
  const title = personalVarsTitle(createdById);
  const existing = await prisma.artifact.findFirst({
    where: { title, kind: "memo" },
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
        title,
        createdById,
        metadata,
        storageRef: "model:variables",
      },
    });
  }
  return merged;
}

/** Admin: write the shared company case. New people inherit this until they save. */
export async function publishSharedCase(
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

export async function discardPersonalCase(profileId: string): Promise<{
  values: Record<string, VariableValue>;
  source: CaseSource;
}> {
  const title = personalVarsTitle(profileId);
  await prisma.artifact.deleteMany({
    where: { title, kind: "memo" },
  });
  return describeModelCase(profileId);
}
