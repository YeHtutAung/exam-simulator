"use client";

import type { ChangeEvent } from "react";

type Choice = {
  label: "a" | "b" | "c" | "d";
  text: string;
};

type QuestionMCQInlineProps = {
  questionId: string;
  stem: string;
  choices: Choice[];
  selected?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function QuestionMCQInline({
  questionId,
  stem,
  choices,
  selected,
  onChange,
  disabled = false,
}: QuestionMCQInlineProps) {
  const groupName = `mcq-${questionId}`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line text-base leading-relaxed text-slate-800">{stem}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
        {choices.map((choice) => {
          const inputId = `${groupName}-${choice.label}`;
          return (
            <label
              key={choice.label}
              htmlFor={inputId}
              className={`inline-flex items-center gap-2 ${
                disabled ? "cursor-not-allowed text-slate-400" : "cursor-pointer"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={choice.label}
                checked={selected === choice.label}
                onChange={handleChange}
                disabled={disabled}
                className="h-4 w-4 accent-teal-700"
              />
              <span className="whitespace-nowrap">{choice.label})</span>
              <span className="whitespace-nowrap">{choice.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
