import { NextResponse } from "next/server";
import { workosConfigState } from "@/lib/auth/env";
import { safeReturnTo } from "@/lib/auth/return-to";

/**
 * Clear the AuthKit session before invite signup. First login must not
 * reuse the operator's existing admin cookie (U8 / F4).
 */
export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const returnTo = safeReturnTo(incoming.searchParams.get("returnTo"));
  if (workosConfigState() !== "ready") {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }
  const { signOut } = await import("@workos-inc/authkit-nextjs");
  await signOut({ returnTo: new URL(returnTo, request.url).toString() });
}
