import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { workosConfigState } from "@/lib/auth/env";
import {
  INVITE_EMAIL_COOKIE,
  readInviteEmail,
} from "@/lib/auth/invite-cookie";
import { prisma } from "@/lib/db";

/**
 * WorkOS initiate-login URL. Configure this path in the AuthKit Redirects
 * tab (`http://localhost:3000/login`). Must be a route handler — `getSignInUrl`
 * sets a PKCE cookie and cannot run in a Server Component.
 */
export async function GET(request: Request) {
  if (workosConfigState() !== "ready") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  const incoming = new URL(request.url);
  const jar = await cookies();
  const cookieHint = readInviteEmail(jar.get(INVITE_EMAIL_COOKIE)?.value);
  if (cookieHint) jar.delete(INVITE_EMAIL_COOKIE);
  const pendingHint = cookieHint
    ? await prisma.invitation.findFirst({
        where: { email: cookieHint, status: "pending" },
        select: { id: true },
      })
    : null;
  const loginHint =
    incoming.searchParams.get("loginHint") ??
    (pendingHint ? cookieHint : undefined);
  const fromInvite =
    incoming.searchParams.get("invite") === "1" || Boolean(pendingHint);
  const { getSignInUrl, getSignUpUrl } = await import(
    "@workos-inc/authkit-nextjs"
  );
  const options = loginHint ? { loginHint } : {};
  return redirect(
    fromInvite ? await getSignUpUrl(options) : await getSignInUrl(options),
  );
}
