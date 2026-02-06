"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { examSchema, ExamInput } from "@/lib/validators/exam";
import { useRouter } from "next/navigation";

type ExamFormProps = {
  initialData?: Partial<ExamInput>;
  action: string;
  method: "POST" | "PUT";
  submitLabel: string;
};

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        aria-label={text}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sand-200 bg-sand-50 text-[11px] font-semibold text-slate-500 transition group-hover:border-sand-300 group-hover:text-slate-700"
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
        <span className="relative block rounded-xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
          {text}
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-900" />
        </span>
      </span>
    </span>
  );
}

export function ExamForm({ initialData, action, method, submitLabel }: ExamFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExamInput>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      code: initialData?.code ?? "",
      title: initialData?.title ?? "",
      session: initialData?.session ?? "",
      paper: initialData?.paper ?? "",
      language: initialData?.language ?? "JA",
    },
  });

  const onSubmit = async (values: ExamInput) => {
    setError(null);
    const response = await fetch(action, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Failed to save exam.");
      return;
    }

    router.push("/admin/exams");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="flex items-center gap-2 font-medium">
            Code
            <InfoBadge text="Optional short identifier, e.g., FE-2024-APR-AM." />
          </span>
          <input
            {...register("code")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="FE-2024-APR-AM"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="flex items-center gap-2 font-medium">
            Session
            <InfoBadge text="Exam session/date, e.g., 2024 Spring." />
          </span>
          <input
            {...register("session")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="2024 Spring"
          />
          {errors.session && <span className="text-xs text-red-600">{errors.session.message}</span>}
        </label>
        <label className="space-y-1 text-sm">
          <span className="flex items-center gap-2 font-medium">
            Title
            <InfoBadge text="Display name of the exam." />
          </span>
          <input
            {...register("title")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="Fundamentals of Engineering"
          />
          {errors.title && <span className="text-xs text-red-600">{errors.title.message}</span>}
        </label>
        <label className="space-y-1 text-sm">
          <span className="flex items-center gap-2 font-medium">
            Paper
            <InfoBadge text="Paper/section label, e.g., AM or PM." />
          </span>
          <input
            {...register("paper")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="AM"
          />
          {errors.paper && <span className="text-xs text-red-600">{errors.paper.message}</span>}
        </label>
        <label className="space-y-1 text-sm">
          <span className="flex items-center gap-2 font-medium">
            Language
            <InfoBadge text="Language of the questions, e.g., JA or EN." />
          </span>
          <input
            {...register("language")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="JA"
          />
          {errors.language && <span className="text-xs text-red-600">{errors.language.message}</span>}
        </label>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}
