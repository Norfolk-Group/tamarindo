import type { VariableDef } from "@/lib/model/types";
import { VARIABLE_DEFS } from "@/lib/model/variables";

/** User-facing inputs. Seed = defaultValue. Excel convention: blue = typed. */
export function isBlueVariable(def: Pick<VariableDef, "visibility">): boolean {
  return def.visibility === "user";
}

export function blueVariableDefs(): VariableDef[] {
  return VARIABLE_DEFS.filter(isBlueVariable);
}

export function blueSeedDefaults(): Record<string, VariableDef["defaultValue"]> {
  return Object.fromEntries(
    blueVariableDefs().map((def) => [def.key, def.defaultValue]),
  );
}
