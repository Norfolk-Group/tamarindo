import { describe, expect, it, vi } from "vitest";

const count = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { message: { count } },
}));

import {
  artifactAlreadyInThread,
  artifactThreadMarker,
  sendAttachFields,
} from "@/lib/channels/in-thread";

describe("in-thread attach (Q2)", () => {
  it("is false without conversation or artifact", async () => {
    await expect(artifactAlreadyInThread(undefined, "art_1")).resolves.toBe(false);
    await expect(artifactAlreadyInThread("conv_1", undefined)).resolves.toBe(false);
    expect(count).not.toHaveBeenCalled();
  });

  it("is true when a prior send wrote the marker", async () => {
    count.mockResolvedValue(1);
    await expect(artifactAlreadyInThread("conv_1", "art_1")).resolves.toBe(true);
    expect(count).toHaveBeenCalledWith({
      where: {
        conversationId: "conv_1",
        content: { contains: artifactThreadMarker("art_1") },
      },
    });
  });

  it("reads attach fields from raw send input", () => {
    expect(sendAttachFields({ conversationId: "c", artifactId: "a", body: "x" })).toEqual({
      conversationId: "c",
      artifactId: "a",
    });
  });
});
