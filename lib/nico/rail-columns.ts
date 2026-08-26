export type PrimaryColumnId = "artifacts" | "dataroom" | "model" | "variables";

export type PrimaryPanel = "conversation" | PrimaryColumnId;

export type AdminSectionId = "approvals" | "capabilities" | "variables";

export type RailFlyout =
  | { type: "none" }
  | { type: "primary"; id: PrimaryColumnId }
  | { type: "admin"; section: AdminSectionId };

export function selectPrimary(next: PrimaryPanel): RailFlyout {
  if (next === "conversation") return { type: "none" };
  return { type: "primary", id: next };
}

export function toggleAdmin(
  current: RailFlyout,
  defaultSection: AdminSectionId,
): RailFlyout {
  if (current.type === "admin") return { type: "none" };
  return { type: "admin", section: defaultSection };
}

export function selectAdminSection(section: AdminSectionId): RailFlyout {
  return { type: "admin", section };
}

export function activePrimary(flyout: RailFlyout): PrimaryPanel {
  return flyout.type === "primary" ? flyout.id : "conversation";
}

export function isAdminOpen(flyout: RailFlyout): boolean {
  return flyout.type === "admin";
}

export function goHome(): RailFlyout {
  return { type: "none" };
}

export function railLevel(flyout: RailFlyout): "first" | "second" {
  return flyout.type === "none" ? "first" : "second";
}
