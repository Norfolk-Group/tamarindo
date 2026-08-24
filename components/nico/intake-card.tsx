"use client";

import { useState } from "react";

export function IntakeCard({
  initialName,
  onDone,
}: {
  initialName: string;
  onDone: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialName);
  const [org, setOrg] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const update = await fetch("/api/nico/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, org, bio }),
    });
    const updateJson = (await update.json()) as {
      ok?: boolean;
      error?: { message: string };
    };
    if (!updateJson.ok) {
      setBusy(false);
      setError(updateJson.error?.message ?? "Could not save intake");
      return;
    }
    const confirm = await fetch("/api/nico/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirmBio" }),
    });
    const confirmJson = (await confirm.json()) as {
      ok?: boolean;
      error?: { message: string };
    };
    setBusy(false);
    if (!confirmJson.ok) {
      setError(confirmJson.error?.message ?? "Could not confirm bio");
      return;
    }
    onDone();
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/60 p-5">
      <h2 className="text-sm font-semibold">Intake interview</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Name, organization, and a short bio. Confirming the bio does not sign
        the NDA.
      </p>
      <label className="mt-3 block text-xs text-muted-foreground">
        Display name
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        />
      </label>
      <label className="mt-3 block text-xs text-muted-foreground">
        Organization
        <input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        />
      </label>
      <label className="mt-3 block text-xs text-muted-foreground">
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        />
      </label>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <button
        type="button"
        disabled={busy || displayName.trim().length < 1 || org.trim().length < 1 || bio.trim().length < 1}
        onClick={() => void submit()}
        className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-40"
      >
        Confirm bio
      </button>
    </section>
  );
}
