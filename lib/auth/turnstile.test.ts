import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/auth/turnstile";

describe("verifyTurnstile", () => {
  const previous = process.env.TURNSTILE_SECRET_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = previous;
  });

  it("rejects a missing token when the secret is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchImpl = vi.fn();
    await expect(verifyTurnstile(null, fetchImpl)).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("accepts a Cloudflare success payload", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await expect(verifyTurnstile("tok", fetchImpl)).resolves.toBe(true);
  });
});
