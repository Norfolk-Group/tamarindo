import { NextResponse, type NextRequest } from "next/server";
import { allowDevActor, workosConfigState } from "@/lib/auth/env";
import { sessionGate } from "@/lib/auth/gate";

/**
 * AuthKit session gate. Kept as `middleware.ts` (Edge) rather than Next 16
 * `proxy.ts` (Node) because OpenNext on Workers does not yet support Node
 * middleware. Do not add `proxy.ts` alongside this file (Next E900).
 *
 * Allowlist: health, named webhooks, `/agents/*` (KTD10).
 * Handshake issuer, capabilities, chat, NDA, and admin stay session-gated.
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const config = workosConfigState();
  const allowDevBypass = config === "absent" && allowDevActor();

  if (config === "partial") {
    console.error("[auth] workos_partial_config");
  }

  if (config === "ready") {
    return gateWithAuthKit(request, pathname);
  }

  return applyGate(request, sessionGate(pathname, false, { allowDevBypass }));
}

async function gateWithAuthKit(request: NextRequest, pathname: string) {
  const {
    authkit,
    applyResponseHeaders,
    handleAuthkitProxy,
    partitionAuthkitHeaders,
  } = await import("@workos-inc/authkit-nextjs");

  const redirectUri =
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
    new URL("/callback", request.url).toString();

  const { session, headers } = await authkit(request, { redirectUri });
  const decision = sessionGate(pathname, Boolean(session.user), {
    allowDevBypass: false,
  });

  if (decision.action === "redirect") {
    return handleAuthkitProxy(request, headers, { redirect: decision.to });
  }

  if (decision.action === "unauthorized") {
    const { responseHeaders } = partitionAuthkitHeaders(request, headers);
    const response = NextResponse.json(
      { ok: false, error: { message: "No session", code: "UNAUTHORIZED" } },
      { status: 401 },
    );
    return applyResponseHeaders(response, responseHeaders);
  }

  return handleAuthkitProxy(request, headers);
}

function applyGate(
  request: NextRequest,
  decision: ReturnType<typeof sessionGate>,
) {
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }
  if (decision.action === "unauthorized") {
    return NextResponse.json(
      { ok: false, error: { message: "No session", code: "UNAUTHORIZED" } },
      { status: 401 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
