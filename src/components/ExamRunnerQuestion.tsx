"use client";

type Choice = {
  label: "a" | "b" | "c" | "d";
  text: string;
};

type ExamRunnerQuestionProps = {
  questionId: string;
  stem: string;
  choices: Choice[];
  selected?: string;
  onChange: (value: string) => void;
};

export function ExamRunnerQuestion({
  questionId,
  stem,
  choices,
  selected,
  onChange,
}: ExamRunnerQuestionProps) {
  const groupName = `exam-runner-${questionId}`;

  return (
    <div className="space-y-6">
      <p className="text-lg leading-relaxed text-slate-900">{stem}</p>
      <div className="divide-y divide-sand-300 border border-sand-300 bg-white">
        {choices.map((choice) => {
          const inputId = `${groupName}-${choice.label}`;
          return (
            <label
              key={choice.label}
              htmlFor={inputId}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-800"
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={choice.label}
                checked={selected === choice.label}
                onChange={(event) => onChange(event.target.value)}
                className="h-4 w-4 accent-teal-700"
              />
              <span className="text-xs font-semibold uppercase text-slate-500">
                {choice.label})
              </span>
              <span>{choice.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
