"use client";

import { useEffect, useState } from "react";
import { ModelWorkspace } from "@/components/nico/model-workspace";
import { SecondLevelRail } from "@/components/nico/second-level-rail";
import { VariablesWorkspace } from "@/components/nico/variables-workspace";
import {
  ArtifactsPanel,
  DataRoomPanel,
} from "@/components/nico/workspace-panels";
import type { PrimaryColumnId } from "@/lib/nico/rail-columns";

const COLUMN_META: Record<
  PrimaryColumnId,
  { title: string; label: string; widthClass: string }
> = {
  model: { title: "STATEMENTS", label: "Statements", widthClass: "w-[40rem]" },
  variables: {
    title: "ASSUMPTIONS",
    label: "Assumptions",
    widthClass: "w-[28rem]",
  },
  artifacts: { title: "ARTIFACTS", label: "Artifacts", widthClass: "w-96" },
  dataroom: { title: "DATA ROOM", label: "Data Room", widthClass: "w-96" },
};

export function PrimaryColumn({
  id,
  onHome,
}: {
  id: PrimaryColumnId;
  onHome: () => void;
}) {
  const meta = COLUMN_META[id];
  return (
    <SecondLevelRail
      title={meta.title}
      label={meta.label}
      widthClass={meta.widthClass}
      onHome={onHome}
    >
      {id === "model" && <ModelWorkspace />}
      {id === "variables" && <VariablesWorkspace scope="user" />}
      {id === "artifacts" && <ArtifactsColumn />}
      {id === "dataroom" && <DataRoomColumn />}
    </SecondLevelRail>
  );
}

function ArtifactsColumn() {
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

function DataRoomColumn() {
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
