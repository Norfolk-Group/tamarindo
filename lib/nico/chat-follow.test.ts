import { describe, expect, it } from "vitest";
import { distanceFromBottom, shouldFollowChat } from "@/lib/nico/chat-follow";

describe("chat follow", () => {
  it("stays pinned near the bottom as the answer grows", () => {
    const near = { scrollHeight: 800, scrollTop: 320, clientHeight: 400 };
    expect(distanceFromBottom(near)).toBe(80);
    expect(shouldFollowChat(near)).toBe(true);
  });

  it("lets the reader stay put when they scroll up", () => {
    const up = { scrollHeight: 800, scrollTop: 40, clientHeight: 400 };
    expect(shouldFollowChat(up)).toBe(false);
  });
});
