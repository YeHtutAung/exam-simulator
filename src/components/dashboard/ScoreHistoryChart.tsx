"use client";

import { useState } from "react";

type Attempt = {
  id: string;
  score: number | null;
  label: string;
};

type Props = {
  attempts: Attempt[];
  noDataLabel: string;
};

const CHART_HEIGHT = 160;
const BAR_WIDTH = 36;
const GAP = 12;
const TOP_PAD = 24;
const BOTTOM_PAD = 20;
const GRID_LINES = [25, 50, 75, 100];

export default function ScoreHistoryChart({ attempts, noDataLabel }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (attempts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        {noDataLabel}
      </div>
    );
  }

  const chartWidth = attempts.length * (BAR_WIDTH + GAP) + GAP;
  const barArea = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
      className="w-full"
      style={{ maxHeight: CHART_HEIGHT }}
    >
      {/* Gridlines */}
      {GRID_LINES.map((v) => {
        const y = TOP_PAD + barArea - (barArea * v) / 100;
        return (
          <line
            key={v}
            x1={0}
            x2={chartWidth}
            y1={y}
            y2={y}
            stroke="var(--sand-300)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Bars */}
      {attempts.map((attempt, i) => {
        const score = attempt.score ?? 0;
        const barHeight = (barArea * score) / 100;
        const x = GAP + i * (BAR_WIDTH + GAP);
        const y = TOP_PAD + barArea - barHeight;
        const isHovered = hoveredIndex === i;
        const fillColor = score >= 60 ? "var(--accent)" : "#f59e0b";

        return (
          <g
            key={attempt.id}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-default"
          >
            {/* Invisible hit area */}
            <rect
              x={x}
              y={TOP_PAD}
              width={BAR_WIDTH}
              height={barArea}
              fill="transparent"
            />
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={barHeight}
              rx={4}
              fill={fillColor}
              opacity={isHovered ? 1 : 0.8}
            />
            {/* Hover label */}
            {isHovered && (
              <text
                x={x + BAR_WIDTH / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--ink)"
              >
                {score}%
              </text>
            )}
            {/* Bottom label */}
            <text
              x={x + BAR_WIDTH / 2}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink)"
              opacity={0.5}
            >
              {attempt.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
