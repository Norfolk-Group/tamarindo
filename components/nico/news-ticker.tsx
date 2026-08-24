"use client";

import { useEffect, useState } from "react";

type Item = {
  title: string;
  url: string;
  source: string;
  kind: "live" | "cited";
};

export function NewsTicker() {
  const [items, setItems] = useState<Item[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/nico/ticker");
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { items: Item[]; live: boolean };
      };
      if (cancelled || !json.ok || !json.data) return;
      setItems(json.data.items);
      setLive(json.data.live);
    }
    void load();
    const id = window.setInterval(() => void load(), 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="flex h-8 shrink-0 items-center gap-3 border-b border-border bg-[var(--navy,#1E2D45)] text-[11px] text-[#F4EFE4]">
      <span className="shrink-0 px-3 font-mono tracking-[0.16em] text-[#FFC107]">
        {live ? "LIVE" : "WATCH"}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="nico-ticker-track flex w-max gap-10">
          {loop.map((item, index) => (
            <a
              key={`${item.url}-${index}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 font-mono text-[#F4EFE4] underline-offset-2 hover:underline"
            >
              <span className="text-[#00BCD4]">{item.source}</span>
              {"  ·  "}
              {item.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
