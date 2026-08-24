import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashApprovalInput } from "@/lib/procedures/approval-payload";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  profileFindUnique: vi.fn(),
  auditCreate: vi.fn(),
}));

const messageCount = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    approval: { findUnique: mocks.findUnique, updateMany: mocks.updateMany },
    profile: { findUnique: mocks.profileFindUnique },
    auditLog: { create: mocks.auditCreate },
    message: { count: messageCount },
  },
}));

import { z } from "zod";
import {
  ProcedureError,
  ProcedureRegistry,
  assertApprovedAndConsume,
  defineProcedure,
} from "@/lib/procedures/registry";

const payload = {
  channel: "email" as const,
  to: "a@b.c",
  body: "X",
};

describe("approval bind and consume (AE4)", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.updateMany.mockReset();
    mocks.profileFindUnique.mockResolvedValue({ id: "p1" });
    mocks.auditCreate.mockResolvedValue({});
    messageCount.mockResolvedValue(0);
  });

  it("rejects a payload that does not match the stored hash", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "appr_1",
      procedure: "communications.send",
      status: "approved",
      payloadHash: hashApprovalInput(payload),
    });
    await expect(
      assertApprovedAndConsume("communications.send", {
        approvalId: "appr_1",
        ...payload,
        to: "b@c.d",
      }),
    ).rejects.toBeInstanceOf(ProcedureError);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("consumes once; a second use fails", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "appr_1",
      procedure: "communications.send",
      status: "approved",
      payloadHash: hashApprovalInput(payload),
    });
    mocks.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(
      assertApprovedAndConsume("communications.send", {
        approvalId: "appr_1",
        ...payload,
      }),
    ).resolves.toBe("appr_1");

    mocks.findUnique.mockResolvedValue({
      id: "appr_1",
      procedure: "communications.send",
      status: "consumed",
      payloadHash: hashApprovalInput(payload),
    });
    await expect(
      assertApprovedAndConsume("communications.send", {
        approvalId: "appr_1",
        ...payload,
      }),
    ).rejects.toMatchObject({ code: "approval_required" });
  });

  it("does not leave the approval consumed when the send fails", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "appr_1",
      procedure: "communications.send",
      status: "approved",
      payloadHash: hashApprovalInput(payload),
    });
    mocks.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    const boom = new ProcedureRegistry().register(
      defineProcedure({
        name: "communications.send",
        description: "boom",
        input: z.object({
          approvalId: z.string(),
          channel: z.enum(["email", "whatsapp", "sms", "call"]),
          to: z.string(),
          body: z.string(),
        }),
        output: z.object({ queued: z.literal(true) }),
        minRole: "member",
        requiresApproval: true,
        handler: async () => {
          throw new Error("send failed");
        },
      }),
    );

    await expect(
      boom.invoke(
        "communications.send",
        { approvalId: "appr_1", ...payload },
        {
          actor: {
            kind: "user",
            id: "dev-local",
            displayName: "Ricardo (dev)",
            role: "member",
          },
          traceId: "test-restore",
        },
      ),
    ).rejects.toThrow(/send failed/);

    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: "appr_1", status: "consumed" },
      data: { status: "approved" },
    });
  });
});
