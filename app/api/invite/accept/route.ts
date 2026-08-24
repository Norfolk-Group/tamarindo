import { inviteEmailCookieHeader } from "@/lib/auth/invite-cookie";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { prisma } from "@/lib/db";
import { jsonErr } from "@/lib/http/api-response";

/** Guest invite accept. Turnstile-gated; then AuthKit `/login`. */
export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(form.get("cf-turnstile-response") ?? "");
  const invitationToken = String(form.get("invitation_token") ?? "").trim();
  if (!(await verifyTurnstile(token))) {
    return jsonErr("Turnstile verification failed", 403, { code: "FORBIDDEN" });
  }
  if (!email) return jsonErr("Email is required", 400, { code: "BAD_REQUEST" });

  const invite = await prisma.invitation.findFirst({
    where: { email, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!invite) {
    return jsonErr("No pending invitation for that email", 404, {
      code: "NOT_FOUND",
    });
  }

  const tokenMatch = await emailMatchesWorkosToken(invitationToken, email);
  if (tokenMatch === false) {
    return jsonErr("Invitation token does not match that email", 403, {
      code: "FORBIDDEN",
    });
  }

  const logout = new URL("/logout", request.url);
  logout.searchParams.set("returnTo", "/login");
  const response = Response.redirect(logout, 303);
  response.headers.append("Set-Cookie", inviteEmailCookieHeader(email));
  return response;
}

/** `null` = skipped (no token or WorkOS unset). `false` = mismatch. */
async function emailMatchesWorkosToken(
  invitationToken: string,
  email: string,
): Promise<boolean | null> {
  if (!invitationToken) return null;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return null;
  try {
    const { WorkOS } = await import("@workos-inc/node");
    const invitation = await new WorkOS(
      apiKey,
    ).userManagement.findInvitationByToken(invitationToken);
    return invitation.email.trim().toLowerCase() === email;
  } catch (err) {
    console.error("[invite] workos_find_by_token_failed", err);
    return false;
  }
}
