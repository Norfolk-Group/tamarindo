/**
 * Start the nico-artifacts Workflow when the binding is injected (KTD7).
 * Local Next and tests no-op — artifacts.create still stores the spec.
 */
export async function startArtifactJob(artifactId: string): Promise<boolean> {
  const binding = (
    globalThis as { NICO_ARTIFACTS?: { create: (input: { params: { artifactId: string } }) => Promise<unknown> } }
  ).NICO_ARTIFACTS;
  if (!binding) return false;
  await binding.create({ params: { artifactId } });
  return true;
}
