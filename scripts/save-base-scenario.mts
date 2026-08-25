/**
 * Persist a named base case from the current published defaults.
 *
 *   node --env-file=.env --import tsx scripts/save-base-scenario.mts
 */
import { prisma } from "@/lib/db";
import { explainCell, listScenarios, saveScenario } from "@/lib/model/cell-store";
import { defaultValues } from "@/lib/model/variables";

const EXPLAIN_KEY = "us.spread.fy3";

async function main() {
  const saved = await saveScenario({
    name: "Base case 2026-08-23 FICO",
    description:
      "Current published defaults: 11.84% blended, 20% balloon floor, 30% rented time, equity 2.0/2.25/2.25.",
    values: defaultValues(),
    isBase: true,
  });

  console.log("saved", saved);

  const scenarios = await listScenarios();
  const listed = scenarios.find((row) => row.id === saved.scenarioId);
  console.log("listed", {
    found: Boolean(listed),
    name: listed?.name,
    isBase: listed?.isBase,
    cellCount: listed?.cellCount,
  });

  const explained = await explainCell(saved.scenarioId, EXPLAIN_KEY);
  console.log("explain", {
    key: EXPLAIN_KEY,
    resolved: Boolean(explained),
    label: explained?.label,
    value: explained?.value,
    formula: explained?.formula,
    inputCount: explained?.inputs.length,
    inputs: explained?.inputs.map((node) => node.key),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
