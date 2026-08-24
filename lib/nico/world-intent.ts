/**
 * Casual talk and a small live-world kit. Nico is a person first.
 * Weather, markets, headlines, a parlor horoscope — examples of being
 * in the day, not a mandate to bolt on every API.
 */
const SMALLTALK_RE =
  /^(hi|hello|hey|howdy|yo|thanks|thank you|ok|okay|good (morning|afternoon|evening)|what['’]s up|how are you|how('s| is) it going|you good|missed you|lunch|weekend|i['’]?m tired|tell me a joke|good night|bye)\b/i;

const ASIDE_RE =
  /\b(how's the weather|how is the weather|nice day|too hot|too cold|i['’]m exhausted|need a break|got a minute|grab coffee|coffee\?)\b/i;

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

const MARKETS_RE =
  /\b(nasdaq|nasdq|s&p\s*500|s and p|dow jones|stock market|equities|how('s| is) the market|markets today|risk[- ]on|risk[- ]off)\b/i;

const FX_RE =
  /\b(usd\s*\/?\s*cop|dollar (to|in) (colombia|pesos)|colombian peso|fx|exchange rate|trm)\b/i;

const COFFEE_RE =
  /\b(coffee (price|prices|futures|market)|arabica|how('s| is) coffee trading)\b/i;

const NEWS_RE =
  /\b(headlines|top news|news of the (day|hour)|what('s| is) (the )?(news|happening in the world)|world news|colombia news)\b/i;

const REAL_ESTATE_RE =
  /\b(real estate|housing (market|news)|inmobiliari[oa]|finca ra[ií]z|vivienda|arriendos?|property market)\b/i;

const MEDELLIN_AREA_RE =
  /\b(medell[ií]n|el poblado|poblado|envigado|sabaneta|itag[uü][ií]|bello|llanogrande|rionegro|valle de aburr[aá]|aburr[aá]|oriente antioque[nñ]o|greater medell[ií]n)\b/i;

const CARTAGENA_WALL_RE =
  /\b(cartagena|ciudad amurallada|walled city|centro hist[oó]rico|getseman[ií]|bocagrande)\b/i;

const PULSE_RE =
  /\b(how('s| is) the world|what('s| is) going on out there|catch me up( on the world)?|world pulse)\b/i;

const DEAL_RE =
  /\b(tamarindo|intervest|ashoka|comodato|comodato|ltv|fico|origination|activation fee)\b/i;

export type NewsRegion =
  | "world"
  | "us"
  | "colombia"
  | "medellin_re"
  | "cartagena_re";

export type WorldAsk =
  | { kind: "weather"; place: string }
  | { kind: "horoscope"; sign: StarSign | null }
  | { kind: "markets"; focus: "all" | "indices" | "fx" | "coffee" }
  | { kind: "news"; window: "hour" | "day"; region: NewsRegion }
  | { kind: "pulse" };

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
  const match = message.match(
    /\b(?:in|for|at)\s+([A-Za-zÀ-ÿ'.\- ]{2,40}?)\s*[?.!]*$/i,
  );
  return match?.[1]?.trim() ?? "Medellín";
}

export function starSignIn(message: string): StarSign | null {
  const lower = message.toLowerCase();
  return STAR_SIGNS.find((sign) => lower.includes(sign)) ?? null;
}

export function parseWorldAsk(message: string): WorldAsk | null {
  if (isHoroscopeAsk(message) || STAR_SIGNS.some((s) => new RegExp(`\\b${s}\\b`, "i").test(message) && HOROSCOPE_RE.test(message))) {
    return { kind: "horoscope", sign: starSignIn(message) };
  }
  if (isWeatherAsk(message)) {
    return { kind: "weather", place: weatherPlace(message) };
  }
  if (COFFEE_RE.test(message)) {
    return { kind: "markets", focus: "coffee" };
  }
  if (FX_RE.test(message)) {
    return { kind: "markets", focus: "fx" };
  }
  if (MARKETS_RE.test(message)) {
    return { kind: "markets", focus: "indices" };
  }
  if (PULSE_RE.test(message)) {
    return { kind: "pulse" };
  }
  const housing = housingNewsAsk(message);
  if (housing) return housing;
  if (NEWS_RE.test(message)) {
    if (DEAL_RE.test(message)) return null;
    const window = newsWindow(message);
    const region = /\b(colombia|colombian|medell[ií]n|bogot[aá]|cartagena)\b/i.test(
      message,
    )
      ? "colombia"
      : /\b(u\.?s\.?|united states|america)\b/i.test(message)
        ? "us"
        : "world";
    return { kind: "news", window, region };
  }
  return null;
}

function newsWindow(message: string): "hour" | "day" {
  return /\b(hour|hourly|this hour|last hour)\b/i.test(message) ? "hour" : "day";
}

function housingNewsAsk(message: string): WorldAsk | null {
  if (DEAL_RE.test(message)) return null;
  const housing = REAL_ESTATE_RE.test(message);
  const wallSpecific =
    /\b(ciudad amurallada|walled city|centro hist[oó]rico|getseman[ií])\b/i.test(
      message,
    );
  if (MEDELLIN_AREA_RE.test(message) && housing) {
    return { kind: "news", window: newsWindow(message), region: "medellin_re" };
  }
  if (CARTAGENA_WALL_RE.test(message) && (housing || wallSpecific)) {
    return { kind: "news", window: newsWindow(message), region: "cartagena_re" };
  }
  return null;
}

export function isLifeTalk(message: string): boolean {
  return (
    isChitChat(message) ||
    ASIDE_RE.test(message) ||
    parseWorldAsk(message) !== null
  );
}
