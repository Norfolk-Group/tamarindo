"use client";

import type { ReactNode } from "react";
import { House } from "lucide-react";
import { InfoTip } from "@/components/nico/info-tip";
import { cn } from "@/lib/utils";

export function SecondLevelRail({
  id,
  title,
  label,
  widthClass = "w-60",
  onHome,
  commands,
  children,
}: {
  id?: string;
  title: string;
  label: string;
  widthClass?: string;
  onHome: () => void;
  commands?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <aside
      id={id}
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-card/40",
        widthClass,
      )}
      aria-label={label}
    >
      <div className="flex h-14 shrink-0 items-center px-3">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <nav className="flex flex-col gap-1 px-2 pb-2" aria-label={`${label} menu`}>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onHome}
            className="transition-interactive flex min-w-0 flex-1 items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <House className="size-4 shrink-0" />
            <span className="flex-1 text-left">Home</span>
          </button>
          <InfoTip topic="nav.home" label="About Home" side="right" />
        </div>
        {commands}
      </nav>
      {children ? (
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      ) : null}
    </aside>
  );
}
