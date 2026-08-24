import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LoginForm } from "@/components/login-form";
import { workosConfigState } from "@/lib/auth/env";
import {
  INVITE_EMAIL_COOKIE,
  readInviteEmail,
} from "@/lib/auth/invite-cookie";
import { prisma } from "@/lib/db";

/**
 * When AuthKit is ready, bounce straight to `/login` so the user sees
 * one WorkOS screen. This page only renders if sign-in cannot start.
 */
export default async function SignInPage() {
  await connection();

  if (workosConfigState() !== "ready") {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm />
        </div>
      </main>
    );
  }

  const cookieEmail = readInviteEmail(
    (await cookies()).get(INVITE_EMAIL_COOKIE)?.value,
  );
  const pendingInvite = cookieEmail
    ? await prisma.invitation.findFirst({
        where: { email: cookieEmail, status: "pending" },
        select: { id: true },
      })
    : null;

  redirect(pendingInvite ? "/login?invite=1" : "/login");
}
