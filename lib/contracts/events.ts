import { z } from "zod";

/**
 * Streaming contract between Nico's orchestrator and every client surface.
 *
 * The avatar is truthful: it may only display a state that arrived as an
 * activity event from the orchestrator — never a decorative guess.
 */

export const AvatarStateSchema = z.enum([
  "idle",
  "listening",
  "thinking",
  "researching",
  "drafting",
  "generating",
  "speaking",
  "awaiting_approval",
]);
export type AvatarState = z.infer<typeof AvatarStateSchema>;

/** What Nico is doing right now, for the activity ticker. */
export const ActivityEventSchema = z.object({
  type: z.literal("activity"),
  state: AvatarStateSchema,
  /** Human sentence, e.g. "Searching the Tamarindo thesis…" */
  label: z.string(),
  /** 0–1 when the orchestrator knows a real fraction (never decoration). */
  progress: z.number().min(0).max(1).optional(),
});

export const MediaEventSchema = z.object({
  type: z.literal("media"),
  kind: z.enum(["image", "video"]),
  url: z.string(),
  alt: z.string(),
  title: z.string().optional(),
});

export const TokenEventSchema = z.object({
  type: z.literal("token"),
  text: z.string(),
});

export const SourceEventSchema = z.object({
  type: z.literal("source"),
  title: z.string(),
  path: z.string(),
  excerpt: z.string(),
});

export const DoneEventSchema = z.object({
  type: z.literal("done"),
});

export const ErrorEventSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
});

export const StreamEventSchema = z.discriminatedUnion("type", [
  ActivityEventSchema,
  TokenEventSchema,
  SourceEventSchema,
  MediaEventSchema,
  DoneEventSchema,
  ErrorEventSchema,
]);
export type StreamEvent = z.infer<typeof StreamEventSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(8000),
  conversationId: z.string().min(1).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
