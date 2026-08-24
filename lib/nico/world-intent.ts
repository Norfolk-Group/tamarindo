/**
 * Casual talk. Nico is a person first. Do not open the thesis
 * for rapport. Weather / horoscope were examples of that idea,
 * not product requirements.
 */
const SMALLTALK_RE =
  /^(hi|hello|hey|howdy|yo|thanks|thank you|ok|okay|good (morning|afternoon|evening)|what['’]s up|how are you|how('s| is) it going|you good|missed you|coffee|lunch|weekend|i['’]?m tired|tell me a joke|good night|bye)\b/i;

const ASIDE_RE =
  /\b(how's the weather|how is the weather|nice day|too hot|too cold|i['’]m exhausted|need a break|got a minute)\b/i;

export const STAR_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type StarSign = (typeof STAR_SIGNS)[number];

const WEATHER_RE =
  /\b(weather|forecast|temperature|raining|will it rain|how (hot|cold) is it)\b/i;

const HOROSCOPE_RE = /\b(horoscope|zodiac|astrology)\b/i;

export function isChitChat(message: string): boolean {
  const text = message.trim();
  return SMALLTALK_RE.test(text) && text.length < 120;
}

export function isWeatherAsk(message: string): boolean {
  return WEATHER_RE.test(message);
}

export function isHoroscopeAsk(message: string): boolean {
  return HOROSCOPE_RE.test(message);
}

/** "weather in Cartagena?" → "Cartagena"; default is home base Medellín. */
export function weatherPlace(message: string): string {
  const match = message.match(/\b(?:in|for|at)\s+([A-Za-zÀ-ÿ'.\- ]{2,40}?)\s*[?.!]*$/i);
  return match?.[1]?.trim() ?? "Medellín";
}

export function starSignIn(message: string): StarSign | null {
  const lower = message.toLowerCase();
  return STAR_SIGNS.find((sign) => lower.includes(sign)) ?? null;
}

export function isLifeTalk(message: string): boolean {
  return (
    isChitChat(message) ||
    ASIDE_RE.test(message) ||
    isWeatherAsk(message) ||
    isHoroscopeAsk(message)
  );
}
