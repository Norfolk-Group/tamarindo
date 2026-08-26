"use client";

import { useEffect, useState } from "react";
import { HelpWorkspace } from "@/components/nico/help-workspace";
import { ModelWorkspace } from "@/components/nico/model-workspace";
import { VariablesWorkspace } from "@/components/nico/variables-workspace";
import {
  ArtifactsPanel,
  DataRoomPanel,
} from "@/components/nico/workspace-panels";
import type { PrimaryColumnId } from "@/lib/nico/rail-columns";

export function PrimaryWorkspace({ id }: { id: PrimaryColumnId }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {id === "model" && <ModelWorkspace />}
      {id === "variables" && <VariablesWorkspace scope="user" />}
      {id === "artifacts" && <ArtifactsWorkspace />}
      {id === "dataroom" && <DataRoomWorkspace />}
      {id === "help" && <HelpWorkspace />}
    </div>
  );
}

function ArtifactsWorkspace() {
  const [rows, setRows] = useState<
    { id: string; kind: string; title: string; createdAt: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/nico/artifacts");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { artifacts?: { id: string; kind: string; title: string; createdAt: string }[] };
      error?: { message: string };
    };
    if (!json.ok) {
      setError(json.error?.message ?? "Could not load artifacts");
      return;
    }
    setError(null);
    setRows(json.data?.artifacts ?? []);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, []);

  return <ArtifactsPanel rows={rows} error={error} onRefresh={() => void load()} />;
}

function DataRoomWorkspace() {
  const [rows, setRows] = useState<
    {
      id: string;
      title: string;
      mimeType: string;
      confidential: boolean;
      published: boolean;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/nico/dataroom");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: {
        documents?: {
          id: string;
          title: string;
          mimeType: string;
          confidential: boolean;
          published: boolean;
        }[];
      };
      error?: { message: string };
    };
    if (!json.ok) {
      setError(json.error?.message ?? "Could not load data room");
      return;
    }
    setError(null);
    setRows(json.data?.documents ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  return <DataRoomPanel rows={rows} error={error} onRefresh={() => void load()} />;
}
