export type PrimaryColumnId =
  | "artifacts"
  | "dataroom"
  | "help"
  | "model"
  | "variables";

export type PrimaryPanel = "conversation" | PrimaryColumnId;

export type AdminSectionId = "approvals" | "capabilities" | "icps" | "variables";

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
  return flyout.type === "admin" ? "second" : "first";
}

/**
 * First-level panels visible before the current NDA. Mirrors
 * `canReadConfidential`: the model, its levers, and generated files are
 * confidential; the conversation, data-room teaser, and help are not.
 */
const PUBLIC_PANELS: readonly PrimaryPanel[] = ["conversation", "dataroom", "help"];

export function canShowPanel(
  panel: PrimaryPanel,
  viewer: { isAdmin: boolean; ndaExecuted: boolean },
): boolean {
  if (viewer.isAdmin || viewer.ndaExecuted) return true;
  return PUBLIC_PANELS.includes(panel);
}
