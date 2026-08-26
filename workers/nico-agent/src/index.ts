import { AIChatAgent } from "@cloudflare/ai-chat";
import { routeAgentRequest } from "agents";
import { agentActorForSubject } from "../../../lib/nico/agent-actor";
import { type HandshakeClaims, verifyHandshake } from "../../../lib/nico/handshake";
import { runTurn } from "../../../lib/nico/orchestrator";
import { bindTurnEnv, handleSiblingWorkerFetch } from "../../../lib/nico/sibling-http";
import { isTurnPath } from "../../../lib/nico/agent-http";
import { turnToUiResponse } from "../../../lib/nico/ui-stream";
import { lastUserText } from "../../../lib/nico/last-user-text";

type AgentEnv = {
  NICO_HANDSHAKE_SECRET?: string;
  WORKOS_COOKIE_PASSWORD?: string;
  ALLOWED_ORIGINS?: string;
  NicoAgent?: unknown;
  [key: string]: unknown;
};

type NicoState = {
  claims: HandshakeClaims | null;
  lastApprovalId: string | null;
};

/**
 * Sibling-worker session. Tools go through `registry.invoke` as
 * `kind: "agent"`. DO SQLite is resume cache only.
 *
 * Turns run here only. The Next SSE `/api/nico/chat` proxy is gone (KTD6).
 */
export class NicoAgent extends AIChatAgent<AgentEnv, NicoState> {
  initialState: NicoState = { claims: null, lastApprovalId: null };

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/resume-internal") && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as {
        approvalId?: string;
      } | null;
      this.setState({
        claims: this.state.claims,
        lastApprovalId: body?.approvalId ?? this.state.lastApprovalId,
      });
      return new Response("ok");
    }

    const token =
      request.headers.get("x-nico-handshake") ??
      url.searchParams.get("handshake");
    if (token) {
      try {
        const claims = await verifyHandshake(token, {
          secret:
            this.env.NICO_HANDSHAKE_SECRET || this.env.WORKOS_COOKIE_PASSWORD,
        });
        this.setState({ claims, lastApprovalId: this.state.lastApprovalId });
      } catch {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    if (isTurnPath(url.pathname) && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as {
        message?: string;
      } | null;
      return this.streamTurn(body?.message ?? "");
    }

    return super.fetch(request);
  }

  async onChatMessage(): Promise<Response> {
    bindTurnEnv(this.env);
    const claims = this.state.claims;
    if (!claims) {
      return new Response("Missing handshake claims", { status: 401 });
    }
    const text = lastUserText(this.messages);
    if (!text.trim()) return new Response("Empty message", { status: 400 });
    const actor = await agentActorForSubject(claims.authSubject);
    return turnToUiResponse(
      runTurn(text, actor, { conversationId: claims.conversationId }),
    );
  }

  private async streamTurn(text: string): Promise<Response> {
    bindTurnEnv(this.env);
    const claims = this.state.claims;
    if (!claims) {
      return new Response("Missing handshake claims", { status: 401 });
    }
    if (!text.trim()) return new Response("Empty message", { status: 400 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const send = (event: unknown) =>
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        try {
          const actor = await agentActorForSubject(claims.authSubject);
          for await (const event of runTurn(text, actor, {
            conversationId: claims.conversationId,
          })) {
            send(event);
          }
        } catch (err) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : "Turn failed",
          });
          send({ type: "activity", state: "idle", label: "Here to help" });
          send({ type: "done" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }
}

const worker = {
  async fetch(request: Request, env: AgentEnv): Promise<Response> {
    return handleSiblingWorkerFetch(request, env, async (req, workerEnv) => {
      return routeAgentRequest(req, workerEnv);
    });
  },
};

export default worker;
