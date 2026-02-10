"use client";

import { useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  fallbackHref: string;
  showBack?: boolean;
  eyebrow?: string;
  useDirectNavigation?: boolean;
};

export function PageHeader({
  title,
  fallbackHref,
  showBack = true,
  eyebrow,
  useDirectNavigation = false,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (useDirectNavigation) {
      router.push(fallbackHref);
      return;
    }
    if (typeof window === "undefined") {
      router.push(fallbackHref);
      return;
    }
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          {"\u2190"} Back
        </button>
      )}
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold uppercase text-slate-500">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
    </div>
  );
}
