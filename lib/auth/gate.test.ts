import { describe, expect, it } from "vitest";
import { isApiPath, isPublicPath, sessionGate } from "@/lib/auth/gate";

describe("isPublicPath", () => {
  it("allows health, sign-in, login, and callback", () => {
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/callback")).toBe(true);
  });

  it("allows named webhook prefixes and the DO handshake", () => {
    expect(isPublicPath("/api/webhooks/meta")).toBe(true);
    expect(isPublicPath("/api/webhooks/twilio")).toBe(true);
    expect(isPublicPath("/api/webhooks/recall")).toBe(true);
    expect(isPublicPath("/api/webhooks/resend")).toBe(true);
    expect(isPublicPath("/agents/nico")).toBe(true);
    expect(isPublicPath("/invite")).toBe(true);
    expect(isPublicPath("/logout")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
    expect(isPublicPath("/icon")).toBe(true);
    expect(isPublicPath("/apple-icon")).toBe(true);
    expect(isPublicPath("/api/invite/accept")).toBe(true);
  });

  it("does not allow capabilities, chat, NDA, or the homepage", () => {
    expect(isPublicPath("/api/nico/capabilities")).toBe(false);
    expect(isPublicPath("/api/nico/chat")).toBe(false);
    expect(isPublicPath("/api/nico/handshake")).toBe(false);
    expect(isPublicPath("/api/nico/nda")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });
});

describe("sessionGate", () => {
  it("401s session-gated APIs when there is no session", () => {
    expect(sessionGate("/api/nico/capabilities", false, { allowDevBypass: false })).toEqual({
      action: "unauthorized",
    });
    expect(sessionGate("/api/nico/chat", false, { allowDevBypass: false })).toEqual({
      action: "unauthorized",
    });
  });

  it("redirects pages to /sign-in when there is no session", () => {
    expect(sessionGate("/", false, { allowDevBypass: false })).toEqual({
      action: "redirect",
      to: "/sign-in",
    });
  });

  it("allows the local loopback bypass when asked", () => {
    expect(sessionGate("/", false, { allowDevBypass: true })).toEqual({
      action: "allow",
    });
  });

  it("still allows public paths without a session", () => {
    expect(sessionGate("/api/health", false, { allowDevBypass: false })).toEqual({
      action: "allow",
    });
  });

  it("treats /api as an API path", () => {
    expect(isApiPath("/api")).toBe(true);
    expect(isApiPath("/api/nico/nda")).toBe(true);
    expect(isApiPath("/sign-in")).toBe(false);
  });
});
