import { describe, expect, it } from "vitest";
import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";
import { meetingAvatarHtml } from "@/lib/nico/meeting-avatar";

describe("meeting avatar page", () => {
  it("discloses that Nico is an AI (R11 / AE meeting)", () => {
    const html = meetingAvatarHtml();
    expect(html).toContain(NICO_AI_DISCLOSURE);
    expect(html).toContain("Nico");
  });
});
