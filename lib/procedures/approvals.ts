import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db";
import { hashApprovalInput } from "@/lib/procedures/approval-payload";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";
import { notifyWaitingSession } from "@/lib/nico/notify-session";

const ApprovalRowSchema = z.object({
  id: z.string(),
  procedure: z.string(),
  payload: z.unknown(),
  reason: z.string(),
  status: z.enum(["pending", "approved", "rejected", "consumed"]),
  conversationId: z.string().nullable(),
  createdAt: z.string(),
});

export const approvalsRequest = defineProcedure({
  name: "approvals.request",
  description:
    "Open a human-approval card for an outbound procedure. Nico proposes; an admin decides.",
  input: z.object({
    procedure: z.string().min(1),
    payload: z.record(z.unknown()),
    reason: z.string().min(1).max(2000),
    conversationId: z.string().optional(),
  }),
  output: z.object({ approvalId: z.string() }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const requestedById = await profileIdFor(ctx.actor.id);
    const row = await prisma.approval.create({
      data: {
        procedure: input.procedure,
        payload: input.payload as Prisma.InputJsonValue,
        payloadHash: hashApprovalInput(input.payload),
        conversationId: input.conversationId,
        reason: input.reason,
        requestedById,
      },
    });
    return { approvalId: row.id };
  },
});

export const approvalsList = defineProcedure({
  name: "approvals.list",
  description: "List approval cards, newest first.",
  input: z.object({
    status: z.enum(["pending", "approved", "rejected", "consumed"]).optional(),
  }),
  output: z.object({ approvals: z.array(ApprovalRowSchema) }),
  minRole: "admin",
  requiresApproval: false,
  handler: async ({ status }) => {
    const rows = await prisma.approval.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      approvals: rows.map((row) => ({
        id: row.id,
        procedure: row.procedure,
        payload: row.payload,
        reason: row.reason,
        status: row.status,
        conversationId: row.conversationId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  },
});

export const approvalsDecide = defineProcedure({
  name: "approvals.decide",
  description: "Approve or reject a pending outbound action.",
  input: z.object({
    approvalId: z.string(),
    decision: z.enum(["approved", "rejected"]),
  }),
  output: z.object({ status: z.enum(["approved", "rejected"]) }),
  minRole: "admin",
  humanOnly: true,
  requiresApproval: false,
  handler: async (input, ctx) => {
    const decidedById = await profileIdFor(ctx.actor.id);
    const existing = await prisma.approval.findUnique({
      where: { id: input.approvalId },
    });
    if (!existing) throw new Error("Approval not found");
    if (existing.status !== "pending") {
      throw new Error(`Approval already ${existing.status}`);
    }
    await prisma.approval.update({
      where: { id: input.approvalId },
      data: {
        status: input.decision,
        decidedById,
        decidedAt: new Date(),
      },
    });
    if (input.decision === "approved") {
      await notifyWaitingSession(existing.conversationId, input.approvalId);
    }
    return { status: input.decision };
  },
});
