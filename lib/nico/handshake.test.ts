import { describe, expect, it } from "vitest";
import { signHandshake, verifyHandshake, HandshakeError } from "@/lib/nico/handshake";

const SECRET = "handshake-secret-at-least-16";

describe("handshake assertion", () => {
  it("round-trips a signed assertion", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "profile_1",
        conversationId: "conv_1",
      },
      { secret: SECRET, nowMs: 1_000_000 },
    );
    const claims = await verifyHandshake(token, { secret: SECRET, nowMs: 1_000_100 });
    expect(claims.authSubject).toBe("user_1");
    expect(claims.profileId).toBe("profile_1");
    expect(claims.conversationId).toBe("conv_1");
  });

  it("rejects a tampered payload", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "profile_1",
        conversationId: "conv_1",
      },
      { secret: SECRET },
    );
    const [body, sig] = token.split(".");
    const tampered = `${btoa(JSON.stringify({ ...JSON.parse(atob(body)), authSubject: "admin" }))}.${sig}`;
    await expect(verifyHandshake(tampered, { secret: SECRET })).rejects.toBeInstanceOf(
      HandshakeError,
    );
  });

  it("rejects an expired assertion", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "profile_1",
        conversationId: "conv_1",
      },
      { secret: SECRET, nowMs: 1_000, ttlMs: 10 },
    );
    await expect(
      verifyHandshake(token, { secret: SECRET, nowMs: 2_000 }),
    ).rejects.toMatchObject({ code: "handshake_unverified" });
  });

  it("rejects a disallowed Origin", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "profile_1",
        conversationId: "conv_1",
      },
      { secret: SECRET },
    );
    await expect(
      verifyHandshake(token, {
        secret: SECRET,
        origin: "https://evil.example",
        allowedOrigins: ["https://tamarindo.example"],
      }),
    ).rejects.toBeInstanceOf(HandshakeError);
  });
});
