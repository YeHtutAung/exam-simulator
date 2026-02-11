"use client";

import { useEffect, useState } from "react";

type Topic = { label: string; value: number };
type Props = { topics: Topic[] };

const VIEW = 300;
const CX = VIEW / 2;
const CY = VIEW / 2;
const MAX_R = 80;
const LABEL_GAP = 12;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

function polarToXY(cx: number, cy: number, angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function polygonPoints(n: number, radius: number) {
  const step = 360 / n;
  return Array.from({ length: n }, (_, i) => {
    const { x, y } = polarToXY(CX, CY, i * step, radius);
    return `${x},${y}`;
  }).join(" ");
}

export default function TopicRadarChart({ topics }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const n = topics.length;
  if (n < 3) return null;

  const step = 360 / n;

  const dataVertices = topics.map((t, i) => {
    const r = (MAX_R * (mounted ? t.value : 0)) / 100;
    return polarToXY(CX, CY, i * step, r);
  });
  const dataPoints = dataVertices.map((v) => `${v.x},${v.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full" role="img">
      {/* Grid polygons */}
      {GRID_LEVELS.map((level) => (
        <polygon
          key={level}
          points={polygonPoints(n, MAX_R * level)}
          fill="none"
          stroke="var(--sand-300)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {topics.map((_, i) => {
        const { x, y } = polarToXY(CX, CY, i * step, MAX_R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="var(--sand-300)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data area */}
      <polygon
        points={dataPoints}
        fill="var(--accent)"
        fillOpacity="0.2"
        stroke="var(--accent)"
        strokeWidth="1.5"
        className="transition-all duration-700 ease-out"
      />

      {/* Vertex dots with hover tooltips */}
      {dataVertices.map((v, i) => (
        <circle
          key={i}
          cx={v.x}
          cy={v.y}
          r="4"
          fill="var(--accent)"
          className="transition-all duration-700 ease-out"
        >
          <title>{`${topics[i].label}: ${topics[i].value}%`}</title>
        </circle>
      ))}

      {/* Labels around perimeter */}
      {topics.map((t, i) => {
        const angle = i * step;
        const { x, y } = polarToXY(CX, CY, angle, MAX_R + LABEL_GAP);

        // Normalize angle to 0-360
        const a = ((angle % 360) + 360) % 360;

        // Determine text-anchor based on which side of the chart
        let anchor: "start" | "middle" | "end";
        if (a < 5 || a > 355) anchor = "middle";        // top
        else if (a > 175 && a < 185) anchor = "middle";  // bottom
        else if (a >= 5 && a <= 175) anchor = "start";    // right half
        else anchor = "end";                               // left half

        // Vertical nudge: push top labels up, bottom labels down
        let dy = 0;
        if (a < 30 || a > 330) dy = -4;
        else if (a > 150 && a < 210) dy = 8;

        const display = t.label.length > 16 ? t.label.slice(0, 15) + "…" : t.label;

        return (
          <text
            key={i}
            x={x}
            y={y + dy}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-slate-600 text-[11px] font-medium"
          >
            {display}
          </text>
        );
      })}
    </svg>
  );
}
