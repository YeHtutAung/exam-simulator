"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import Link from "next/link";

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
}: {
  onPrimaryCta: () => void;
}) {
  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div className="space-y-5">
          <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Focused practice
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
            Pass the FE exam with focused practice.
          </h1>
          <p className="max-w-xl text-sm text-slate-600 md:text-base">
            Search real past questions and practice by topic.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPrimaryCta}
              className="rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
            >
              Start practicing
            </button>
            <span className="text-xs text-slate-500">
              Instant access to past questions
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-[#F7F6F2] p-4">
          <HeroIllustration />
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
            Search questions
          </label>
          <input
            id="home-search-input"
            ref={inputRef}
            name="query"
            placeholder="Search questions by keyword or topic…"
            className="min-w-[220px] flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 md:text-base"
            aria-label="Search questions by keyword or topic"
          />
          <button
            type="submit"
            className="rounded-full bg-[#1F2937] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
          >
            Search
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>Try: TCP/IP, データベース, OS</span>
          <div className="flex items-center gap-2">
            <label htmlFor="exam-select" className="text-xs font-semibold text-slate-500">
              Exam
            </label>
            <select
              id="exam-select"
              name="examId"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            >
              <option value="">All exams</option>
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
  const items = [
    {
      title: "Random 10 questions",
      description: "Warm up with a short mixed set.",
      href: "/search?mode=random&limit=10",
      accent: "#4F7DFF",
      soft: "rgba(79, 125, 255, 0.16)",
    },
    {
      title: "Latest exam questions",
      description: "Jump into the newest uploaded exam.",
      href: "/search?sort=latest",
      accent: "#2BB673",
      soft: "rgba(43, 182, 115, 0.16)",
    },
    {
      title: "Practice by topic",
      description: "Focus on a specific subject area.",
      href: "/search",
      accent: "#7B61FF",
      soft: "rgba(123, 97, 255, 0.16)",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Practice now</p>
        <p className="text-xs text-slate-500">
          Shortcuts to help you start immediately.
        </p>
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
              Start →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExamsGrid({ exams }: { exams: ExamSummary[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Exams</h2>
        <Link href="/search" className="text-xs font-semibold text-slate-700">
          Browse all questions
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
                  Start
                </span>
              </div>
            </Link>
          );
        })}
        {exams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No exams yet. Add one in the admin dashboard.
          </div>
        )}
      </div>
    </section>
  );
}

export function HomePageClient({ exams }: HomePageClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSectionRef = useRef<HTMLElement>(null);

  const handlePrimaryCta = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1F2937]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-12 md:px-8">
        <HeroSection onPrimaryCta={handlePrimaryCta} />
        <div ref={searchSectionRef}>
          <CommandSearch exams={exams} inputRef={inputRef} />
        </div>
        <QuickStart />
        <ExamsGrid exams={exams} />
      </div>
    </div>
  );
}
