import type { Actor } from "@/lib/contracts/procedure";
import { hasCurrentNda } from "@/lib/domain/access";
import { prisma } from "@/lib/db";
import {
  type AddressStyle,
  addressStyleFromMemory,
  askedGivenNamePermission,
  familyNameFromDisplayName,
  givenNameFromDisplayName,
  parseAddressConsent,
} from "@/lib/nico/given-name";
import { listRecentMessages } from "@/lib/nico/session";

export type WhoContext = {
  givenName: string | null;
  familyName: string | null;
  addressStyle: AddressStyle;
  askGivenName: boolean;
  pendingNameAsk: boolean;
  whoNote: string;
};

const BIO_LIMIT = 280;

/**
 * Registration + intake + how to address this person. Always injected so
 * Nico is not meeting a stranger every turn.
 */
export async function loadWho(input: {
  actor: Actor;
  conversationId: string;
  userMessage: string;
  memoryNote?: string;
}): Promise<WhoContext> {
  const profile = await prisma.profile.findUnique({
    where: { authSubject: input.actor.id },
    select: {
      displayName: true,
      org: true,
      bio: true,
      role: true,
      ndaSignedAt: true,
      ndaSignatures: { select: { templateVersion: true } },
    },
  });

  const displayName = profile?.displayName ?? input.actor.displayName;
  const givenName = givenNameFromDisplayName(displayName);
  const familyName = familyNameFromDisplayName(displayName);
  const remembered = addressStyleFromMemory(input.memoryNote ?? "");
  const messages = await listRecentMessages(input.conversationId, 40);
  const priorAssistant = [...messages]
    .reverse()
    .find((row) => row.role === "assistant");
  const pendingNameAsk = priorAssistant
    ? askedGivenNamePermission(priorAssistant.content)
    : false;
  const thisTurn = parseAddressConsent(input.userMessage, { pendingAsk: pendingNameAsk });
  const addressStyle = thisTurn ?? remembered;
  const alreadyAsked = messages.some(
    (row) => row.role === "assistant" && askedGivenNamePermission(row.content),
  );
  const askGivenName =
    Boolean(givenName) && addressStyle === "unknown" && !alreadyAsked;

  const nda =
    (profile?.role ?? input.actor.role) === "admin"
      ? "not required"
      : profile && hasCurrentNda(profile)
        ? "executed"
        : "pending";

  return {
    givenName,
    familyName,
    addressStyle,
    askGivenName,
    pendingNameAsk,
    whoNote: formatWhoNote({
      displayName,
      givenName,
      familyName,
      org: profile?.org ?? null,
      bio: profile?.bio ?? null,
      role: profile?.role ?? input.actor.role,
      nda,
      addressStyle,
      askGivenName,
    }),
  };
}

export function formatWhoNote(input: {
  displayName: string;
  givenName: string | null;
  familyName: string | null;
  org: string | null;
  bio: string | null;
  role: string;
  nda: "executed" | "pending" | "not required";
  addressStyle: AddressStyle;
  askGivenName: boolean;
}): string {
  const lines = [
    "Who this is (registration + intake — treat as true):",
    `- Name on file: ${input.displayName}`,
  ];
  if (input.givenName) {
    lines.push(`- Given name: ${input.givenName}`);
  } else {
    lines.push(
      "- Given name: unknown. Ask what to call them. Do not invent a nickname.",
    );
  }
  if (input.familyName) lines.push(`- Family name: ${input.familyName}`);
  if (input.org) lines.push(`- Organization: ${input.org}`);
  if (input.org && /norfolk/i.test(input.org)) {
    lines.push(
      "- Organization note: Norfolk AI builds this software. It is not Tamarindo, not a capital partner, and has no seat on the deal. The caller's other hat — not a Tamarindo role.",
    );
  }
  lines.push(`- Role: ${input.role}`);
  lines.push(`- NDA: ${input.nda}`);
  if (input.bio?.trim()) {
    const bio =
      input.bio.trim().length > BIO_LIMIT
        ? `${input.bio.trim().slice(0, BIO_LIMIT).trimEnd()}…`
        : input.bio.trim();
    lines.push(`- Bio: ${bio}`);
  }

  if (input.addressStyle === "first" && input.givenName) {
    lines.push(
      `- How to address: they said yes — use ${input.givenName} once in a natural place. Do not sprinkle it.`,
    );
  } else if (input.addressStyle === "formal") {
    const last = input.familyName ? ` Last name ${input.familyName} if a name is needed.` : "";
    lines.push(
      `- How to address: they declined the first name. Do not use it.${last}`,
    );
  } else {
    lines.push("- How to address: not decided yet.");
  }

  if (input.askGivenName && input.givenName) {
    lines.push("");
    lines.push("RAPPORT — do this in this reply:");
    lines.push(
      `- Say "${input.givenName}" once, naturally, in the opening.`,
    );
    lines.push(
      "- Then ask if you may keep using that first name, or if they would rather you did not. One short question. Wait for a yes or no.",
    );
    lines.push(
      "- Build a little rapport before the binder: how they are, what brought them in. Do not dump the thesis unless they asked a Tamarindo fact.",
    );
  }

  return lines.join("\n");
}

