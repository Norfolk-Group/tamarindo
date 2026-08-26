import { parseBusinessExplainAsk } from "@/lib/nico/business-intent";
import { isWorkbookRequest } from "@/lib/nico/workbook-intent";
import { isLifeTalk } from "@/lib/nico/world-intent";
import { parseMediaAsk } from "@/lib/nico/media-intent";
import { isPersonAsk } from "@/lib/nico/people";

const SMALLTALK_RE =
  /^(hi|hello|hey|howdy|yo|thanks|thank you|ok|okay|good (morning|afternoon|evening)|what['’]s up|how are you|how('s| is) it going)\b/i;

const KNOWLEDGE_RE =
  /\b(thesis|tamarindo|intervest|ashoka|colombia|colombian|opco|icp|deal terms?|yield|ltv|fico|fee|activation|origination|servicing|balloon|residual|comodato|lease|leasing|p&l|income statement|raise|seed|burn|breakeven|aum|valuation|entity|entities|data room|nda|investor|cartagena|medell[ií]n|poblado|llanogrande|envigado|bocagrande|castillo|sucursal|workbook|worksheet|excel|ten-year|10-year|tax|cit|visa|predial|estrato)\b/i;

/**
 * Retrieval is for a factual Tamarindo ask. Greetings and rapport
 * stay a conversation — they must not dump the knowledge base.
 */
export function needsKnowledgeSearch(message: string): boolean {
  const text = message.trim();
  if (text.length < 2) return false;
  if (isWorkbookRequest(text)) return false;
  if (parseBusinessExplainAsk(text)) return false;
  if (isLifeTalk(text)) return false;
  if (parseMediaAsk(text) && !KNOWLEDGE_RE.test(text)) return false;
  if (SMALLTALK_RE.test(text) && text.length < 80) return false;
  // "who is Dov?" is 11 chars and used to miss the binder entirely.
  if (isPersonAsk(text)) return true;
  if (KNOWLEDGE_RE.test(text)) return true;
  // Real questions still retrieve even if they skip the brand names.
  if (text.includes("?") && text.length >= 12) return true;
  return text.length >= 48;
}
