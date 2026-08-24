import { afterEach, describe, expect, it, vi } from "vitest";
import { startRecallBot } from "@/lib/channels/recall";
import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";

const previousKey = process.env.RECALL_API_KEY;
const previousRegion = process.env.RECALL_REGION;

afterEach(() => {
  if (previousKey === undefined) delete process.env.RECALL_API_KEY;
  else process.env.RECALL_API_KEY = previousKey;
  if (previousRegion === undefined) delete process.env.RECALL_REGION;
  else process.env.RECALL_REGION = previousRegion;
});

describe("startRecallBot", () => {
  it("skips when Recall is unconfigured", async () => {
    delete process.env.RECALL_API_KEY;
    const fetchImpl = vi.fn();
    await expect(
      startRecallBot("https://meet.google.com/abc-defg-hij", fetchImpl),
    ).resolves.toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts a named Nico bot that discloses AI identity", async () => {
    process.env.RECALL_API_KEY = "recall_test";
    process.env.RECALL_REGION = "us-east-1";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await expect(
      startRecallBot("https://meet.google.com/abc-defg-hij", fetchImpl),
    ).resolves.toBe("started");
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://us-east-1.recall.ai/api/v1/bot/");
    const payload = JSON.parse(String(init.body)) as {
      bot_name: string;
      chat: { on_bot_join: { message: string } };
    };
    expect(payload.bot_name).toBe("Nico");
    expect(payload.chat.on_bot_join.message).toBe(NICO_AI_DISCLOSURE);
  });
});
