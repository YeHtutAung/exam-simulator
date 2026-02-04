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
          <span className="font-medium">Code</span>
          <input
            {...register("code")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="FE-2024-APR-AM"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Session</span>
          <input
            {...register("session")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="2024 Spring"
          />
          {errors.session && <span className="text-xs text-red-600">{errors.session.message}</span>}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            {...register("title")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="Fundamentals of Engineering"
          />
          {errors.title && <span className="text-xs text-red-600">{errors.title.message}</span>}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Paper</span>
          <input
            {...register("paper")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="AM"
          />
          {errors.paper && <span className="text-xs text-red-600">{errors.paper.message}</span>}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Language</span>
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
