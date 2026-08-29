"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  CircleHelp,
  FileSpreadsheet,
  FolderLock,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  Settings,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { InfoTip } from "@/components/nico/info-tip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { helpTip } from "@/lib/nico/help-catalog";
import { canShowPanel, type PrimaryPanel } from "@/lib/nico/rail-columns";
import { cn } from "@/lib/utils";

export type { PrimaryPanel };

const PRIMARY_NAV: {
  id: PrimaryPanel;
  label: string;
  icon: typeof MessageSquare;
  topic: string;
}[] = [
  { id: "conversation", label: "Conversation", icon: MessageSquare, topic: "nav.conversation" },
  { id: "model", label: "Statements", icon: Table2, topic: "nav.statements" },
  { id: "variables", label: "Assumptions", icon: SlidersHorizontal, topic: "nav.assumptions" },
  { id: "artifacts", label: "Files", icon: FileSpreadsheet, topic: "nav.artifacts" },
  { id: "dataroom", label: "Data Room", icon: FolderLock, topic: "nav.dataroom" },
  { id: "help", label: "Help", icon: CircleHelp, topic: "nav.help" },
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
  isAdmin,
  userName,
  userRole,
  ndaExecuted,
  primary,
  onPrimary,
  adminOpen,
  onAdminOpen,
  onNewConversation,
}: {
  isAdmin: boolean;
  userName: string;
  userRole: string;
  ndaExecuted: boolean;
  primary: PrimaryPanel;
  onPrimary: (panel: PrimaryPanel) => void;
  adminOpen: boolean;
  onAdminOpen: () => void;
  onNewConversation: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const settingsLabel = isAdmin ? "Admin" : "Preferences";
  const initials = initialsFor(userName);
  const userSubtitle = isAdmin
    ? userRole
    : ndaExecuted
      ? "NDA executed"
      : "NDA pending";

  return (
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
        <RailRow
          collapsed={collapsed}
          topic="conversation.nico"
          label="New conversation"
        >
          <button
            type="button"
            onClick={onNewConversation}
            className="transition-interactive flex min-w-0 flex-1 items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="New conversation"
          >
            <MessageSquarePlus className="size-4 shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">New conversation</span>
            )}
          </button>
        </RailRow>
        {PRIMARY_NAV.filter((item) =>
          canShowPanel(item.id, { isAdmin, ndaExecuted }),
        ).map((item) => {
          const current = !adminOpen && primary === item.id;
          return (
            <RailRow
              key={item.id}
              collapsed={collapsed}
              topic={item.topic}
              label={item.label}
            >
              <button
                type="button"
                onClick={() => onPrimary(item.id)}
                className={cn(
                  "transition-interactive flex min-w-0 flex-1 items-center gap-3 rounded-md px-2.5 py-2 text-sm",
                  current
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                aria-current={current ? "page" : undefined}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              </button>
            </RailRow>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border px-2 py-2">
        <RailRow
          collapsed={collapsed}
          topic={isAdmin ? "nav.admin" : "nav.preferences"}
          label={settingsLabel}
        >
          <button
            type="button"
            onClick={onAdminOpen}
            className={cn(
              "transition-interactive flex min-w-0 flex-1 items-center gap-3 rounded-md px-2.5 py-2 text-sm",
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
        </RailRow>
        <RailRow collapsed={collapsed} topic="nav.signout" label="Sign out">
          <a
            href={SIGN_OUT_HREF}
            className="transition-interactive flex min-w-0 flex-1 items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Sign out</span>}
          </a>
        </RailRow>
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
  );
}

function RailRow({
  collapsed,
  topic,
  label,
  children,
}: {
  collapsed: boolean;
  topic: string;
  label: string;
  children: ReactNode;
}) {
  const tip = helpTip(topic);
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right">{tip || label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      {children}
      <InfoTip topic={topic} label={`About ${label}`} side="right" />
    </div>
  );
}
