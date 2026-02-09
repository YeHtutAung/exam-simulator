"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ExamSummary = {
  id: string;
  title: string;
  session: string;
  paper: string;
  language: string;
  createdAt: Date;
};

type HomePageClientProps = {
  exams: ExamSummary[];
  isAuthenticated: boolean;
};

function languageBadgeLabel(language: string) {
  const normalized = language.trim().toLowerCase();
  if (normalized.includes("ja") || normalized.includes("jap")) return "JA";
  if (normalized.includes("en") || normalized.includes("eng")) return "EN";
  return language.slice(0, 2).toUpperCase();
}

function seasonTone(session: string) {
  const normalized = session.toLowerCase();
  if (normalized.includes("spring")) return "spring";
  if (normalized.includes("summer")) return "summer";
  if (normalized.includes("autumn") || normalized.includes("fall")) return "autumn";
  if (normalized.includes("winter")) return "winter";
  return "autumn";
}

const seasonColors = {
  spring: { accent: "#2BB673", soft: "rgba(43, 182, 115, 0.18)" },
  summer: { accent: "#F5A623", soft: "rgba(245, 166, 35, 0.18)" },
  autumn: { accent: "#4F7DFF", soft: "rgba(79, 125, 255, 0.18)" },
  winter: { accent: "#7B61FF", soft: "rgba(123, 97, 255, 0.18)" },
};

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="Focused practice illustration"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="hero-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EEF0FF" />
          <stop offset="100%" stopColor="#F7EDE2" />
        </linearGradient>
        <linearGradient id="hero-accent" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7B61FF" />
          <stop offset="100%" stopColor="#4F7DFF" />
        </linearGradient>
      </defs>
      <rect x="24" y="24" width="472" height="372" rx="32" fill="url(#hero-gradient)" />
      <rect x="70" y="78" width="210" height="40" rx="12" fill="#fff" />
      <rect x="70" y="140" width="260" height="140" rx="18" fill="#fff" />
      <rect x="90" y="165" width="170" height="12" rx="6" fill="#DDE3F8" />
      <rect x="90" y="190" width="130" height="12" rx="6" fill="#E8DBF7" />
      <rect x="90" y="215" width="190" height="12" rx="6" fill="#DDE3F8" />
      <rect x="70" y="298" width="160" height="32" rx="16" fill="url(#hero-accent)" />
      <circle cx="360" cy="160" r="68" fill="#fff" />
      <circle cx="360" cy="160" r="44" fill="#7B61FF" opacity="0.15" />
      <rect x="312" y="260" width="140" height="88" rx="20" fill="#fff" />
      <rect x="330" y="286" width="104" height="10" rx="5" fill="#E3E7FB" />
      <rect x="330" y="308" width="76" height="10" rx="5" fill="#E3E7FB" />
    </svg>
  );
}

