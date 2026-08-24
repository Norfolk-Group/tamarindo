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

type SectionNavItem = {
  id: AdminSection;
  label: string;
  icon: typeof ShieldCheck;
};

const VARIABLES_NAV: SectionNavItem = {
  id: "variables",
  label: "Variables",
  icon: SlidersHorizontal,
};

const ADMIN_NAV: SectionNavItem[] = [
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "capabilities", label: "Capabilities", icon: ListTree },
  VARIABLES_NAV,
];

/** Non-admins only ever see the user-scoped Variables surface. */
function settingsSections(isAdmin: boolean): SectionNavItem[] {
  return isAdmin ? ADMIN_NAV : [VARIABLES_NAV];
}

export function defaultSettingsSection(isAdmin: boolean): AdminSection {
  return isAdmin ? "approvals" : "variables";
}

type ApprovalRow = {
  id: string;
  procedure: string;
  reason: string;
  status: string;
};

export function SettingsRail({
  isAdmin,
  section,
  onSection,
  onClose,
  capabilities,
  approvals,
  approvalError,
  onDecide,
  onRefreshApprovals,
}: {
  isAdmin: boolean;
  section: AdminSection;
  onSection: (section: AdminSection) => void;
  onClose: () => void;
  capabilities: Capability[];
  approvals: ApprovalRow[];
  approvalError: string | null;
  onDecide: (approvalId: string, decision: "approved" | "rejected") => void;
  onRefreshApprovals: () => void;
}) {
  const title = isAdmin ? "ADMIN" : "PREFERENCES";
  const sections = settingsSections(isAdmin);
  const active = sections.some((item) => item.id === section)
    ? section
    : defaultSettingsSection(isAdmin);

  return (
    <aside
      id="nico-admin-rail"
      className="flex h-full w-96 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      aria-label={isAdmin ? "Admin" : "Preferences"}
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">
          {title}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
          aria-label={isAdmin ? "Close admin" : "Close preferences"}
        >
          <X className="size-4" />
        </Button>
      </div>

      <nav
        className="flex flex-col gap-1 px-2 pb-2"
        aria-label={isAdmin ? "Admin sections" : "Preferences sections"}
      >
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSection(item.id)}
            className={cn(
              "transition-interactive flex items-center gap-3 rounded-md px-2.5 py-2 text-sm",
              active === item.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            aria-current={active === item.id ? "page" : undefined}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isAdmin && active === "approvals" && (
          <ApprovalsPanel
            rows={approvals}
            error={approvalError}
            onDecide={onDecide}
            onRefresh={onRefreshApprovals}
          />
        )}
        {isAdmin && active === "capabilities" && (
          <CapabilitiesPanel capabilities={capabilities} />
        )}
        {active === "variables" && (
          <VariablesWorkspace scope={isAdmin ? "admin" : "user"} />
        )}
      </div>
    </aside>
  );
}
