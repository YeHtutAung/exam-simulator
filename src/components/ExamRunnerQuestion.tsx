"use client";

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

  return (
    <div className="space-y-6">
      {stemImageUrl ? (
        <img
          src={stemImageUrl}
          alt="Question"
          className="w-full rounded-2xl border border-sand-300"
        />
      ) : (
        <p className="text-lg leading-relaxed text-slate-900">{stem}</p>
      )}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-sand-300 bg-white p-3">
        {choices.map((choice) => {
          const inputId = `${groupName}-${choice.label}`;
          return (
            <label
              key={choice.label}
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-3 rounded-full border border-sand-200 px-4 py-2 text-sm text-slate-800"
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
              {!stemImageUrl && <span>{choice.text}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
