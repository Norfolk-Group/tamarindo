import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ProcedureError } from "@/lib/procedures/registry";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const workosKey = process.env.WORKOS_API_KEY;
beforeEach(() => {
  delete process.env.WORKOS_API_KEY;
});
afterEach(() => {
  if (workosKey === undefined) delete process.env.WORKOS_API_KEY;
  else process.env.WORKOS_API_KEY = workosKey;
});

const admin = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "invite-test",
};

const payload = {
  email: "lp@example.com",
  role: "investor" as const,
};

describe("invitations.send (U8)", () => {
  it("refuses an invite without a consumed approval", async () => {
    await seed();
    await expect(
      registry.invoke("invitations.send", payload, admin),
    ).rejects.toMatchObject({ code: "approval_required" } satisfies Pick<
      ProcedureError,
      "code"
    >);
  });

  it("writes a Neon invite and leaves workosId null when WorkOS is unset", async () => {
    await seed();
    const requested = (await registry.invoke(
      "approvals.request",
      {
        procedure: "invitations.send",
        payload,
        reason: "Invite an LP",
      },
      admin,
    )) as { approvalId: string };

    await registry.invoke(
      "approvals.decide",
      { approvalId: requested.approvalId, decision: "approved" },
      admin,
    );

    const sent = (await registry.invoke(
      "invitations.send",
      { approvalId: requested.approvalId, ...payload },
      admin,
    )) as { id: string; email: string; role: string; workosId: string | null };

    expect(sent.email).toBe(payload.email);
    expect(sent.role).toBe("investor");
    expect(sent.workosId).toBeNull();

    const row = await prisma.invitation.findUnique({ where: { id: sent.id } });
    expect(row?.email).toBe(payload.email);
    expect(row?.role).toBe("investor");
    expect(row?.workosId).toBeNull();
  });
});
