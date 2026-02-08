"use client";

import { useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  fallbackHref: string;
  showBack?: boolean;
};

export function PageHeader({ title, fallbackHref, showBack = true }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
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
    <div className="flex flex-wrap items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          className="min-h-11 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back
        </button>
      )}
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">
          Owner Portal
        </p>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
    </div>
  );
}
