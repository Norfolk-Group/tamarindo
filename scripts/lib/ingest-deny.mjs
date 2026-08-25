/**
 * Permanent exclusions for Knowledge ingest.
 * Keep these out of thesis markdown — they are a filter, not facts to retrieve.
 */
const DENY = [/kit[\s._-]*digital/i];

/** @returns {string | null} reason to drop, or null if the text may be indexed */
export function ingestDeniedReason(filename, text = "") {
  const hay = `${filename}\n${String(text).slice(0, 8_000)}`;
  for (const re of DENY) {
    if (re.test(hay)) return "excluded personal-history topic";
  }
  return null;
}
