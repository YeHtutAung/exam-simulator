"use client";

import { useEffect, useRef } from "react";

type Choice = {
  label: "a" | "b" | "c" | "d";
  text: string;
};

type ExamRunnerQuestionProps = {
  questionId: string;
  stem: string;
  stemImageUrl?: string | null;
  choices: Choice[];
  selected?: string;
  onChange: (value: string) => void;
};

export function ExamRunnerQuestion({
  questionId,
  stem,
  stemImageUrl,
  choices,
  selected,
  onChange,
}: ExamRunnerQuestionProps) {
  const groupName = `exam-runner-${questionId}`;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [questionId]);

  return (
    <div className="flex h-full flex-col gap-4 exam-runner-question">
      <div
        ref={panelRef}
        tabIndex={0}
        aria-label="Question content"
        className="exam-runner-panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-sand-300 bg-white px-6 py-6"
      >
        {stemImageUrl ? (
          <img
            src={stemImageUrl}
            alt="Question"
            className="block h-auto max-w-full"
          />
        ) : (
          <p className="text-lg leading-relaxed text-slate-900">{stem}</p>
        )}
      </div>
      <div className="shrink-0 grid grid-cols-4 gap-2">
        {choices.map((choice) => {
          const inputId = `${groupName}-${choice.label}`;
          const isSelected = selected === choice.label;
          return (
            <label
              key={choice.label}
              htmlFor={inputId}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${
                isSelected
                  ? "border-accent bg-accent/10 text-accent font-semibold"
                  : "border-sand-200 bg-white text-slate-800 hover:border-sand-300 hover:bg-sand-50"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={choice.label}
                checked={isSelected}
                onChange={(event) => onChange(event.target.value)}
                className="h-4 w-4 accent-teal-700"
              />
              <span className="text-xs font-semibold uppercase text-slate-500">
                {choice.label}
              </span>
              {!stemImageUrl && <span className="truncate">{choice.text}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
