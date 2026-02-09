"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ExamResultSummary = {
  title: string;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percent: number;
  submittedAt: string;
};

export default function ExamRunnerResultsPage() {
  const [summary, setSummary] = useState<ExamResultSummary | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("examRunnerResult");
    if (!stored) {
      setSummary(null);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ExamResultSummary;
      setSummary(parsed);
    } catch {
      setSummary(null);
    }
  }, []);

  if (!summary) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Result Summary</h1>
        <p className="text-sm text-slate-600">
          No exam results were found in this session. Start an exam to generate a
          summary.
        </p>
        <Link
          href="/exam-runner"
          className="w-fit rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Go to Exam Runner
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Result Summary</h1>
        <p className="text-sm text-slate-600">{summary.title}</p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-sand-300 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-sm uppercase tracking-wide text-slate-500">Score</p>
          <p className="text-3xl font-semibold text-slate-900">{summary.percent}%</p>
        </div>
        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-sand px-4 py-3">
            <span>Total questions</span>
            <span className="font-semibold text-slate-900">{summary.total}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-sand px-4 py-3">
            <span>Answered</span>
            <span className="font-semibold text-slate-900">{summary.answered}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-sand px-4 py-3">
            <span>Correct</span>
            <span className="font-semibold text-emerald-700">{summary.correct}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-sand px-4 py-3">
            <span>Incorrect</span>
            <span className="font-semibold text-rose-700">{summary.incorrect}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-sand px-4 py-3">
            <span>Skipped</span>
            <span className="font-semibold text-slate-900">{summary.skipped}</span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/exam-runner"
          className="rounded-full border border-sand-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Back to Exam Runner
        </Link>
        <button
          type="button"
          onClick={() => window.sessionStorage.removeItem("examRunnerResult")}
          className="rounded-full border border-sand-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Clear Result
        </button>
      </div>
    </div>
  );
}
