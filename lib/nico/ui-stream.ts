import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import type { StreamEvent } from "@/lib/contracts/events";

/**
 * Map orchestrator events onto an AI SDK UI message stream so
 * `useAgentChat` can resume tokens (KTD6) without a second tool list.
 */
export function turnToUiResponse(
  events: AsyncIterable<StreamEvent>,
): Response {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const id = "nico-reply";
      writer.write({ type: "text-start", id });
      for await (const event of events) {
        if (event.type === "token") {
          writer.write({ type: "text-delta", id, delta: event.text });
        } else if (event.type === "activity") {
          writer.write({ type: "data-activity", data: event });
        } else if (event.type === "source") {
          writer.write({ type: "data-source", data: event });
        } else if (event.type === "error") {
          writer.write({ type: "error", errorText: event.message });
        }
      }
      writer.write({ type: "text-end", id });
    },
    onError: () => "An error occurred.",
  });
  return createUIMessageStreamResponse({ stream });
}
