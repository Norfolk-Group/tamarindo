import { z } from "zod";
import { prisma } from "@/lib/db";
import { defineProcedure } from "@/lib/procedures/registry";

const TermsPayloadSchema = z.record(z.unknown());

export const dealTermsGet = defineProcedure({
  name: "dealTerms.get",
  description:
    "Return the current published Deal Terms record. Investor-facing numbers come from here, never from the model.",
  input: z.object({}),
  output: z.object({
    version: z.number().nullable(),
    status: z.string().nullable(),
    payload: TermsPayloadSchema.nullable(),
    notes: z.string().nullable(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async () => {
    const current = await prisma.dealTerms.findFirst({
      where: { status: "published" },
      orderBy: { version: "desc" },
    });
    if (!current) {
      return { version: null, status: null, payload: null, notes: null };
    }
    return {
      version: current.version,
      status: current.status,
      payload: TermsPayloadSchema.parse(current.payload),
      notes: current.notes,
    };
  },
});

export const dealTermsPublish = defineProcedure({
  name: "dealTerms.publish",
  description:
    "Publish an existing Deal Terms version. Humans only. Does not invent numbers.",
  input: z.object({
    version: z.number().int().positive(),
  }),
  output: z.object({ version: z.number(), status: z.literal("published") }),
  minRole: "admin",
  humanOnly: true,
  requiresApproval: false,
  handler: async ({ version }) => {
    const row = await prisma.dealTerms.findUnique({ where: { version } });
    if (!row) throw new Error(`Deal Terms version ${version} not found`);
    if (row.status === "superseded") {
      throw new Error(`Deal Terms version ${version} is superseded`);
    }
    await prisma.$transaction([
      prisma.dealTerms.updateMany({
        where: { status: "published", version: { not: version } },
        data: { status: "superseded" },
      }),
      prisma.dealTerms.update({
        where: { version },
        data: { status: "published" },
      }),
    ]);
    return { version, status: "published" as const };
  },
});
