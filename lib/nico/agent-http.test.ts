import { describe, expect, it, vi } from "vitest";
import {
  fetchAgentInstance,
  isPublicNicoPath,
  isResumePath,
  isTurnPath,
} from "@/lib/nico/agent-http";

describe("sibling Worker HTTP helpers", () => {
  it("allows only the meeting avatar without a handshake", () => {
    expect(isPublicNicoPath("/meeting-avatar")).toBe(true);
    expect(isPublicNicoPath("/turn")).toBe(false);
    expect(isTurnPath("/turn")).toBe(true);
    expect(isResumePath("/resume")).toBe(true);
  });

  it("routes by idFromName and does not invent a stub", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("ok"));
    const idFromName = vi.fn().mockReturnValue("do-id");
    const res = await fetchAgentInstance(
      { NicoAgent: { idFromName, get: () => ({ fetch }) } },
      "prof:conv",
      new Request("https://nico.example/turn"),
    );
    expect(idFromName).toHaveBeenCalledWith("prof:conv");
    expect(await res.text()).toBe("ok");
  });
});
