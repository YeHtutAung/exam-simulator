"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ResultQuestion = {
  id: string;
  questionNo: number;
  correctAnswer: "a" | "b" | "c" | "d";
};

type StoredRun = {
  startedAt: string;
  durationSeconds: number;
  answers: Record<string, "a" | "b" | "c" | "d" | null>;
  submittedAt?: string;
  timeUp?: boolean;
};

type ExamRunnerResultsProps = {
  examId: string;
  title: string;
  questions: ResultQuestion[];
};

const answerLabel = (value?: string | null) => (value ? value.toUpperCase() : "—");

export function ExamRunnerResults({ examId, title, questions }: ExamRunnerResultsProps) {
  const [runData, setRunData] = useState<StoredRun | null>(null);
  const storageKey = `examRunner:${examId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRaw = window.localStorage.getItem(storageKey);
    if (!storedRaw) return;
    try {
      const parsed = JSON.parse(storedRaw) as StoredRun;
      setRunData(parsed);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const summary = useMemo(() => {
    if (!runData) return null;
    const answered = questions.filter((question) => runData.answers?.[question.id]).length;
    const unanswered = questions.length - answered;
    const correct = questions.filter((question) => {
      const answer = runData.answers?.[question.id];
      return answer && answer === question.correctAnswer;
    }).length;
    return { answered, unanswered, correct };
  }, [questions, runData]);

  if (!runData) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600">No results found for this run.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-sand-300 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{title} · Results</h1>
          {runData.timeUp && (
            <span className="rounded-full border border-sand-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Time is up
            </span>
          )}
        </div>
        {summary && (
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <span>Total: {questions.length}</span>
            <span>Answered: {summary.answered}</span>
            <span>Unanswered: {summary.unanswered}</span>
            <span>
              Score: {summary.correct} / {questions.length}
            </span>
          </div>
        )}
      </header>

      <div className="overflow-x-auto rounded-2xl border border-sand-300 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-sand">
            <tr className="text-slate-600">
              <th className="px-4 py-3 font-semibold">Question</th>
              <th className="px-4 py-3 font-semibold">Your Answer</th>
              <th className="px-4 py-3 font-semibold">Correct Answer</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => {
              const userAnswer = runData.answers?.[question.id] ?? null;
              const isUnanswered = !userAnswer;
              const isCorrect = userAnswer === question.correctAnswer;
              const status = isUnanswered ? "Unanswered" : isCorrect ? "Correct" : "Wrong";
              return (
                <tr
                  key={question.id}
                  className="border-t border-sand-200 hover:bg-sand/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/questions/${question.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      Q{question.questionNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{answerLabel(userAnswer)}</td>
                  <td className="px-4 py-3">{answerLabel(question.correctAnswer)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        status === "Correct"
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "Wrong"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
