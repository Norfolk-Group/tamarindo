export type MediaAsk = {
  kind: "image" | "video";
  prompt: string;
};

const VIDEO_RE =
  /\b(video|clip|animation|animate|short film|veo|cinematic)\b/i;
const IMAGE_RE =
  /\b(image|picture|photo|illustration|illustrate|draw|render|mockup|visual|nano banana|generate (an? )?(img|pic))\b/i;
const MAKE_RE =
  /\b(make|create|generate|draw|show me|paint|sketch|render|imagine)\b/i;

/**
 * Media is a real lookup, not chit-chat. "draw me the Poblado stack"
 * should hit Gemini, not the thesis dump.
 */
export function parseMediaAsk(message: string): MediaAsk | null {
  const text = message.trim();
  if (text.length < 8) return null;
  const wantsVideo = VIDEO_RE.test(text) && MAKE_RE.test(text);
  const wantsImage =
    (IMAGE_RE.test(text) && MAKE_RE.test(text)) ||
    /\b(nano banana|illustrate this|draw this)\b/i.test(text);
  if (!wantsVideo && !wantsImage) return null;
  return {
    kind: wantsVideo ? "video" : "image",
    prompt: text.replace(/^\s*(please|hey nico|nico[,:]?)\s+/i, "").trim(),
  };
}
