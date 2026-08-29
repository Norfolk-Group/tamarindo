export type ReplyLanguage = "en" | "es";

const EXPLICIT_EN =
  /\b(in english|speak english|switch to english|en inglés)\b/i;
const EXPLICIT_ES =
  /\b(en español|háblame en español|habla español|castellano|in spanish)\b/i;

const ES_CUES =
  /[áéíóúñü¿¡]|\b(qué|como|cómo|cuánto|cuánta|cuál|cuáles|dónde|por qué|muéstrame|muestrame|explícame|explicame|explícame|háblame|dime|tenemos|ganamos|llevamos|arriendo|arrendamiento|cuota inicial|flujo de caja|estados? financieros?|estado de resultados|prueba de estrés|sensibilidad|originación|fondeo|tamarindo funciona|el producto|la tir|los libros)\b/i;

export function detectReplyLanguage(message: string): ReplyLanguage {
  const text = message.trim();
  if (!text) return "en";
  if (EXPLICIT_EN.test(text)) return "en";
  if (EXPLICIT_ES.test(text) || ES_CUES.test(text)) return "es";
  return "en";
}
