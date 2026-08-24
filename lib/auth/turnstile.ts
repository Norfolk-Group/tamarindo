import { allowDevActor } from "@/lib/auth/env";

/**
 * Invite-accept gate (U8). Copilot GET is not Turnstile-protected.
 * Fail closed when the secret is missing except on the local loopback bypass.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return allowDevActor();
  if (!token) return false;
  const res = await fetchImpl(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    },
  );
  if (!res.ok) return false;
  const body = (await res.json()) as { success?: boolean };
  return body.success === true;
}
