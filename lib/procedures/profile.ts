import { prisma } from "@/lib/db";

export async function profileIdFor(authSubject: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { authSubject },
    select: { id: true },
  });
  if (!profile) {
    throw new Error(`No profile for actor ${authSubject} — session must upsert first`);
  }
  return profile.id;
}
