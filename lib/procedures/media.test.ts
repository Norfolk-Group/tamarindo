import { beforeEach, describe, expect, it, vi } from "vitest";

const generateNanoBananaPro = vi.hoisted(() => vi.fn());
const generateVeoClip = vi.hoisted(() => vi.fn());
const persistGeneratedMedia = vi.hoisted(() => vi.fn());

vi.mock("@/lib/gemini/interactions", () => ({
  generateNanoBananaPro,
  generateVeoClip,
}));
vi.mock("@/lib/nico/media-store", () => ({ persistGeneratedMedia }));

import { mediaGenerate } from "@/lib/procedures/media";

const ctx = {
  actor: {
    kind: "agent" as const,
    id: "dev-local",
    displayName: "Nico",
    role: "member" as const,
  },
  traceId: "test-media",
};

describe("media.generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores a Nano Banana Pro image", async () => {
    generateNanoBananaPro.mockResolvedValue({
      mimeType: "image/png",
      bytes: new Uint8Array([1, 2, 3]),
    });
    persistGeneratedMedia.mockResolvedValue({
      href: "data:image/png;base64,xx",
      mimeType: "image/png",
    });
    const out = await mediaGenerate.handler(
      { kind: "image", prompt: "dusk skyline over water" },
      ctx,
    );
    expect(out.status).toBe("ready");
    expect(out.model).toBe("gemini-3-pro-image");
    expect(out.url).toContain("data:image");
  });

  it("reports a Veo clip still rendering", async () => {
    generateVeoClip.mockResolvedValue({
      status: "pending",
      operation: "operations/abc",
    });
    const out = await mediaGenerate.handler(
      { kind: "video", prompt: "cartagena wall at dawn" },
      ctx,
    );
    expect(out.status).toBe("pending");
    expect(out.operation).toBe("operations/abc");
    expect(persistGeneratedMedia).not.toHaveBeenCalled();
  });
});
