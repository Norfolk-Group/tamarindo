import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ReportWorkbook } from "@/lib/model/report-workbook";

export const REPORT_WORKBOOK_TITLE = "__tamarindo_report_workbook__";

/** Persist formatted sheets + cell records (formulas, tone) in Postgres. */
export async function saveReportWorkbook(
  workbook: ReportWorkbook,
  createdById: string,
): Promise<void> {
  const existing = await prisma.artifact.findFirst({
    where: { title: REPORT_WORKBOOK_TITLE, kind: "memo" },
  });
  const metadata = {
    status: "ready",
    workbook,
  } as Prisma.InputJsonValue;
  if (existing) {
    await prisma.artifact.update({
      where: { id: existing.id },
      data: { metadata },
    });
    return;
  }
  await prisma.artifact.create({
    data: {
      kind: "memo",
      title: REPORT_WORKBOOK_TITLE,
      createdById,
      metadata,
      storageRef: "model:report-workbook",
    },
  });
}

export async function loadReportWorkbook(): Promise<ReportWorkbook | null> {
  const row = await prisma.artifact.findFirst({
    where: { title: REPORT_WORKBOOK_TITLE, kind: "memo" },
    orderBy: { updatedAt: "desc" },
  });
  const metadata =
    row?.metadata && typeof row.metadata === "object"
      ? (row.metadata as { workbook?: ReportWorkbook })
      : {};
  return metadata.workbook ?? null;
}
