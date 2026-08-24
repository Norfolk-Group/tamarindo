import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyPendingInvitation } from "@/lib/auth/accept-invite";
import { prisma } from "@/lib/db";
import { seed } from "../../prisma/seed";

const EMAIL = "lp-accept@example.com";
const SUBJECT = "user_invite_accept";
const workosKey = process.env.WORKOS_API_KEY;

beforeEach(() => {
  delete process.env.WORKOS_API_KEY;
});

afterEach(async () => {
  if (workosKey === undefined) delete process.env.WORKOS_API_KEY;
  else process.env.WORKOS_API_KEY = workosKey;
  await prisma.invitation.deleteMany({ where: { email: EMAIL } });
  await prisma.profile.deleteMany({ where: { authSubject: SUBJECT } });
});

async function pendingInvite(role: "investor" | "member" = "investor") {
  await seed();
  const inviter = await prisma.profile.findUniqueOrThrow({
    where: { authSubject: "dev-local" },
  });
  await prisma.invitation.create({
    data: {
      email: EMAIL,
      role,
      inviterId: inviter.id,
    },
  });
  await prisma.profile.upsert({
    where: { authSubject: SUBJECT },
    create: {
      authSubject: SUBJECT,
      displayName: "LP Accept",
      role: "guest",
      email: EMAIL,
    },
    update: { role: "guest", email: EMAIL },
  });
}

describe("applyPendingInvitation (U8)", () => {
  it("applies the invited role to a guest and marks the invite accepted", async () => {
    await pendingInvite("investor");
    const result = await applyPendingInvitation({
      email: EMAIL,
      authSubject: SUBJECT,
    });
    expect(result).toEqual({ applied: true, role: "investor" });

    const profile = await prisma.profile.findUniqueOrThrow({
      where: { authSubject: SUBJECT },
    });
    expect(profile.role).toBe("investor");

    const invite = await prisma.invitation.findFirstOrThrow({
      where: { email: EMAIL },
    });
    expect(invite.status).toBe("accepted");
    expect(invite.acceptedAt).toBeTruthy();
  });

  it("does not downgrade an existing admin and leaves the invite pending", async () => {
    await pendingInvite("investor");
    await prisma.profile.update({
      where: { authSubject: SUBJECT },
      data: { role: "admin" },
    });

    const result = await applyPendingInvitation({
      email: EMAIL,
      authSubject: SUBJECT,
    });
    expect(result).toEqual({ applied: false, role: "admin" });

    const invite = await prisma.invitation.findFirstOrThrow({
      where: { email: EMAIL },
    });
    expect(invite.status).toBe("pending");
  });

  it("returns null when there is no pending invite", async () => {
    await seed();
    await prisma.profile.upsert({
      where: { authSubject: SUBJECT },
      create: {
        authSubject: SUBJECT,
        displayName: "LP Accept",
        role: "guest",
      },
      update: { role: "guest" },
    });
    await expect(
      applyPendingInvitation({ email: EMAIL, authSubject: SUBJECT }),
    ).resolves.toBeNull();
  });
});
