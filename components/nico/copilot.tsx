"use client";

import { useState } from "react";
import type { Capability } from "@/lib/contracts/procedure";
import { AvatarOrb } from "@/components/nico/avatar-orb";
import { ChatPresenceBar } from "@/components/nico/chat-presence";
import { LeftRail } from "@/components/nico/left-rail";
import { PrimaryColumn } from "@/components/nico/primary-columns";
import {
  defaultSettingsSection,
  SettingsRail,
} from "@/components/nico/settings-rail";
import { NewsTicker } from "@/components/nico/news-ticker";
import { AgentAttach } from "@/components/nico/agent-copilot";
import { IntakeCard } from "@/components/nico/intake-card";
import { NdaCard } from "@/components/nico/nda-card";
import { nicoAgentHost } from "@/lib/nico/attach";
import {
  activePrimary,
  goHome as homeFlyout,
  isAdminOpen,
  selectAdminSection,
  selectPrimary,
  toggleAdmin,
  type AdminSectionId,
  type PrimaryPanel,
  type RailFlyout,
} from "@/lib/nico/rail-columns";
import { emptyAppliedTurn } from "@/lib/nico/stream-apply";

export function Copilot({
  capabilities,
  isAdmin,
  userName,
  userRole,
  userId,
  needsIntake,
  needsNda,
  agentUrl,
}: {
  capabilities: Capability[];
  isAdmin: boolean;
  userName: string;
  userRole: string;
  userEmail: string | null;
  userId: string;
  needsIntake: boolean;
  needsNda: boolean;
  agentUrl?: string | null;
}) {
  const [showIntake, setShowIntake] = useState(needsIntake);
  const [showNda, setShowNda] = useState(needsNda);
  const [conversationId, setConversationId] = useState(() =>
    loadConversationId(userId),
  );
  const [presence, setPresence] = useState(emptyAppliedTurn);
  const [flyout, setFlyout] = useState<RailFlyout>({ type: "none" });
  const agentHost = nicoAgentHost(agentUrl);
  const primary = activePrimary(flyout);
  const adminOpen = isAdminOpen(flyout);

  function goHome() {
    setFlyout(homeFlyout());
  }

  function startNewConversation() {
    setConversationId(mintConversationId(userId));
    setPresence(emptyAppliedTurn());
    goHome();
  }

  function handlePrimary(next: PrimaryPanel) {
    setFlyout(selectPrimary(next));
  }

  function handleAdminOpen() {
    setFlyout(toggleAdmin(flyout, defaultSettingsSection(isAdmin)));
  }

  function handleAdminSection(section: AdminSectionId) {
    setFlyout(selectAdminSection(section));
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <LeftRail
        isAdmin={isAdmin}
        userName={userName}
        userRole={userRole}
        ndaExecuted={!showNda}
        primary={primary}
        onPrimary={handlePrimary}
        adminOpen={adminOpen}
        onAdminOpen={handleAdminOpen}
        onNewConversation={startNewConversation}
      />
      {flyout.type === "primary" && (
        <PrimaryColumn id={flyout.id} onHome={goHome} />
      )}
      {flyout.type === "admin" && (
        <SettingsRail
          isAdmin={isAdmin}
          section={flyout.section}
          onSection={handleAdminSection}
          onHome={goHome}
          capabilities={capabilities}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
          <AvatarOrb state={presence.avatarState} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Nico</p>
            <p
              className="truncate text-xs text-muted-foreground"
              aria-live="polite"
            >
              {presence.activityLabel}
            </p>
          </div>
          <ChatPresenceBar presence={presence} />
        </header>
        <NewsTicker />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8">
            {showIntake && (
              <IntakeCard
                initialName={userName}
                onDone={() => setShowIntake(false)}
              />
            )}
            {showNda && !showIntake && (
              <NdaCard onSigned={() => setShowNda(false)} />
            )}
          </div>
          {agentHost ? (
            <AgentAttach
              key={conversationId}
              conversationId={conversationId}
              host={agentHost}
              onPresence={setPresence}
              fallback={
                <p className="px-5 text-sm text-muted-foreground">
                  Could not attach to the Nico Worker.
                </p>
              }
            />
          ) : (
            <p className="px-5 text-sm text-muted-foreground">
              Set NEXT_PUBLIC_NICO_AGENT_URL so the copilot attaches to the
              Durable Object session. The SSE runTurn proxy has been removed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function conversationStorageKey(userId: string): string {
  return `nico.conversationId.${userId}`;
}

function mintConversationId(userId: string): string {
  const id = crypto.randomUUID();
  if (typeof window === "undefined") {
    window.localStorage.setItem(conversationStorageKey(userId), id);
  }
  return id;
}

function loadConversationId(userId: string): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const existing = window.localStorage.getItem(conversationStorageKey(userId));
  if (existing) return existing;
  return mintConversationId(userId);
}
