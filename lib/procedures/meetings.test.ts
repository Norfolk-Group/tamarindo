import { describe, expect, it } from "vitest";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

describe("meetings.join", () => {
  it("is listed for members and requires approval", () => {
    const cap = registry
      .capabilities({ role: "member", kind: "user" })
      .find((item) => item.name === "meetings.join");
    expect(cap?.requiresApproval).toBe(true);
  });

  it("refuses an agent invoke without a consumed approval", async () => {
    await expect(
      registry.invoke(
        "meetings.join",
        {
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        },
        {
          actor: {
            kind: "agent",
            id: "user_1",
            displayName: "Nico",
            role: "member",
          },
          traceId: "meet-1",
        },
      ),
    ).rejects.toBeInstanceOf(ProcedureError);
  });
});
