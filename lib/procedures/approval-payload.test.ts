import { describe, expect, it } from "vitest";
import {
  canonicalApprovalPayload,
  hashApprovalInput,
} from "@/lib/procedures/approval-payload";

describe("canonical approval payload", () => {
  it("drops approvalId and is order-insensitive", () => {
    const a = hashApprovalInput({
      approvalId: "x",
      to: "a@b.c",
      body: "hi",
      channel: "email",
    });
    const b = hashApprovalInput({
      channel: "email",
      body: "hi",
      to: "a@b.c",
    });
    expect(a).toBe(b);
    expect(canonicalApprovalPayload({ approvalId: "x", to: "a@b.c" })).toEqual({
      to: "a@b.c",
    });
  });

  it("changes when the recipient or body changes (AE4)", () => {
    const approved = hashApprovalInput({
      to: "a@b.c",
      body: "X",
      channel: "email",
    });
    const swapped = hashApprovalInput({
      to: "b@c.d",
      body: "Y",
      channel: "email",
    });
    expect(approved).not.toBe(swapped);
  });
});
