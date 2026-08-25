"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  FileSpreadsheet,
  FolderLock,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  Settings,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import type { Capability } from "@/lib/contracts/procedure";
import {
  SettingsRail,
  defaultSettingsSection,
  type AdminSection,
} from "@/components/nico/settings-rail";
import {
  ArtifactsPanel,
  DataRoomPanel,
} from "@/components/nico/workspace-panels";
import { cn } from "@/lib/utils";

export type PrimaryPanel =
  | "conversation"
  | "artifacts"
  | "dataroom"
  | "model"
  | "variables";

const PRIMARY_NAV: {
  id: PrimaryPanel;
  label: string;
  icon: typeof MessageSquare;
}[] = [
  { id: "conversation", label: "Conversation", icon: MessageSquare },
  { id: "model", label: "Statements", icon: Table2 },
  { id: "variables", label: "Assumptions", icon: SlidersHorizontal },
  { id: "artifacts", label: "Artifacts", icon: FileSpreadsheet },
  { id: "dataroom", label: "Data Room", icon: FolderLock },
];

const SIGN_OUT_HREF = "/logout?returnTo=/sign-in";

function initialsFor(userName: string): string {
  const words = userName.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function LeftRail({
  capabilities,
  isAdmin,
  userName,
  userRole,
  ndaExecuted,
  primary,
  onPrimary,
  adminOpen,
  onAdminOpen,
  adminSection,
  onAdminSection,
  onNewConversation,
}: {
  capabilities: Capability[];
  isAdmin: boolean;
  userName: string;
  userRole: string;
  ndaExecuted: boolean;
  primary: PrimaryPanel;
  onPrimary: (panel: PrimaryPanel) => void;
  adminOpen: boolean;
  onAdminOpen: (open: boolean) => void;
  adminSection: AdminSection;
  onAdminSection: (section: AdminSection) => void;
  onNewConversation: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [approvals, setApprovals] = useState<
    { id: string; procedure: string; reason: string; status: string }[]
  >([]);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<
    { id: string; kind: string; title: string; createdAt: string }[]
  >([]);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<
    {
      id: string;
      title: string;
      mimeType: string;
      confidential: boolean;
      published: boolean;
    }[]
  >([]);
  const [dataroomError, setDataroomError] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    if (!isAdmin) return;
    const res = await fetch("/api/nico/approvals");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { approvals?: { id: string; procedure: string; reason: string; status: string }[] };
      error?: { message: string };
    };
    if (!json.ok) {
      setApprovalError(json.error?.message ?? "Could not load approvals");
      return;
    }
    setApprovalError(null);
    setApprovals(json.data?.approvals ?? []);
  }, [isAdmin]);

  async function loadArtifacts() {
    const res = await fetch("/api/nico/artifacts");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { artifacts?: { id: string; kind: string; title: string; createdAt: string }[] };
      error?: { message: string };
    };
    if (!json.ok) {
      setArtifactError(json.error?.message ?? "Could not load artifacts");
      return;
    }
    setArtifactError(null);
    setArtifacts(json.data?.artifacts ?? []);
  }

  async function loadDataroom() {
    const res = await fetch("/api/nico/dataroom");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: {
        documents?: {
          id: string;
          title: string;
          mimeType: string;
          confidential: boolean;
          published: boolean;
        }[];
      };
      error?: { message: string };
    };
    if (!json.ok) {
      setDataroomError(json.error?.message ?? "Could not load data room");
      return;
    }
    setDataroomError(null);
    setDocuments(json.data?.documents ?? []);
  }

  useEffect(() => {
    if (primary !== "artifacts") return;
    void loadArtifacts();
    const timer = window.setInterval(() => void loadArtifacts(), 4000);
    return () => window.clearInterval(timer);
  }, [primary]);

  useEffect(() => {
    if (!isAdmin || !adminOpen || adminSection !== "approvals") return;
    void loadApprovals();
  }, [isAdmin, adminOpen, adminSection, loadApprovals]);

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

  function openPrimary(next: PrimaryPanel) {
    onPrimary(next);
    if (next === "dataroom") void loadDataroom();
  }

  function toggleAdmin() {
    const next = !adminOpen;
    onAdminOpen(next);
    if (next) {
      onAdminSection(defaultSettingsSection(isAdmin));
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setCollapsed(true);
      }
    }
  }

  const settingsLabel = isAdmin ? "Admin" : "Preferences";
  const initials = initialsFor(userName);
  // Non-admins are identified by NDA standing rather than by their raw role.
  const userSubtitle = isAdmin
    ? userRole
    : ndaExecuted
      ? "NDA executed"
      : "NDA pending";

  return (
    <>
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-border bg-card/40 transition-[width] duration-300",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed && (
            <span className="text-sm font-semibold tracking-widest text-muted-foreground">
              TAMARINDO
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="transition-interactive rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <ChevronLeft
              className={cn("size-4 transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-2" aria-label="Workspace">
          <button
            type="button"
            onClick={onNewConversation}
            className="transition-interactive flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="New conversation"
          >
            <MessageSquarePlus className="size-4 shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">New conversation</span>
            )}
          </button>
          {PRIMARY_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openPrimary(item.id)}
              className={cn(
                "transition-interactive flex items-center gap-3 rounded-md px-2.5 py-2 text-sm",
                primary === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-current={primary === item.id ? "page" : undefined}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            </button>
          ))}
        </nav>

        {!collapsed && primary === "artifacts" && (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
            <ArtifactsPanel
              rows={artifacts}
              error={artifactError}
              onRefresh={() => void loadArtifacts()}
            />
          </div>
        )}

        {!collapsed && primary === "dataroom" && (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
            <DataRoomPanel
              rows={documents}
              error={dataroomError}
              onRefresh={() => void loadDataroom()}
            />
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1 border-t border-border px-2 py-2">
          <button
            type="button"
            onClick={toggleAdmin}
            className={cn(
              "transition-interactive flex items-center gap-3 rounded-md px-2.5 py-2 text-sm",
              adminOpen
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-expanded={adminOpen}
            aria-controls="nico-admin-rail"
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">{settingsLabel}</span>
            )}
          </button>
          <a
            href={SIGN_OUT_HREF}
            className="transition-interactive flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Sign out</span>}
          </a>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center border-t border-border px-2 py-3",
            collapsed ? "justify-center" : "gap-2.5",
          )}
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
            title={userName}
            aria-label={userName}
          >
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {userName}
              </p>
              <p
                className={cn(
                  "truncate text-[11px] text-muted-foreground",
                  isAdmin && "capitalize",
                )}
              >
                {userSubtitle}
              </p>
            </div>
          )}
        </div>
      </aside>

      {adminOpen && (
        <SettingsRail
          isAdmin={isAdmin}
          section={adminSection}
          onSection={onAdminSection}
          onClose={() => onAdminOpen(false)}
          capabilities={capabilities}
          approvals={approvals}
          approvalError={approvalError}
          onDecide={(id, decision) => void decide(id, decision)}
          onRefreshApprovals={() => void loadApprovals()}
        />
      )}
    </>
  );
}
