/**
 * Pietro's 5-slide deck spec. Ask/terms come only from published
 * Deal Terms (R6). Missing published terms is a named refusal.
 */

export type DeckSlide = {
  id: string;
  title: string;
  bullets: string[];
};

export type DeckSpec = {
  slides: DeckSlide[];
  termsVersion: number;
};

export class UnpublishedTermsError extends Error {
  readonly code = "unpublished_terms";
  constructor() {
    super("Deal Terms are not published — refuse rather than invent the ask");
  }
}

export function deckSpecFromPublishedTerms(terms: {
  version: number | null;
  status: string | null;
  payload: Record<string, unknown> | null;
}): DeckSpec {
  if (!terms.version || terms.status !== "published" || !terms.payload) {
    throw new UnpublishedTermsError();
  }
  const payload = terms.payload;
  const text = (key: string): string => {
    const value = payload[key];
    if (value == null) return "";
    return String(value);
  };
  return {
    termsVersion: terms.version,
    slides: [
      { id: "problem", title: "Problem", bullets: ["Credit does not travel to Colombian homes."] },
      { id: "product", title: "Product", bullets: ["Tamarindo is a fee machine + rails, not a lender."] },
      { id: "model", title: "Model", bullets: ["Ten-year P&L is a separate artifact; this slide cites terms only."] },
      {
        id: "ask",
        title: "The ask",
        bullets: [
          text("seedAskUsd") || "Ask is blank in published terms",
          text("instrument"),
          text("preMoneyUsd"),
        ].filter(Boolean),
      },
      {
        id: "terms",
        title: "Terms",
        bullets: [
          text("board"),
          text("status"),
        ].filter(Boolean),
      },
    ],
  };
}
