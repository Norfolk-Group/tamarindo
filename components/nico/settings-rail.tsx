"use client";

import { useCallback, useEffect, useState } from "react";
import { ListTree, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { VariablesWorkspace } from "@/components/nico/variables-workspace";
import type { Capability } from "@/lib/contracts/procedure";
import { ApprovalsPanel } from "@/components/nico/approvals-panel";
import { CapabilitiesPanel } from "@/components/nico/capabilities-panel";
import { SecondLevelRail } from "@/components/nico/second-level-rail";
import { cn } from "@/lib/utils";
import type { AdminSectionId } from "@/lib/nico/rail-columns";

export type AdminSection = AdminSectionId;

type SectionNavItem = {
  id: AdminSection;
  label: string;
  icon: typeof ShieldCheck;
};

const VARIABLES_NAV: SectionNavItem = {
  id: "variables",
  label: "Assumptions",
  icon: SlidersHorizontal,
};

const ADMIN_NAV: SectionNavItem[] = [
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "capabilities", label: "Capabilities", icon: ListTree },
  VARIABLES_NAV,
];

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
  onHome,
  capabilities,
}: {
  isAdmin: boolean;
  section: AdminSection;
  onSection: (section: AdminSection) => void;
  onHome: () => void;
  capabilities: Capability[];
}) {
  const title = isAdmin ? "ADMIN" : "PREFERENCES";
  const sections = settingsSections(isAdmin);
  const active = sections.some((item) => item.id === section)
    ? section
    : defaultSettingsSection(isAdmin);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    if (!isAdmin) return;
    const res = await fetch("/api/nico/approvals");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { approvals?: ApprovalRow[] };
      error?: { message: string };
    };
    if (!json.ok) {
      setApprovalError(json.error?.message ?? "Could not load approvals");
      return;
    }
    setApprovalError(null);
    setApprovals(json.data?.approvals ?? []);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || active !== "approvals") return;
    void loadApprovals();
  }, [isAdmin, active, loadApprovals]);

  async function decide(approvalId: string, decision: "approved" | "rejected") {
    if (!isAdmin) return;
    const res = await fetch("/api/nico/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId, decision }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
    if (!json.ok) {
      setApprovalError(json.error?.message ?? "Decide failed");
      return;
    }
    await loadApprovals();
  }

  return (
    <SecondLevelRail
      id="nico-admin-rail"
      title={title}
      label={isAdmin ? "Admin" : "Preferences"}
      onHome={onHome}
      commands={sections.map((item) => (
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
    >
      {isAdmin && active === "approvals" && (
        <ApprovalsPanel
          rows={approvals}
          error={approvalError}
          onDecide={(id, decision) => void decide(id, decision)}
          onRefresh={() => void loadApprovals()}
        />
      )}
      {isAdmin && active === "capabilities" && (
        <CapabilitiesPanel capabilities={capabilities} />
      )}
      {active === "variables" && (
        <VariablesWorkspace scope={isAdmin ? "admin" : "user"} />
      )}
    </SecondLevelRail>
  );
}
