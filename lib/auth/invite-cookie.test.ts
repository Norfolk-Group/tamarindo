import { describe, expect, it } from "vitest";
import {
  INVITE_EMAIL_COOKIE,
  inviteEmailCookieHeader,
  readInviteEmail,
} from "@/lib/auth/invite-cookie";

describe("invite email cookie", () => {
  it("round-trips a plus-address", () => {
    const header = inviteEmailCookieHeader("ricardo.cidale+f4@norfolkgroup.io");
    expect(header).toContain(`${INVITE_EMAIL_COOKIE}=`);
    const encoded = header.split(";")[0]?.split("=")[1];
    expect(readInviteEmail(encoded)).toBe(
      "ricardo.cidale+f4@norfolkgroup.io",
    );
  });

  it("returns undefined for empty values", () => {
    expect(readInviteEmail("")).toBeUndefined();
    expect(readInviteEmail(null)).toBeUndefined();
  });
});
