type Props = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { delta: number; label: string } | null;
};

export default function MetricCard({ label, value, icon, trend }: Props) {
  return (
    <div className="rounded-2xl border border-sand-300 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-100 text-slate-500">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {trend && trend.delta !== 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            className={trend.delta > 0 ? "text-emerald-600" : "text-rose-500"}
          >
            <polygon
              points={trend.delta > 0 ? "5,1 9,8 1,8" : "5,9 1,2 9,2"}
              fill="currentColor"
            />
          </svg>
          <span className={trend.delta > 0 ? "text-emerald-600" : "text-rose-500"}>
            {trend.delta > 0 ? "+" : ""}
            {trend.delta}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
