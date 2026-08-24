import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { artifactThreadMarker } from "@/lib/channels/in-thread";
import { hashApprovalInput } from "@/lib/procedures/approval-payload";
import { ProcedureError } from "@/lib/procedures/registry";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const providerKeys = [
  "RESEND_API_KEY",
  "RESEND_FROM",
  "META_ACCESS_TOKEN",
  "META_PHONE_NUMBER_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "TWILIO_WHATSAPP_FROM",
] as const;

const providerSnapshot = Object.fromEntries(
  providerKeys.map((key) => [key, process.env[key]]),
);

beforeEach(() => {
  for (const key of providerKeys) delete process.env[key];
});

afterEach(() => {
  for (const key of providerKeys) {
    const value = providerSnapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "member" as const,
  },
  traceId: "send-test",
};

const payload = {
  channel: "email" as const,
  to: "lp@example.com",
  body: "Approved brief.",
};

describe("communications.send", () => {
  it("refuses proactive email without approval (AE7)", async () => {
    await seed();
    await expect(
      registry.invoke("communications.send", payload, member),
    ).rejects.toMatchObject({ code: "approval_required" } satisfies Pick<
      ProcedureError,
      "code"
    >);
  });

  it("consumes an approved send once", async () => {
    await seed();
    const requested = (await registry.invoke(
      "approvals.request",
      {
        procedure: "communications.send",
        payload,
        reason: "Send the approved brief",
      },
      { ...member, actor: { ...member.actor, role: "admin" } },
    )) as { approvalId: string };

    await registry.invoke(
      "approvals.decide",
      { approvalId: requested.approvalId, decision: "approved" },
      { ...member, actor: { ...member.actor, role: "admin", kind: "user" } },
    );

    const sent = (await registry.invoke(
      "communications.send",
      { approvalId: requested.approvalId, ...payload },
      member,
    )) as { queued: boolean; channel: string };
    expect(sent.queued).toBe(true);
    expect(sent.channel).toBe("email");

    const row = await prisma.approval.findUnique({
      where: { id: requested.approvalId },
    });
    expect(row?.status).toBe("consumed");
    expect(row?.payloadHash).toBe(hashApprovalInput(payload));

    await expect(
      registry.invoke(
        "communications.send",
        { approvalId: requested.approvalId, ...payload },
        member,
      ),
    ).rejects.toMatchObject({ code: "approval_required" });
  });

  it("skips a second approval when the artifact is already in-thread (Q2)", async () => {
    await seed();
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { authSubject: "dev-local" },
    });
    const conversation = await prisma.conversation.create({
      data: { profileId: profile.id, title: "Thread" },
    });
    const artifact = await prisma.artifact.create({
      data: {
        kind: "excel",
        title: "In thread",
        createdById: profile.id,
        storageRef: "render:excel",
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "system",
        content: `${artifactThreadMarker(artifact.id)} prior attach`,
      },
    });

    const sent = (await registry.invoke(
      "communications.send",
      {
        channel: "whatsapp",
        to: "+15550001111",
        body: "Same workbook again",
        artifactId: artifact.id,
        conversationId: conversation.id,
      },
      member,
    )) as { queued: boolean; artifactId: string | null };
    expect(sent.queued).toBe(true);
    expect(sent.artifactId).toBe(artifact.id);
  });
});
