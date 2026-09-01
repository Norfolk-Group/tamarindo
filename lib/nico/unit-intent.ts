export type UnitAsk =
  | { kind: "quote" }
  | { kind: "ticket"; fundedUsd: number; drawUsd?: number };

const SET_RE =
  /\b(set|change|dial|update|move|pon|cambia|ajusta|mueve|actualiza)\b[\s\S]{0,80}\b(to|at|=|a|en|al)\b/i;

const STEAL_RE =
  /\b(investor returns?|sensitivity|income statement|p&l|financial statements?|corporate structure|entity map|worksheet|workbook|excel|help me build|explain (tamarindo|the (business|model))|estados? financieros?|flujo de caja|explica(me)? tamarindo)\b/i;

const QUOTE_RE =
  /\b(what(?:'s| is) (?:the |our )?(?:origination|servicing|activation|take rate|fee stack)|quote (?:the )?(?:fees|live (?:fees|seeds|rates))|live (?:fee|origination|servicing) (?:rate|seed)s?|cu[aá]l es (?:nuestra |la )?(?:originaci[oó]n|servicing|activaci[oó]n|comisi[oó]n))\b/i;

const TICKET_RE =
  /\b(unit economics|what (?:do|would) we (?:make|earn|take)|fees? on|year[- ]one (?:gross|on)|on a (?:\$|ticket)|funded ticket|ticket (?:of|at|for)|cu[aá]nto (?:ganamos|nos llevamos|cobramos)|en un (?:arriendo|arrendamiento|lease|ticket))\b/i;

const MONEY_RE =
  /\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(\s*(k|m|mm|million))?\b|\b(\d+(?:\.\d+)?)(\s*)(k|m|mm|million)\b/i;

export function parseUnitCalcAsk(message: string): UnitAsk | null {
  const text = message.trim();
  if (!text) return null;
  if (SET_RE.test(text) || STEAL_RE.test(text)) return null;

  const fundedUsd = parseMoney(text);
  if (
    fundedUsd != null &&
    (TICKET_RE.test(text) ||
      /\b(origination|originaci[oó]n|servicing|activation|activaci[oó]n|fees?|comisi[oó]n)\b/i.test(
        text,
      ))
  ) {
    return { kind: "ticket", fundedUsd };
  }
  if (QUOTE_RE.test(text)) return { kind: "quote" };
  if (TICKET_RE.test(text) && fundedUsd != null) return { kind: "ticket", fundedUsd };
  return null;
}

export function parseMoney(text: string): number | null {
  const match = text.match(MONEY_RE);
  if (!match) return null;
  const raw = (match[1] ?? match[4] ?? "").replaceAll(",", "");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  const suffix = (match[3] ?? match[6] ?? "").toLowerCase();
  if (suffix === "k") return n * 1_000;
  if (suffix === "m" || suffix === "mm" || suffix === "million") return n * 1_000_000;
  return n;
}
