"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  importDraftQuestionSchema,
  ImportDraftQuestionInput,
} from "@/lib/validators/importDraftQuestion";

const TOPIC_PRESETS = [
  "Discrete Math",
  "Data Structures & Algorithms",
  "Computer Hardware",
  "Software",
  "Database",
  "Networking",
  "Security",
  "System Development",
  "Project Management",
  "Service Management",
  "Business Strategy",
  "Pseudo Code",
  "Programming",
  "Spreadsheet",
];

type ImportDraftQuestionFormProps = {
  draftId: string;
  questionId: string;
  initialValues: ImportDraftQuestionInput;
  hasStemImage?: boolean;
};

export function ImportDraftQuestionForm({
  draftId,
  questionId,
  initialValues,
  hasStemImage = false,
}: ImportDraftQuestionFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ImportDraftQuestionInput>({
    resolver: zodResolver(importDraftQuestionSchema),
    defaultValues: initialValues,
  });

  const onSubmit = async (values: ImportDraftQuestionInput) => {
    setStatus(null);
    setError(null);

    const response = await fetch(
      `/api/admin/import/${draftId}/questions/${questionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Failed to update question.");
      return;
    }

    router.push(`/admin/import/${draftId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {status && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {status}
        </p>
      )}

      {hasStemImage ? (
        <input type="hidden" {...register("stem")} />
      ) : (
        <label className="space-y-1 text-sm">
          <span className="font-medium">Stem</span>
          <textarea
            {...register("stem")}
            rows={6}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
          />
          {errors.stem && <span className="text-xs text-red-600">{errors.stem.message}</span>}
        </label>
      )}

      {hasStemImage ? (
        <div className="hidden">
          <input type="hidden" {...register("choices.a")} />
          <input type="hidden" {...register("choices.b")} />
          <input type="hidden" {...register("choices.c")} />
          <input type="hidden" {...register("choices.d")} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Choice A</span>
            <input
              {...register("choices.a")}
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            />
            {errors.choices?.a && (
              <span className="text-xs text-red-600">{errors.choices.a.message}</span>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Choice B</span>
            <input
              {...register("choices.b")}
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            />
            {errors.choices?.b && (
              <span className="text-xs text-red-600">{errors.choices.b.message}</span>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Choice C</span>
            <input
              {...register("choices.c")}
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            />
            {errors.choices?.c && (
              <span className="text-xs text-red-600">{errors.choices.c.message}</span>
            )}
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Choice D</span>
            <input
              {...register("choices.d")}
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            />
            {errors.choices?.d && (
              <span className="text-xs text-red-600">{errors.choices.d.message}</span>
            )}
          </label>
        </div>
      )}

      <label className="space-y-1 text-sm">
        <span className="font-medium">Topic</span>
        <select
          {...register("topic")}
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
        >
          <option value="">No topic</option>
          {TOPIC_PRESETS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Correct Answer</legend>
        <div className="flex flex-wrap gap-3">
          {(["a", "b", "c", "d"] as const).map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-full border border-sand-300 bg-white px-3 py-2"
            >
              <input
                type="radio"
                value={value}
                {...register("correctAnswer")}
                className="h-3 w-3"
              />
              <span className="uppercase">{value}</span>
            </label>
          ))}
        </div>
        {errors.correctAnswer && (
          <span className="text-xs text-red-600">{errors.correctAnswer.message}</span>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
