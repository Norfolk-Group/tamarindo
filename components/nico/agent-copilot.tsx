"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import {
  fetchAgentMessages,
  issueHandshake,
  type HandshakeBundle,
} from "@/lib/nico/attach";
import { useChatFollow } from "@/lib/nico/chat-follow";
import { sessionKey } from "@/lib/nico/session-key";
import { ChatRichText } from "@/components/nico/chat-rich-text";
import { ChatThinkingRow } from "@/components/nico/chat-presence";
import { ChatReportSkeleton } from "@/components/nico/chat-report-skeleton";
import {
  applyUiDataPart,
  emptyAppliedTurn,
  type AppliedTurn,
} from "@/lib/nico/stream-apply";

/**
 * Live `useAgentChat` attach (KTD6). Presence comes only from
 * orchestrator activity events on the UI stream (U10).
 */
export function AgentSession({
  bundle,
  host,
  onPresence,
}: {
  bundle: HandshakeBundle;
  host: string;
  onPresence?: (update: (prev: AppliedTurn) => AppliedTurn) => void;
}) {
  const url = new URL(host);
  const [input, setInput] = useState("");
  const [pinNonce, setPinNonce] = useState(0);
  const [live, setLive] = useState(emptyAppliedTurn);
  const agent = useAgent({
    agent: "NicoAgent",
    name: sessionKey(bundle.profileId, bundle.conversationId),
    // Origin, not host-only — get-messages fetch needs a scheme (AE2).
    host: url.origin,
    query: { handshake: bundle.token },
  });
  const { messages, sendMessage } = useAgentChat({
    agent,
    resume: true,
    headers: { "x-nico-handshake": bundle.token },
    getInitialMessages: ({ url }) => fetchAgentMessages(url, bundle.token),
    onData: (part) => {
      setLive((prev) => applyUiDataPart(prev, part));
      onPresence?.((prev) => applyUiDataPart(prev, part));
    },
  });
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastText =
    lastAssistant?.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("") ?? "";
  const streaming =
    live.avatarState === "speaking" || live.avatarState === "drafting";
  const { scrollerRef, onScroll } = useChatFollow(
    `${messages.length}:${lastText.length}:${live.avatarState}:${live.activityLabel}`,
    pinNonce,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => {
            const isLastAssistant = message.id === lastAssistant?.id;
            const liveStream = streaming && isLastAssistant;
            return (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "nico-msg-enter nico-msg-user self-end rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
                    : liveStream
                      ? "nico-msg-enter nico-msg-stream text-sm leading-relaxed"
                      : "nico-msg-enter text-sm leading-relaxed"
                }
              >
                {message.role === "user" ? (
                  message.parts
                    .map((part) => (part.type === "text" ? part.text : ""))
                    .join("")
                ) : (
                  <ChatRichText
                    streaming={liveStream}
                    text={message.parts
                      .map((part) => (part.type === "text" ? part.text : ""))
                      .join("")}
                  />
                )}
              </div>
            );
          })}
          <ChatReportSkeleton presence={live} />
          <ChatThinkingRow presence={live} hasStreamText={lastText.length > 0} />
        </div>
      </div>
      <form
        className="border-t border-border px-5 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          const text = input.trim();
          if (!text) return;
          setInput("");
          setPinNonce((n) => n + 1);
          const heard: AppliedTurn = {
            ...emptyAppliedTurn(),
            avatarState: "listening",
            activityLabel: "Heard you…",
          };
          setLive(heard);
          onPresence?.(() => heard);
          void sendMessage({
            role: "user",
            parts: [{ type: "text", text }],
          });
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask Nico about Tamarindo…"
          className="mx-auto block w-full max-w-3xl rounded-2xl border border-input bg-card/60 px-3 py-2 text-sm"
        />
      </form>
    </div>
  );
}

export function AgentAttach({
  conversationId,
  host,
  fallback,
  onPresence,
}: {
  conversationId: string;
  host: string;
  fallback: ReactNode;
  onPresence?: (update: (prev: AppliedTurn) => AppliedTurn) => void;
}) {
  const [bundle, setBundle] = useState<HandshakeBundle | null>(null);
  const [failed, setFailed] = useState(!host);

  useEffect(() => {
    if (!host) return;
    setBundle(null);
    setFailed(false);
    void issueHandshake(conversationId).then((next) => {
      if (!next) setFailed(true);
      else setBundle(next);
    });
  }, [conversationId, host]);

  if (failed || !host) return fallback;
  if (!bundle) {
    return (
      <p className="px-5 py-6 text-sm text-muted-foreground">
        Attaching to Nico’s session…
      </p>
    );
  }
  return (
    <AgentSession bundle={bundle} host={host} onPresence={onPresence} />
  );
}
