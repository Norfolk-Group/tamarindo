"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { helpTip } from "@/lib/nico/help-catalog";
import { cn } from "@/lib/utils";

export function InfoTip({
  topic,
  text,
  label = "More information",
  side = "top",
  className,
}: {
  topic?: string;
  text?: string;
  label?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  const content = (text ?? (topic ? helpTip(topic) : "")).trim();
  if (!content) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground",
            className,
          )}
          aria-label={label}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}

export function WithTip({
  topic,
  text,
  children,
  className,
}: {
  topic?: string;
  text?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {children}
      <InfoTip topic={topic} text={text} />
    </span>
  );
}
