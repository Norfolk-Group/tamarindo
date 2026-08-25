"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSpec } from "@/lib/nico/chat-rich-parse";

const TEAL = "#23a5b4";
const INK = "#93a8a5";
const GOLD = "#ffc94d";
const PALETTE = [TEAL, GOLD, "#7dd3d8", "#20808d", "#c4b5a0"];

export function ChatChart({ spec }: { spec: ChartSpec }) {
  const series = spec.series?.length
    ? spec.series
    : [{ name: spec.unit ?? "value", values: spec.values }];
  const rows = spec.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const s of series) row[s.name] = s.values[i] ?? 0;
    return row;
  });
  const type = spec.type ?? "bar";

  return (
    <figure className="nico-rich-enter rounded-lg border border-border p-3">
      {spec.title ? (
        <figcaption className="mb-2 font-mono text-xs text-muted-foreground">
          {spec.title}
          {spec.unit ? ` (${spec.unit})` : ""}
        </figcaption>
      ) : null}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={rows}
                dataKey={series[0]?.name ?? "value"}
                nameKey="label"
                innerRadius={42}
                outerRadius={78}
                stroke="none"
              >
                {rows.map((_, i) => (
                  <Cell key={spec.labels[i]} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0b1717",
                  border: "1px solid rgba(242,247,246,0.08)",
                }}
              />
            </PieChart>
          ) : type === "line" ? (
            <LineChart data={rows}>
              <Axes />
              {series.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              <Tooltip
                contentStyle={{
                  background: "#0b1717",
                  border: "1px solid rgba(242,247,246,0.08)",
                }}
              />
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={rows}>
              <Axes />
              {series.map((s, i) => (
                <Area
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.18}
                />
              ))}
              <Tooltip
                contentStyle={{
                  background: "#0b1717",
                  border: "1px solid rgba(242,247,246,0.08)",
                }}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={rows}
              layout={type === "hbar" ? "vertical" : "horizontal"}
            >
              <Axes horizontal={type === "hbar"} />
              {series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={PALETTE[i % PALETTE.length]}
                  radius={3}
                />
              ))}
              <Tooltip
                contentStyle={{
                  background: "#0b1717",
                  border: "1px solid rgba(242,247,246,0.08)",
                }}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function Axes({ horizontal = false }: { horizontal?: boolean }) {
  const tick = { fill: INK, fontSize: 11, fontFamily: "var(--font-geist-mono)" };
  return (
    <>
      <CartesianGrid stroke="rgba(242,247,246,0.06)" vertical={!horizontal} />
      {horizontal ? (
        <>
          <XAxis type="number" tick={tick} stroke="transparent" />
          <YAxis type="category" dataKey="label" tick={tick} stroke="transparent" width={88} />
        </>
      ) : (
        <>
          <XAxis dataKey="label" tick={tick} stroke="transparent" />
          <YAxis tick={tick} stroke="transparent" width={36} />
        </>
      )}
    </>
  );
}
