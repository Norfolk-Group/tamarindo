import { describe, expect, it } from "vitest";
import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";
import { signHandshake } from "@/lib/nico/handshake";
import { handleSiblingWorkerFetch } from "@/lib/nico/sibling-http";

const SECRET = "handshake-secret-at-least-16";

function envWithStub(streamBody = "data: {\"type\":\"done\"}\n\n") {
  return {
    NICO_HANDSHAKE_SECRET: SECRET,
    NicoAgent: {
      idFromName: (name: string) => name,
      get: () => ({
        fetch: async (request: Request) =>
          new Response(streamBody, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream",
              "x-session-key": new URL(request.url).pathname,
            },
          }),
      }),
    },
  };
}

describe("nico-agent HTTP surface (U6)", () => {
  it("serves the meeting avatar with an AI disclosure (R11)", async () => {
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/meeting-avatar"),
      envWithStub(),
    );
    const html = await res.text();
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain(NICO_AI_DISCLOSURE);
  });

  it("answers CORS preflight for an allowed Next origin", async () => {
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/agents/nico-agent/prof:conv", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Headers": "content-type",
        },
      }),
      { ...envWithStub(), ALLOWED_ORIGINS: "http://localhost:3000" },
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("does not read Hyperdrive on CORS preflight so attach cannot hang", async () => {
    const env = {
      ...envWithStub(),
      ALLOWED_ORIGINS: "http://localhost:3000",
      get HYPERDRIVE() {
        throw new Error("HYPERDRIVE must not be touched on OPTIONS");
      },
    };
    const res = await handleSiblingWorkerFetch(
      new Request(
        "https://nico-agent.internal/agents/nico-agent/p:c/get-messages",
        {
          method: "OPTIONS",
          headers: {
            Origin: "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "x-nico-handshake",
            "Access-Control-Request-Private-Network": "true",
          },
        },
      ),
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain(
      "x-nico-handshake",
    );
    expect(res.headers.get("Access-Control-Allow-Private-Network")).toBe(
      "true",
    );
  });

  it("does not read Hyperdrive on get-messages (localhost chrome → 127.0.0.1 worker)", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "prof_1",
        conversationId: "conv_gm",
      },
      { secret: SECRET },
    );
    const env = {
      NICO_HANDSHAKE_SECRET: SECRET,
      ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
      get HYPERDRIVE() {
        throw new Error("HYPERDRIVE must not be touched on get-messages");
      },
    };
    const res = await handleSiblingWorkerFetch(
      new Request(
        "https://nico-agent.internal/agents/nico-agent/prof_1:conv_gm/get-messages?handshake=" +
          encodeURIComponent(token),
        { headers: { Origin: "http://localhost:3000" } },
      ),
      env,
      async () =>
        new Response("[]", {
          headers: { "content-type": "application/json" },
        }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("adds CORS to get-messages so the Next chrome can hydrate", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "prof_1",
        conversationId: "conv_gm",
      },
      { secret: SECRET },
    );
    const res = await handleSiblingWorkerFetch(
      new Request(
        "https://nico-agent.internal/agents/nico-agent/prof_1:conv_gm/get-messages?handshake=" +
          encodeURIComponent(token),
        { headers: { Origin: "http://localhost:3000" } },
      ),
      {
        NICO_HANDSHAKE_SECRET: SECRET,
        ALLOWED_ORIGINS: "http://localhost:3000",
      },
      async () =>
        new Response("[]", {
          headers: { "content-type": "application/json" },
        }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("does not recreate a WebSocket upgrade response (useAgentChat attach)", async () => {
    const upgraded = new Response("ok", {
      status: 200,
      headers: { "x-upgrade": "keep" },
    });
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "prof_1",
        conversationId: "conv_ws",
      },
      { secret: SECRET },
    );
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/agents/nico-agent/prof:conv", {
        headers: {
          Upgrade: "websocket",
          Origin: "http://localhost:3000",
          "x-nico-handshake": token,
        },
      }),
      {
        NICO_HANDSHAKE_SECRET: SECRET,
        ALLOWED_ORIGINS: "http://localhost:3000",
        get HYPERDRIVE() {
          throw new Error("HYPERDRIVE must not be touched on websocket upgrade");
        },
      },
      async () => upgraded,
    );
    expect(res).toBe(upgraded);
    expect(res.headers.get("x-upgrade")).toBe("keep");
  });

  it("rejects an anonymous /turn (KTD10)", async () => {
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/turn", {
        method: "POST",
        body: JSON.stringify({ message: "hi" }),
      }),
      envWithStub(),
    );
    expect(res.status).toBe(401);
  });

  it("routes a signed handshake /turn onto the named DO session", async () => {
    const token = await signHandshake(
      {
        authSubject: "user_1",
        profileId: "prof_1",
        conversationId: "conv_1",
      },
      { secret: SECRET },
    );
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/turn", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nico-handshake": token,
        },
        body: JSON.stringify({ message: "thesis?" }),
      }),
      envWithStub("data: {\"type\":\"token\",\"text\":\"ok\"}\n\n"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(await res.text()).toContain("token");
  });

  it("rejects /resume without the resume secret", async () => {
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionKey: "prof_1:conv_1", approvalId: "a1" }),
      }),
      envWithStub(),
    );
    expect(res.status).toBe(401);
  });

  it("resumes the same sessionKey after an approved decide (KTD12)", async () => {
    let seen = "";
    const env = {
      NICO_HANDSHAKE_SECRET: SECRET,
      NicoAgent: {
        idFromName: (name: string) => name,
        get: (id: string) => ({
          fetch: async () => {
            seen = String(id);
            return new Response("ok");
          },
        }),
      },
    };
    const res = await handleSiblingWorkerFetch(
      new Request("https://nico-agent.internal/resume", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nico-resume-secret": SECRET,
        },
        body: JSON.stringify({
          sessionKey: "prof_1:conv_1",
          approvalId: "appr_1",
        }),
      }),
      env,
    );
    expect(res.status).toBe(200);
    expect(seen).toBe("prof_1:conv_1");
  });
});
