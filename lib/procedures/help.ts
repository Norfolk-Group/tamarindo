import { z } from "zod";
import {
  HELP_FAMILIES,
  HELP_TOPICS,
  helpTopic,
  searchHelp,
} from "@/lib/nico/help-catalog";
import { defineProcedure } from "@/lib/procedures/registry";

const HelpTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  family: z.string(),
  tip: z.string(),
  body: z.string(),
});

export const helpList = defineProcedure({
  name: "help.list",
  description:
    "List in-app help topics — the same catalog as the (i) tooltips and the Help workspace.",
  input: z.object({
    query: z.string().optional(),
    family: z.string().optional(),
  }),
  output: z.object({
    families: z.array(z.object({ id: z.string(), title: z.string() })),
    topics: z.array(HelpTopicSchema),
  }),
  minRole: "guest",
  requiresApproval: false,
  handler: async (input) => {
    let topics = input.query ? searchHelp(input.query) : HELP_TOPICS;
    if (input.family) {
      topics = topics.filter((row) => row.family === input.family);
    }
    return { families: HELP_FAMILIES, topics };
  },
});

export const helpGet = defineProcedure({
  name: "help.get",
  description:
    "Return one help topic by id (for example nav.statements, glossary.icp, icp.catalog).",
  input: z.object({ id: z.string().min(1) }),
  output: z.object({ topic: HelpTopicSchema }),
  minRole: "guest",
  requiresApproval: false,
  handler: async (input) => {
    const topic = helpTopic(input.id);
    if (!topic) throw new Error(`Unknown help topic ${input.id}`);
    return { topic };
  },
});
