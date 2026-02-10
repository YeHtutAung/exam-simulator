import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export default function EmptyDashboard({ title, subtitle, ctaLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-sand-300 bg-white px-6 py-16 text-center">
      {/* Clipboard illustration */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="mb-6 text-slate-300"
      >
        <rect x="14" y="8" width="36" height="48" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <rect x="24" y="4" width="16" height="8" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <line x1="22" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="40" x2="34" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <Link
        href="/search"
        className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
