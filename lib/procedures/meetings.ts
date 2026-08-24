import { z } from "zod";
import { startRecallBot } from "@/lib/channels/recall";
import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";
import { defineProcedure } from "@/lib/procedures/registry";

export const meetingsJoin = defineProcedure({
  name: "meetings.join",
  description:
    "Start a Recall.ai output-media bot that joins as Nico and discloses he is an AI.",
  input: z.object({
    approvalId: z.string(),
    meetingUrl: z.string().url(),
  }),
  output: z.object({
    queued: z.literal(true),
    disclosure: z.string(),
  }),
  minRole: "member",
  requiresApproval: true,
  handler: async (input) => {
    await startRecallBot(input.meetingUrl);
    return { queued: true as const, disclosure: NICO_AI_DISCLOSURE };
  },
});
