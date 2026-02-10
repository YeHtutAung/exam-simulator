"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number; // 0–100
  label: string;
};

const SIZE = 120;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AccuracyRing({ value, label }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay so the CSS transition triggers on mount
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * (mounted ? value : 0)) / 100;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="dashboard-ring -rotate-90"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--sand-300)"
          strokeWidth={STROKE}
        />
        {/* Arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="dashboard-ring-arc"
        />
      </svg>
      <div className="relative -mt-[78px] flex flex-col items-center justify-center" style={{ height: 78 }}>
        <span className="text-2xl font-bold">{value}%</span>
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
    </div>
  );
}
