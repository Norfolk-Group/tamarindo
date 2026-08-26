import { describe, expect, it } from "vitest";
import {
  activePrimary,
  goHome,
  isAdminOpen,
  railLevel,
  selectAdminSection,
  selectPrimary,
  toggleAdmin,
} from "@/lib/nico/rail-columns";

describe("selectPrimary", () => {
  it("opens one workspace column and replaces any other flyout", () => {
    expect(selectPrimary("model")).toEqual({ type: "primary", id: "model" });
    expect(selectPrimary("artifacts")).toEqual({
      type: "primary",
      id: "artifacts",
    });
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

  it("replaces the first-level rail when Admin or a workspace is open", () => {
    expect(railLevel({ type: "admin", section: "approvals" })).toBe("second");
    expect(railLevel({ type: "primary", id: "model" })).toBe("second");
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
