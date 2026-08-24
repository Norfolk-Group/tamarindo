"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  FileSpreadsheet,
  FolderLock,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import type { Capability } from "@/lib/contracts/procedure";
import { AdminRail, type AdminSection } from "@/components/nico/admin-rail";
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
  { id: "model", label: "Model", icon: Table2 },
  { id: "variables", label: "Variables", icon: SlidersHorizontal },
  { id: "artifacts", label: "Artifacts", icon: FileSpreadsheet },
  { id: "dataroom", label: "Data Room", icon: FolderLock },
];

export function LeftRail({
  capabilities,
  isAdmin,
  primary,
  onPrimary,
  adminOpen,
  onAdminOpen,
  adminSection,
  onAdminSection,
}: {
  capabilities: Capability[];
  isAdmin: boolean;
  primary: PrimaryPanel;
  onPrimary: (panel: PrimaryPanel) => void;
  adminOpen: boolean;
  onAdminOpen: (open: boolean) => void;
  adminSection: AdminSection;
  onAdminSection: (section: AdminSection) => void;
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

  async function loadApprovals() {
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
  }

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
    if (!adminOpen || adminSection !== "approvals") return;
    void loadApprovals();
  }, [adminOpen, adminSection]);

  async function decide(approvalId: string, decision: "approved" | "rejected") {
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
      onAdminSection("approvals");
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setCollapsed(true);
      }
    }
  }

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
          {isAdmin && (
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
              {!collapsed && <span className="flex-1 text-left">Admin</span>}
            </button>
          )}
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
      </aside>

      {isAdmin && adminOpen && (
        <AdminRail
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
