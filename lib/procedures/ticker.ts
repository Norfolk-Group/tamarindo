import { z } from "zod";
import { loadTickerItems } from "@/lib/research/ticker";
import { defineProcedure } from "@/lib/procedures/registry";

export const tickerList = defineProcedure({
  name: "ticker.list",
  description:
    "Business-relevant headlines for the Nico news ticker. Exa when configured; otherwise cited Intervest / market URLs.",
  input: z.object({}),
  output: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        source: z.string(),
        kind: z.enum(["live", "cited"]),
      }),
    ),
    live: z.boolean(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async () => {
    const { items, live } = await loadTickerItems();
    return { items, live };
  },
});
