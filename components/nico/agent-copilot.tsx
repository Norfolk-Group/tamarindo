"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import {
  fetchAgentMessages,
  issueHandshake,
  type HandshakeBundle,
} from "@/lib/nico/attach";
import { sessionKey } from "@/lib/nico/session-key";
import { ChatRichText } from "@/components/nico/chat-rich-text";
import { applyUiDataPart, type AppliedTurn } from "@/lib/nico/stream-apply";

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
      onPresence?.((prev) => applyUiDataPart(prev, part));
    },
  });
  const [input, setInput] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "self-end rounded-2xl rounded-br-sm bg-primary/15 px-4 py-2.5 text-sm"
                  : "text-sm leading-relaxed"
              }
            >
              {message.role === "user" ? (
                message.parts
                  .map((part) => (part.type === "text" ? part.text : ""))
                  .join("")
              ) : (
                <ChatRichText
                  text={message.parts
                    .map((part) => (part.type === "text" ? part.text : ""))
                    .join("")}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <form
        className="border-t border-border px-5 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          const text = input.trim();
          if (!text) return;
          setInput("");
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
