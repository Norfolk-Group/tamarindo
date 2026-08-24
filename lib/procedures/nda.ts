import { z } from "zod";
import { prisma } from "@/lib/db";
import { CURRENT_NDA_TEMPLATE_VERSION } from "@/lib/domain/access";
import { ndaPdfHash, renderNdaPdf } from "@/lib/nda/pdf";
import { currentNdaPrepare, ndaTemplateHash } from "@/lib/nda/template";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

export const ndaPrepare = defineProcedure({
  name: "nda.prepare",
  description: "Return the current NDA template and its document hash.",
  input: z.object({}),
  output: z.object({
    templateVersion: z.string(),
    documentHash: z.string(),
    body: z.string(),
  }),
  minRole: "guest",
  requiresApproval: false,
  handler: async () => currentNdaPrepare(),
});

export const ndaSign = defineProcedure({
  name: "nda.sign",
  description:
    "Click-wrap the current NDA. Humans only. Writes signature, consent, and ndaSignedAt together.",
  input: z.object({
    typedName: z.string().min(2).max(200),
    accepted: z.literal(true),
    documentHash: z.string().min(16),
    ipAddress: z.string().min(1).max(80).default("unknown"),
    userAgent: z.string().min(1).max(400).default("unknown"),
  }),
  output: z.object({
    templateVersion: z.string(),
    documentHash: z.string(),
    signedPdfRef: z.string(),
  }),
  minRole: "guest",
  humanOnly: true,
  requiresApproval: false,
  handler: async (input, ctx) => {
    const expected = ndaTemplateHash();
    if (input.documentHash !== expected) {
      throw new Error("NDA document hash does not match the current template");
    }
    const profileId = await profileIdFor(ctx.actor.id);
    const pdf = renderNdaPdf({
      typedName: input.typedName,
      documentHash: expected,
    });
    const signedPdfRef = `sha256:${ndaPdfHash(pdf)}`;
    await prisma.$transaction([
      prisma.ndaSignature.create({
        data: {
          profileId,
          templateVersion: CURRENT_NDA_TEMPLATE_VERSION,
          documentHash: expected,
          typedName: input.typedName,
          signatureRef: "click-wrap",
          signedPdfRef,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      }),
      prisma.consentRecord.create({
        data: {
          profileId,
          document: "nda",
          accepted: true,
          version: CURRENT_NDA_TEMPLATE_VERSION,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      }),
      prisma.profile.update({
        where: { id: profileId },
        data: { ndaSignedAt: new Date() },
      }),
    ]);
    return {
      templateVersion: CURRENT_NDA_TEMPLATE_VERSION,
      documentHash: expected,
      signedPdfRef,
    };
  },
});
