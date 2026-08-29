import { describe, expect, it } from "vitest";
import {
  activePrimary,
  canShowPanel,
  goHome,
  isAdminOpen,
  railLevel,
  selectAdminSection,
  selectPrimary,
  toggleAdmin,
} from "@/lib/nico/rail-columns";

describe("canShowPanel", () => {
  it("hides confidential panels before the NDA", () => {
    const viewer = { isAdmin: false, ndaExecuted: false };
    expect(canShowPanel("conversation", viewer)).toBe(true);
    expect(canShowPanel("dataroom", viewer)).toBe(true);
    expect(canShowPanel("help", viewer)).toBe(true);
    expect(canShowPanel("model", viewer)).toBe(false);
    expect(canShowPanel("variables", viewer)).toBe(false);
    expect(canShowPanel("artifacts", viewer)).toBe(false);
  });

  it("shows everything once the NDA is executed or for admins", () => {
    expect(canShowPanel("model", { isAdmin: false, ndaExecuted: true })).toBe(true);
    expect(canShowPanel("variables", { isAdmin: true, ndaExecuted: false })).toBe(true);
  });
});

describe("selectPrimary", () => {
  it("opens one workspace column and replaces any other flyout", () => {
    expect(selectPrimary("model")).toEqual({ type: "primary", id: "model" });
    expect(selectPrimary("artifacts")).toEqual({
      type: "primary",
      id: "artifacts",
    });
    expect(selectPrimary("help")).toEqual({ type: "primary", id: "help" });
  });

  it("closes the flyout when conversation is selected", () => {
    expect(selectPrimary("conversation")).toEqual({ type: "none" });
  });
});

describe("toggleAdmin", () => {
  it("replaces a primary column with admin", () => {
    expect(
      toggleAdmin({ type: "primary", id: "model" }, "approvals"),
    ).toEqual({ type: "admin", section: "approvals" });
  });

  it("closes admin when it is already open", () => {
    expect(
      toggleAdmin({ type: "admin", section: "capabilities" }, "approvals"),
    ).toEqual({ type: "none" });
  });
});

describe("selectAdminSection", () => {
  it("replaces the open admin section", () => {
    expect(selectAdminSection("variables")).toEqual({
      type: "admin",
      section: "variables",
    });
    expect(selectAdminSection("icps")).toEqual({
      type: "admin",
      section: "icps",
    });
  });
});

describe("activePrimary", () => {
  it("highlights conversation unless a primary column is open", () => {
    expect(activePrimary({ type: "none" })).toBe("conversation");
    expect(activePrimary({ type: "admin", section: "approvals" })).toBe(
      "conversation",
    );
    expect(activePrimary({ type: "primary", id: "dataroom" })).toBe("dataroom");
  });
});

describe("railLevel", () => {
  it("keeps the first-level rail only when no second-level menu is open", () => {
    expect(railLevel({ type: "none" })).toBe("first");
  });

  it("replaces the first-level rail only for Admin, not for workspaces", () => {
    expect(railLevel({ type: "admin", section: "approvals" })).toBe("second");
    expect(railLevel({ type: "primary", id: "model" })).toBe("first");
  });
});

describe("goHome", () => {
  it("returns to the first-level sidebar", () => {
    expect(goHome()).toEqual({ type: "none" });
  });
});

describe("isAdminOpen", () => {
  it("is true only for the admin flyout", () => {
    expect(isAdminOpen({ type: "admin", section: "approvals" })).toBe(true);
    expect(isAdminOpen({ type: "primary", id: "model" })).toBe(false);
  });
});
