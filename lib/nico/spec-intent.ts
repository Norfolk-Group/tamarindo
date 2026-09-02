import { detectReplyLanguage } from "@/lib/nico/reply-language";

const SPEC_RE =
  /\b(excel spec|claude for excel|claude.?excel|tamarindo-excel-spec|business spec|engine spec|spec for excel|download (the )?(excel )?spec|especificaci[oó]n (de |para )?excel)\b/i;

export function parseExcelSpecAsk(message: string): boolean {
  return SPEC_RE.test(message.trim());
}

export function excelSpecDownloadNote(message: string): string {
  const es = detectReplyLanguage(message) === "es";
  if (es) {
    return [
      "La especificación para Claude for Excel está lista.",
      "Descárgala desde Statements → Excel spec, o abre /api/nico/spec (sesión iniciada).",
      "Archivo tamarindo-excel-spec.md. Pégalo entero en Claude for Excel.",
      "No inventes un raise ni una TIR de salida.",
    ].join(" ");
  }
  return [
    "The Claude-for-Excel spec is ready.",
    "Download it from Statements → Excel spec, or open /api/nico/spec (signed in).",
    "Filename tamarindo-excel-spec.md. Paste the whole file into Claude for Excel.",
    "Do not invent a raise or an exit IRR.",
  ].join(" ");
}
