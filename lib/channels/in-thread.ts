import { prisma } from "@/lib/db";

/** Marker written into a conversation Message after an approved attach. */
export function artifactThreadMarker(artifactId: string): string {
  return `artifact:${artifactId}`;
}

/**
 * Q2: re-attaching a file the user already has in-thread is not a new send.
 */
export async function artifactAlreadyInThread(
  conversationId: string | undefined,
  artifactId: string | undefined,
): Promise<boolean> {
  if (!conversationId || !artifactId) return false;
  const count = await prisma.message.count({
    where: {
      conversationId,
      content: { contains: artifactThreadMarker(artifactId) },
    },
  });
  return count > 0;
}

export function sendAttachFields(rawInput: unknown): {
  conversationId?: string;
  artifactId?: string;
} {
  if (!rawInput || typeof rawInput !== "object") return {};
  const row = rawInput as { conversationId?: unknown; artifactId?: unknown };
  return {
    conversationId:
      typeof row.conversationId === "string" ? row.conversationId : undefined,
    artifactId: typeof row.artifactId === "string" ? row.artifactId : undefined,
  };
}
