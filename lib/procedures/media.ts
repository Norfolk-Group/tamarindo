import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";
import {
  generateNanoBananaPro,
  generateVeoClip,
} from "@/lib/gemini/interactions";
import { persistGeneratedMedia } from "@/lib/nico/media-store";

const Input = z.object({
  kind: z.enum(["image", "video"]),
  prompt: z.string().min(4).max(2000),
});

const Output = z.object({
  kind: z.enum(["image", "video"]),
  status: z.enum(["ready", "pending"]),
  url: z.string().optional(),
  alt: z.string(),
  title: z.string(),
  operation: z.string().optional(),
  model: z.string(),
});

export const mediaGenerate = defineProcedure({
  name: "media.generate",
  description:
    "Create an image with Gemini 3 Pro Image (Nano Banana Pro) or a short video with Veo 3.1. Same procedure the chat window and any channel call.",
  input: Input,
  output: Output,
  minRole: "member",
  requiresApproval: false,
  handler: async ({ kind, prompt }) => {
    const title =
      prompt.length > 72 ? `${prompt.slice(0, 69).trim()}…` : prompt;
    if (kind === "image") {
      const image = await generateNanoBananaPro(prompt);
      const stored = await persistGeneratedMedia({
        kind: "image",
        mimeType: image.mimeType,
        bytes: image.bytes,
      });
      return {
        kind,
        status: "ready" as const,
        url: stored.href,
        alt: title,
        title,
        model: "gemini-3-pro-image",
      };
    }
    const clip = await generateVeoClip(prompt);
    if (clip.status === "pending") {
      return {
        kind,
        status: "pending" as const,
        alt: title,
        title,
        operation: clip.operation,
        model: "veo-3.1-fast-generate-preview",
      };
    }
    const stored = await persistGeneratedMedia({
      kind: "video",
      mimeType: clip.mimeType,
      bytes: clip.bytes,
    });
    return {
      kind,
      status: "ready" as const,
      url: stored.href,
      alt: title,
      title,
      model: "veo-3.1-fast-generate-preview",
    };
  },
});
