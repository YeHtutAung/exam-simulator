"use client";

import { useMemo, useState } from "react";
import { ExamRunnerQuestion } from "@/components/ExamRunnerQuestion";

type Choice = {
  label: "a" | "b" | "c" | "d";
  text: string;
};

type Question = {
  id: string;
  stem: string;
  choices: Choice[];
};

type ExamRunnerProps = {
  title: string;
  questions: Question[];
};

export function ExamRunner({ title, questions }: ExamRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const total = questions.length;
  const currentNumber = currentIndex + 1;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col">
      <header className="space-y-1 border-b border-sand-300 pb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600">
          Question {currentNumber} of {total}
        </p>
      </header>

      <section className="flex-1 py-8">
        <ExamRunnerQuestion
          questionId={currentQuestion.id}
          stem={currentQuestion.stem}
          choices={currentQuestion.choices}
          selected={answers[currentQuestion.id]}
          onChange={handleSelect}
        />
      </section>

      <nav className="sticky bottom-0 border-t border-sand-300 bg-sand py-4">
        <div className="flex items-center justify-between">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="rounded-full border border-sand-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {canGoNext ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Next
            </button>
          ) : (
            <span />
          )}
        </div>
      </nav>
    </div>
  );
}
