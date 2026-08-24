/**
 * Two-host podcast script. Audio TTS stays deferred; the downloadable
 * artifact is this script. It does not invent numbers not in the memo.
 */

export type PodcastLine = {
  speaker: "A" | "B";
  text: string;
};

export type PodcastScript = {
  title: string;
  speakers: 2;
  lines: PodcastLine[];
};

export function podcastScriptFromMemo(memo: { title: string; body: string }): PodcastScript {
  const body = memo.body.trim();
  if (!body) throw new Error("Podcast memo is empty");
  const excerpt = body.length > 400 ? `${body.slice(0, 400)}…` : body;
  return {
    title: memo.title,
    speakers: 2,
    lines: [
      {
        speaker: "A",
        text: `${NICO_HOST_A} Today we walk through ${memo.title}.`,
      },
      { speaker: "B", text: excerpt },
      {
        speaker: "A",
        text: "That's the memo. Figures that are not in the source stay off this script.",
      },
    ],
  };
}

const NICO_HOST_A = "I'm Nico, Tamarindo's AI consultant.";
