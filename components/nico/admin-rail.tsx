"use client";

import { ListTree, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { VariablesWorkspace } from "@/components/nico/variables-workspace";
import type { Capability } from "@/lib/contracts/procedure";
import { ApprovalsPanel } from "@/components/nico/approvals-panel";
import { CapabilitiesPanel } from "@/components/nico/capabilities-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type AdminSection = "approvals" | "capabilities" | "variables";

const ADMIN_NAV: { id: AdminSection; label: string; icon: typeof ShieldCheck }[] =
  [
    { id: "approvals", label: "Approvals", icon: ShieldCheck },
    { id: "capabilities", label: "Capabilities", icon: ListTree },
    { id: "variables", label: "Variables", icon: SlidersHorizontal },
  ];

type ApprovalRow = {
  id: string;
  procedure: string;
  reason: string;
  status: string;
};

export function AdminRail({
  section,
  onSection,
  onClose,
  capabilities,
  approvals,
  approvalError,
  onDecide,
  onRefreshApprovals,
}: {
  section: AdminSection;
  onSection: (section: AdminSection) => void;
  onClose: () => void;
  capabilities: Capability[];
  approvals: ApprovalRow[];
  approvalError: string | null;
  onDecide: (approvalId: string, decision: "approved" | "rejected") => void;
  onRefreshApprovals: () => void;
}) {
  return (
    <aside
      id="nico-admin-rail"
      className="flex h-full w-96 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      aria-label="Admin"
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">
          ADMIN
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
          aria-label="Close admin"
        >
          <X className="size-4" />
        </Button>
      </div>

      <nav className="flex flex-col gap-1 px-2 pb-2" aria-label="Admin sections">
        {ADMIN_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSection(item.id)}
            className={cn(
              "transition-interactive flex items-center gap-3 rounded-md px-2.5 py-2 text-sm",
              section === item.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            aria-current={section === item.id ? "page" : undefined}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {section === "approvals" && (
          <ApprovalsPanel
            rows={approvals}
            error={approvalError}
            onDecide={onDecide}
            onRefresh={onRefreshApprovals}
          />
        )}
        {section === "capabilities" && (
          <CapabilitiesPanel capabilities={capabilities} />
        )}
        {section === "variables" && <VariablesWorkspace scope="admin" />}
      </div>
    </aside>
  );
}
