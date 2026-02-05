"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { importDraftSchema, ImportDraftInput } from "@/lib/validators/importDraft";
import { useRouter } from "next/navigation";

type ImportDraftFormValues = ImportDraftInput & {
  questionPdf: FileList;
  answerPdf: FileList;
};

type ImportDraftFormProps = {
  defaultValues?: Partial<ImportDraftInput>;
};

export function ImportDraftForm({ defaultValues }: ImportDraftFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ImportDraftFormValues>({
    resolver: zodResolver(importDraftSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      session: defaultValues?.session ?? "",
      paper: defaultValues?.paper ?? "",
      language: defaultValues?.language ?? "JA",
    },
  });

  const onSubmit = async (values: ImportDraftFormValues) => {
    setError(null);
    setFileError(null);

    const questionFile = values.questionPdf?.item(0);
    const answerFile = values.answerPdf?.item(0);

    if (!questionFile || !answerFile) {
      setFileError("Both question and answer PDFs are required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("session", values.session);
    formData.append("paper", values.paper);
    formData.append("language", values.language);
    formData.append("questionPdf", questionFile);
    formData.append("answerPdf", answerFile);

    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Failed to create import draft.");
      return;
    }

    const payload = await response.json();
    if (payload?.draftId) {
      router.push(`/admin/import/${payload.draftId}`);
      router.refresh();
      return;
    }

    setError("Import created, but no draft ID was returned.");
  };

  const helperText = useMemo(
    () => "Upload the FE question and answer PDFs to create a draft.",
    []
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {fileError && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{fileError}</p>
      )}

      <div className="rounded-2xl border border-sand-300 bg-white p-4 text-sm text-slate-600">
        {helperText}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
          <span className="font-medium">Session</span>
          <input
            {...register("session")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="2020 Autumn"
          />
          {errors.session && (
            <span className="text-xs text-red-600">{errors.session.message}</span>
          )}
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
          {errors.language && (
            <span className="text-xs text-red-600">{errors.language.message}</span>
          )}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Question PDF</span>
          <input
            type="file"
            accept="application/pdf"
            {...register("questionPdf")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Answer PDF</span>
          <input
            type="file"
            accept="application/pdf"
            {...register("answerPdf")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Uploading..." : "Create draft"}
      </button>
    </form>
  );
}
