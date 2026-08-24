"use client";

import { useEffect, useState } from "react";

export function NdaCard({ onSigned }: { onSigned: () => void }) {
  const [body, setBody] = useState("");
  const [hash, setHash] = useState("");
  const [typedName, setTypedName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/nico/nda")
      .then((res) => res.json())
      .then((json: { ok?: boolean; data?: { body: string; documentHash: string }; error?: { message: string } }) => {
        if (json.ok && json.data) {
          setBody(json.data.body);
          setHash(json.data.documentHash);
        } else {
          setError(json.error?.message ?? "Could not load the NDA");
        }
      });
  }, []);

  async function sign() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/nico/nda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typedName,
        accepted: true,
        documentHash: hash,
        ipAddress: "browser",
        userAgent: navigator.userAgent.slice(0, 400),
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Sign failed");
      return;
    }
    onSigned();
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/60 p-5">
      <h2 className="text-sm font-semibold">NDA — click-wrap</h2>
      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
        {body || "Loading template…"}
      </pre>
      <label className="mt-3 block text-xs text-muted-foreground">
        Type your full legal name
        <input
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        />
      </label>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        I agree to this NDA
      </label>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <button
        type="button"
        disabled={busy || !accepted || typedName.trim().length < 2}
        onClick={() => void sign()}
        className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-40"
      >
        Sign NDA
      </button>
    </section>
  );
}
