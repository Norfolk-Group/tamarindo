import { describe, expect, it } from "vitest";
import { signDownloadToken, verifyDownloadToken } from "@/lib/artifacts/signed-url";

const SECRET = "download-secret-at-least-16";

describe("artifact download tokens", () => {
  it("binds audience to profileId and expires in at most 5 minutes", async () => {
    const now = Date.parse("2026-08-22T12:00:00Z");
    const token = await signDownloadToken(
      { artifactId: "art_1", profileId: "prof_1" },
      { secret: SECRET, nowMs: now, ttlMs: 10 * 60 * 1000 },
    );
    const claims = await verifyDownloadToken(token, {
      secret: SECRET,
      nowMs: now + 60_000,
      profileId: "prof_1",
    });
    expect(claims.artifactId).toBe("art_1");
    expect(claims.exp - now).toBeLessThanOrEqual(5 * 60 * 1000);
  });

  it("rejects investor B using investor A's token", async () => {
    const token = await signDownloadToken(
      { artifactId: "art_1", profileId: "prof_a" },
      { secret: SECRET },
    );
    await expect(
      verifyDownloadToken(token, { secret: SECRET, profileId: "prof_b" }),
    ).rejects.toThrow(/audience/);
  });
});
