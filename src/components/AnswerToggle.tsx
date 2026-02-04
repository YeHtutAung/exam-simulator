"use client";

import { useState } from "react";

type AnswerToggleProps = {
  correctAnswer: string;
};

export function AnswerToggle({ correctAnswer }: AnswerToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mt-6 rounded-2xl border border-sand-300 bg-white p-4">
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="text-sm font-medium text-accent hover:text-slate-900"
      >
        {visible ? "Hide correct answer" : "Reveal correct answer"}
      </button>
      {visible && (
        <p className="mt-3 text-sm text-slate-700">
          Correct answer: <span className="font-semibold">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
}
