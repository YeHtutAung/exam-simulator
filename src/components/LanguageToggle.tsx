"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const localeLabels: Record<string, string> = {
  en: "EN",
  my: "MY",
};

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("header");

  const setLocale = (nextLocale: string) => {
    if (nextLocale === locale) return;
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  const nextLocale = locale === "en" ? "my" : "en";
  const currentLabel = localeLabels[locale] ?? locale.toUpperCase();
  const nextLabel = localeLabels[nextLocale] ?? nextLocale.toUpperCase();
  const tooltip =
    locale === "en" ? "Switch to Myanmar" : "Switch to English";
  const ariaLabel =
    locale === "en"
      ? "Switch to Myanmar language"
      : "Switch to English language";

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      aria-label={ariaLabel}
      title={`${tooltip} (${nextLabel})`}
      disabled={isPending}
      className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      <span className="sr-only">{t("languageLabel")}</span>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 bg-white text-[11px] font-semibold text-slate-700 transition-colors group-hover:bg-sand-100 group-hover:text-slate-900">
        {currentLabel}
      </span>
    </button>
  );
}
