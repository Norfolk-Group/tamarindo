"use client";

import { useMemo, useState } from "react";
import { InfoTip } from "@/components/nico/info-tip";
import { Input } from "@/components/ui/input";
import { HELP_FAMILIES, helpTopic, searchHelp } from "@/lib/nico/help-catalog";

export function HelpWorkspace() {
  const [query, setQuery] = useState("");
  const topics = useMemo(() => searchHelp(query), [query]);
  const families = HELP_FAMILIES.filter((family) =>
    topics.some((row) => row.family === family.id),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
          HELP
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
          How this app works
          <InfoTip topic="nav.help" />
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hover any (i) for the short version. This page is the same catalog
          Nico uses when you ask “how do I…”. Nothing here changes the live
          model.
        </p>
        <Input
          className="mt-4"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search help — ICP, residual, Save as, PDF…"
          aria-label="Search help"
        />
      </div>
      {families.length === 0 ? (
        <p className="text-sm text-muted-foreground">No topics match that.</p>
      ) : (
        families.map((family) => (
          <section key={family.id} className="space-y-3">
            <h3 className="text-sm font-semibold">{family.title}</h3>
            <ul className="space-y-3">
              {topics
                .filter((row) => row.family === family.id)
                .map((row) => (
                  <HelpArticle key={row.id} id={row.id} />
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function HelpArticle({ id }: { id: string }) {
  const topic = helpTopic(id);
  if (!topic) return null;
  return (
    <li className="rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold">{topic.title}</h4>
        <InfoTip topic={topic.id} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{topic.body}</p>
    </li>
  );
}
