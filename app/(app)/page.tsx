import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasCurrentNdaForSubject } from "@/lib/domain/access";
import { registry } from "@/lib/procedures";
import type { Capability } from "@/lib/contracts/procedure";
import { Copilot } from "@/components/nico/copilot";
import { nicoAgentHostFromEnv } from "@/lib/nico/attach";

export default async function CopilotPage() {
  const actor = await getSessionActor();
  if (!actor) redirect("/sign-in");

  let capabilities: Capability[] = [];
  if (actor.role === "admin") {
    const listed = (await registry.invoke(
      "capabilities.list",
      {},
      { actor, traceId: crypto.randomUUID() },
    )) as { capabilities: Capability[] };
    capabilities = listed.capabilities;
  }

  const profile = await prisma.profile.findUnique({
    where: { authSubject: actor.id },
    select: { org: true, bio: true, email: true },
  });
  const needsIntake =
    actor.role !== "admin" && (!profile?.org || !profile.bio);
  const needsNda =
    (actor.role === "investor" || actor.role === "guest") &&
    !(await hasCurrentNdaForSubject(actor.id));

  return (
    <Copilot
      capabilities={capabilities}
      isAdmin={actor.role === "admin"}
      userName={actor.displayName}
      userRole={actor.role}
      userEmail={profile?.email ?? null}
      userId={actor.id}
      needsIntake={needsIntake}
      needsNda={needsNda}
      agentUrl={nicoAgentHostFromEnv()}
    />
  );
}