function HeroSection({
  onPrimaryCta,
  onSecondaryCta,
  isAuthenticated,
}: {
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("home");
  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div className="space-y-5">
          <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {t("hero.label")}
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-sm text-slate-600 md:text-base">
            {t("hero.subtitle")}
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1F2937]" />
              {t("hero.bullet1")}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1F2937]" />
              {t("hero.bullet2")}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1F2937]" />
              {t("hero.bullet3")}
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPrimaryCta}
              className="rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
            >
              {t("hero.ctaPrimary")}
            </button>
            <button
              type="button"
              onClick={onSecondaryCta}
              className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
            >
              {isAuthenticated ? t("hero.ctaSecondarySignedIn") : t("hero.ctaSecondarySignedOut")}
            </button>
          </div>
          <p className="text-xs text-slate-500">{t("hero.hint")}</p>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-sand p-4">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const t = useTranslations("home");
  const cards = [
    { title: t("dashboardPreview.card1Title"), detail: t("dashboardPreview.card1Detail") },
    { title: t("dashboardPreview.card2Title"), detail: t("dashboardPreview.card2Detail") },
    { title: t("dashboardPreview.card3Title"), detail: t("dashboardPreview.card3Detail") },
  ];
  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-8 shadow-sm">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {t("dashboardPreview.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {t("dashboardPreview.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {t("dashboardPreview.subtitle")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-sand-200 bg-sand-100/60 p-4"
            >
              <div className="h-2 w-16 rounded-full bg-slate-300/60" />
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {card.title}
              </p>
              <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
              <div className="mt-4 h-16 rounded-xl bg-white/70" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommandSearch({
  exams,
  inputRef,
}: {
  exams: ExamSummary[];
  inputRef: RefObject<HTMLInputElement>;
}) {
  const t = useTranslations("home");
  return (
    <section
      id="command-search"
      className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm"
    >
      <form action="/search" method="get" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#1F2937]/10">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 text-slate-400"
          >
            <path
              d="M11 19a8 8 0 1 1 5.3-14.1A8 8 0 0 1 11 19Zm7.7 1.3-4.1-4.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <label htmlFor="home-search-input" className="sr-only">
            {t("search.label")}
          </label>
          <input
            id="home-search-input"
            ref={inputRef}
            name="query"
            placeholder={t("search.placeholder")}
            className="min-w-[220px] flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 md:text-base"
            aria-label={t("search.placeholder")}
          />
          <button
            type="submit"
            className="rounded-full bg-[#1F2937] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
          >
            {t("search.button")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>{t("search.try")}</span>
          <div className="flex items-center gap-2">
            <label htmlFor="exam-select" className="text-xs font-semibold text-slate-500">
              {t("search.examLabel")}
            </label>
            <select
              id="exam-select"
              name="examId"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            >
              <option value="">{t("search.allExams")}</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.session} {exam.paper} - {exam.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </section>
  );
}

function QuickStart() {
  const t = useTranslations("home");
  const items = [
    {
      title: t("quickStart.item1Title"),
      description: t("quickStart.item1Desc"),
      href: "/exam-runner?mode=latest",
      accent: "#4F7DFF",
      soft: "rgba(79, 125, 255, 0.16)",
    },
    {
      title: t("quickStart.item2Title"),
      description: t("quickStart.item2Desc"),
      href: "/dashboard",
      accent: "#2BB673",
      soft: "rgba(43, 182, 115, 0.16)",
    },
    {
      title: t("quickStart.item3Title"),
      description: t("quickStart.item3Desc"),
      href: "/dashboard",
      accent: "#7B61FF",
      soft: "rgba(123, 97, 255, 0.16)",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{t("quickStart.title")}</p>
        <p className="text-xs text-slate-500">{t("quickStart.subtitle")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-transparent bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${item.soft}, rgba(255,255,255,0.9))`,
              borderColor: item.accent,
            }}
          >
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-2 text-xs text-slate-500">{item.description}</p>
            <div className="mt-4 text-xs font-semibold text-slate-700">
              {t("quickStart.itemCta")}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExamsGrid({ exams }: { exams: ExamSummary[] }) {
  const t = useTranslations("home");
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t("exams.title")}</h2>
        <Link href="/search" className="text-xs font-semibold text-slate-700">
          {t("exams.browseAll")}
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {exams.map((exam) => {
          const tone = seasonTone(exam.session);
          const colors = seasonColors[tone];
          return (
            <Link
              key={exam.id}
              href={`/exams/${exam.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
            >
              <div
                className="h-2 w-full rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {exam.session} {exam.paper}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {exam.title}
                  </p>
                </div>
                {exam.language && (
                  <span
                    className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase"
                    style={{
                      borderColor: colors.accent,
                      color: colors.accent,
                      backgroundColor: colors.soft,
                    }}
                  >
                    {languageBadgeLabel(exam.language)}
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                <span>{exam.language}</span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
                  {t("exams.start")}
                </span>
              </div>
            </Link>
          );
        })}
        {exams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            {t("exams.empty")}
          </div>
        )}
      </div>
    </section>
  );
}

export function HomePageClient({ exams, isAuthenticated }: HomePageClientProps) {
  const t = useTranslations("home");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSectionRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push(isAuthenticated ? "/dashboard" : "/signin");
  };

  const handleSecondaryCta = () => {
    router.push(isAuthenticated ? "/dashboard" : "/signin");
  };

  return (
    <div className="min-h-screen bg-sand text-slate-900">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-12 md:px-8">
        <HeroSection
          onPrimaryCta={handlePrimaryCta}
          onSecondaryCta={handleSecondaryCta}
          isAuthenticated={isAuthenticated}
        />
        <DashboardPreview />
        <div ref={searchSectionRef}>
          <CommandSearch exams={exams} inputRef={inputRef} />
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-xs text-slate-600">
          {t("notice")}
        </div>
        <QuickStart />
        <ExamsGrid exams={exams} />
      </div>
    </div>
  );
}




