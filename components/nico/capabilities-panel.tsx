"use client";

import type { Capability } from "@/lib/contracts/procedure";
import { Badge } from "@/components/ui/badge";

export function CapabilitiesPanel({ capabilities }: { capabilities: Capability[] }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col px-3 pb-4">
      <p className="text-[11px] leading-snug text-muted-foreground">
        Procedures the UI and Nico share. Same map agents introspect.
      </p>
      <ul className="mt-3 space-y-2">
        {capabilities.map((cap) => (
          <li
            key={cap.name}
            className="rounded-md border border-sidebar-border bg-background/40 p-2.5"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-mono text-[11px] text-foreground">{cap.name}</p>
              {cap.requiresApproval && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                  Approval
                </Badge>
              )}
              {cap.humanOnly && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                  Human only
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {cap.description}
            </p>
          </li>
        ))}
        {capabilities.length === 0 && (
          <li className="text-[11px] text-muted-foreground">
            No capabilities in this session.
          </li>
        )}
      </ul>
    </section>
  );
}
