/**
 * Tamarindo file library on R2 (`tamarindo-files`).
 * Every write goes through these prefixes. Do not invent parallel trees.
 */

export const R2_BUCKET = "tamarindo-files";

export type R2Audience = "system" | "admin" | "entitled" | "public";
export type R2IndexPolicy = "vector" | "metadata" | "none";

export type R2Shelf = {
  prefix: string;
  audience: R2Audience;
  index: R2IndexPolicy;
  purpose: string;
};

/** Drawers. Keys are always `{prefix}/…`. */
export const R2_SHELVES = {
  kbRawChat: {
    prefix: "library/kb/raw/chat",
    audience: "admin",
    index: "vector",
    purpose: "Source files dropped in Cursor chat — never overwrite casually",
  },
  kbRawDropbox: {
    prefix: "library/kb/raw/dropbox",
    audience: "admin",
    index: "vector",
    purpose: "Source docs pulled from Dropbox",
  },
  kbRawBrand: {
    prefix: "library/kb/raw/brand",
    audience: "admin",
    index: "metadata",
    purpose: "Logos, marks, team photos used on decks",
  },
  kbDerived: {
    prefix: "library/kb/derived",
    audience: "system",
    index: "vector",
    purpose: "Extracts, indexes, and notes Nico produced for himself",
  },
  templatesFinancial: {
    prefix: "library/templates/financial",
    audience: "admin",
    index: "none",
    purpose: "Statement shells that change numerically only",
  },
  templatesReports: {
    prefix: "library/templates/reports",
    audience: "admin",
    index: "none",
    purpose: "Non-statement report shells",
  },
  illustrations: {
    prefix: "library/illustrations/generated",
    audience: "entitled",
    index: "metadata",
    purpose: "Nano Banana Pro / OpenAI images Nico painted",
  },
  mediaVideo: {
    prefix: "library/media/generated",
    audience: "entitled",
    index: "metadata",
    purpose: "Veo (and later) clips",
  },
  chartsSpecs: {
    prefix: "library/charts/specs",
    audience: "system",
    index: "none",
    purpose: "Chart JSON that re-renders when variables move",
  },
  chartsRendered: {
    prefix: "library/charts/rendered",
    audience: "entitled",
    index: "none",
    purpose: "Frozen PNG/SVG of a chart at one variable set",
  },
  shareUsers: {
    prefix: "library/share/users/artifacts",
    audience: "entitled",
    index: "none",
    purpose: "Downloadable work product visible to entitled users",
  },
  shareAdmin: {
    prefix: "library/share/admin/artifacts",
    audience: "admin",
    index: "none",
    purpose: "Admin-only drafts and working files",
  },
  scratch: {
    prefix: "library/scratch",
    audience: "system",
    index: "none",
    purpose: "Ephemeral working bytes — not the knowledge base",
  },
  inboxChat: {
    prefix: "library/inbox/chat",
    audience: "admin",
    index: "metadata",
    purpose: "Unclassified landing zone before a shelf is chosen",
  },
} as const satisfies Record<string, R2Shelf>;

export type R2ShelfId = keyof typeof R2_SHELVES;

const LEGACY_ALIASES: Array<{ from: RegExp; to: (match: RegExpExecArray) => string }> =
  [
    {
      from: /^uploads\/chat\/(.+)$/,
      to: (m) => `${R2_SHELVES.kbRawChat.prefix}/${m[1]}`,
    },
    {
      from: /^source\/dropbox\/(.+)$/,
      to: (m) => `${R2_SHELVES.kbRawDropbox.prefix}/${m[1]}`,
    },
    {
      from: /^source\/brand\/(.+)$/,
      to: (m) => `${R2_SHELVES.kbRawBrand.prefix}/${m[1]}`,
    },
    {
      from: /^artifacts\/chat-media\/(.+)$/,
      to: (m) => `${R2_SHELVES.illustrations.prefix}/legacy/${m[1]}`,
    },
    {
      from: /^artifacts\/([^/]+)\/(.+)$/,
      to: (m) => `${R2_SHELVES.shareUsers.prefix}/${m[1]}/${m[2]}`,
    },
  ];

export function isoDay(at = new Date()): string {
  return at.toISOString().slice(0, 10);
}

export function r2Key(
  shelf: R2ShelfId,
  rest: string,
): string {
  const prefix = R2_SHELVES[shelf].prefix;
  const tail = rest.replace(/^\/+/, "");
  return `${prefix}/${tail}`;
}

export function chatUploadKey(filename: string, at = new Date()): string {
  return r2Key("kbRawChat", `${isoDay(at)}/${safeSegment(filename)}`);
}

export function illustrationKey(
  ext: string,
  at = new Date(),
  id = crypto.randomUUID(),
): string {
  return r2Key("illustrations", `${isoDay(at)}/${id}.${ext.replace(/^\./, "")}`);
}

export function generatedVideoKey(
  ext: string,
  at = new Date(),
  id = crypto.randomUUID(),
): string {
  return r2Key("mediaVideo", `${isoDay(at)}/${id}.${ext.replace(/^\./, "")}`);
}

export function userArtifactKey(artifactId: string, filename: string): string {
  return r2Key("shareUsers", `${artifactId}/${safeSegment(filename)}`);
}

export function adminArtifactKey(artifactId: string, filename: string): string {
  return r2Key("shareAdmin", `${artifactId}/${safeSegment(filename)}`);
}

/** Map old keys to the library. Readers should try both. */
export function canonicalR2Key(key: string): string {
  for (const alias of LEGACY_ALIASES) {
    const match = alias.from.exec(key);
    if (match) return alias.to(match);
  }
  return key;
}

export function classifyR2Key(key: string): R2Shelf | null {
  const canonical = canonicalR2Key(key);
  const shelves = Object.values(R2_SHELVES);
  const hit = shelves.find((shelf) => canonical === shelf.prefix || canonical.startsWith(`${shelf.prefix}/`));
  return hit ?? null;
}

export function shouldVectorIndex(key: string): boolean {
  return classifyR2Key(key)?.index === "vector";
}

function safeSegment(name: string): string {
  return name.replace(/[/\\]+/g, "-").replace(/^\.+/, "") || "file";
}
