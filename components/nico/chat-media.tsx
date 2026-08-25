"use client";

import type { MediaSpec } from "@/lib/nico/chat-rich-parse";

export function ChatMedia({
  kind,
  spec,
}: {
  kind: "image" | "video";
  spec: MediaSpec;
}) {
  return (
    <figure className="nico-rich-enter overflow-hidden rounded-lg border border-border">
      {kind === "video" ? (
        <video
          src={spec.url}
          controls
          playsInline
          className="max-h-96 w-full bg-black object-contain"
        />
      ) : (
        // Generated / signed URLs are not in next/image remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={spec.url}
          alt={spec.alt}
          className="max-h-96 w-full object-contain"
        />
      )}
      {spec.title ? (
        <figcaption className="px-3 py-2 text-xs text-muted-foreground">
          {spec.title}
        </figcaption>
      ) : null}
    </figure>
  );
}
