"use client";

import { useState } from "react";
import type { Capability } from "@/lib/contracts/procedure";
import { AvatarOrb } from "@/components/nico/avatar-orb";
import { LeftRail, type PrimaryPanel } from "@/components/nico/left-rail";
import {
  defaultSettingsSection,
  type AdminSection,
} from "@/components/nico/settings-rail";
import { NewsTicker } from "@/components/nico/news-ticker";
import { ModelWorkspace } from "@/components/nico/model-workspace";
import { VariablesWorkspace } from "@/components/nico/variables-workspace";
import { AgentAttach } from "@/components/nico/agent-copilot";
import { IntakeCard } from "@/components/nico/intake-card";
import { NdaCard } from "@/components/nico/nda-card";
import { nicoAgentHost } from "@/lib/nico/attach";
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
  const [primary, setPrimary] = useState<PrimaryPanel>("conversation");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>(() =>
    defaultSettingsSection(isAdmin),
  );
  const agentHost = nicoAgentHost(agentUrl);
  const showChat = primary === "conversation" && !(adminOpen && adminSection === "variables");

  function startNewConversation() {
    setConversationId(mintConversationId(userId));
    setPresence(emptyAppliedTurn());
    setPrimary("conversation");
    setAdminOpen(false);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <LeftRail
        capabilities={capabilities}
        isAdmin={isAdmin}
        userName={userName}
        userRole={userRole}
        ndaExecuted={!showNda}
        primary={primary}
        onPrimary={setPrimary}
        adminOpen={adminOpen}
        onAdminOpen={setAdminOpen}
        adminSection={adminSection}
        onAdminSection={setAdminSection}
        onNewConversation={startNewConversation}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
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
        </header>
        <NewsTicker />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {primary === "model" && <ModelWorkspace />}
          {primary === "variables" && <VariablesWorkspace scope="user" />}
          {showChat && (
            <>
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
            </>
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
  if (typeof window !== "undefined") {
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
