import Script from "next/script";
import { lookupInvitationEmailByToken } from "@/lib/auth/accept-invite";
import { getSessionActor } from "@/lib/auth";

/**
 * Guest invite accept. Turnstile protects this page, not copilot GET (U8).
 */
export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invitation_token?: string }>;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const { invitation_token } = await searchParams;
  const [invitedEmail, actor] = await Promise.all([
    lookupInvitationEmailByToken(invitation_token),
    getSessionActor(),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <p className="text-sm font-semibold tracking-widest text-muted-foreground">
        TAMARINDO
      </p>
      <h1 className="text-2xl font-semibold">Accept your invite</h1>
      {actor ? (
        <p className="max-w-md text-center text-sm text-amber-400">
          You are signed in as {actor.displayName} ({actor.role}). Continue
          signs that session out so the invited address can sign up.
        </p>
      ) : (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Enter the email that received the invitation. After the check, you
          will sign in with WorkOS. First login is guest until this invite
          applies the tagged role.
        </p>
      )}
      <form
        action="/api/invite/accept"
        method="post"
        className="flex w-full max-w-sm flex-col gap-3"
      >
        {invitation_token ? (
          <input
            type="hidden"
            name="invitation_token"
            value={invitation_token}
          />
        ) : null}
        <input
          type="email"
          name="email"
          required
          defaultValue={invitedEmail}
          placeholder="you@example.com"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
        {siteKey ? (
          <>
            <div
              className="cf-turnstile"
              data-sitekey={siteKey}
              data-theme="dark"
            />
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
            />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Turnstile site key is unset. Local loopback may skip the widget.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
