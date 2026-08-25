/**
 * Deck specs. Ask/terms come only from published Deal Terms (R6).
 * The raise narrative lives in raise-deck.ts. Cap: 10 story + thank you + 6 backup.
 */

export const PITCH_STORY_SLIDE_COUNT = 10;
export const PITCH_THANKYOU_COUNT = 1;
export const PITCH_BACKUP_SLIDE_COUNT = 6;
export const PITCH_TOTAL_SLIDE_COUNT =
  PITCH_STORY_SLIDE_COUNT + PITCH_THANKYOU_COUNT + PITCH_BACKUP_SLIDE_COUNT;

export type DeckSlideKind = "story" | "thankyou" | "backup";
export type DeckFormat = "html" | "pptx" | "pdf";

export type DeckTable = {
  caption?: string;
  headers: string[];
  rows: string[][];
  footnote?: string;
};

export type DeckSlide = {
  id: string;
  title: string;
  bullets: string[];
  kind?: DeckSlideKind;
  table?: DeckTable;
};

export type DeckSpec = {
  slides: DeckSlide[];
  termsVersion: number;
  variant?: "raise" | "raise-draft" | "structure";
  generatedAt?: string;
  templateKey?: string | null;
};

export class UnpublishedTermsError extends Error {
  readonly code = "unpublished_terms";
  constructor() {
    super("Deal Terms are not published — refuse rather than invent the ask");
  }
}

export class PitchLimitError extends Error {
  readonly code = "pitch_limit";
  constructor(message = "Pitch decks are capped at 10 story slides, thank you, and 6 backups") {
    super(message);
  }
}

export function assertRaisePitchBudget(slides: DeckSlide[]): void {
  const story = slides.filter((slide) => slide.kind === "story");
  const thanks = slides.filter((slide) => slide.kind === "thankyou");
  const backup = slides.filter((slide) => slide.kind === "backup");
  if (
    slides.length !== PITCH_TOTAL_SLIDE_COUNT ||
    story.length !== PITCH_STORY_SLIDE_COUNT ||
    thanks.length !== PITCH_THANKYOU_COUNT ||
    backup.length !== PITCH_BACKUP_SLIDE_COUNT
  ) {
    throw new PitchLimitError();
  }
  const pnl = slides.find((slide) => slide.id === "pnl");
  const funds = slides.find((slide) => slide.id === "use-of-funds");
  if (!pnl?.table || !funds?.table) {
    throw new PitchLimitError("Every raise deck needs one P&L table and one Use of Funds table");
  }
}
