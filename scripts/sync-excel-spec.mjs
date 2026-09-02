#!/usr/bin/env node
/**
 * Embed docs/nico/tamarindo-excel-spec.md in a TS module so /api/nico/spec
 * does not read docs/ at request time (Workers tracing excludes ./docs).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "docs/nico/tamarindo-excel-spec.md");
const DEST = path.join(ROOT, "lib/model/excel-spec-md.ts");

const text = readFileSync(SRC, "utf8");
writeFileSync(
  DEST,
  [
    "// Generated from docs/nico/tamarindo-excel-spec.md — do not edit by hand.",
    'export const TAMARINDO_EXCEL_SPEC_FILENAME = "tamarindo-excel-spec.md";',
    `export const TAMARINDO_EXCEL_SPEC_MD = ${JSON.stringify(text)};`,
    "",
  ].join("\n"),
);
console.log(`Wrote ${DEST} (${text.length} chars)`);
