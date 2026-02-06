"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { importDraftSchema, ImportDraftInput } from "@/lib/validators/importDraft";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "@/components/admin/InfoTooltip";

const importDraftFormSchema = importDraftSchema.extend({
  questionPdf: z.any(),
  answerPdf: z.any(),
});

type ImportDraftFormValues = ImportDraftInput & {
  questionPdf: FileList;
  answerPdf: FileList;
};

type ImportDraftFormProps = {
  exams: Array<{
    id: string;
    title: string;
    session: string;
    paper: string;
    language: string;
  }>;
  defaultValues?: Partial<ImportDraftInput>;
};

export function ImportDraftForm({ exams, defaultValues }: ImportDraftFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ImportDraftFormValues>({
    resolver: zodResolver(importDraftFormSchema),
      defaultValues: {
        examId: defaultValues?.examId ?? "",
        startPage: defaultValues?.startPage ?? undefined,
      },
  });

  const questionFile = watch("questionPdf");
  const answerFile = watch("answerPdf");
  const questionName = questionFile?.item(0)?.name ?? "";
  const answerName = answerFile?.item(0)?.name ?? "";

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
    formData.append("examId", values.examId);
    if (Number.isFinite(values.startPage)) {
      formData.append("startPage", String(values.startPage));
    }
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
    () => "Select an existing exam and upload the FE question and answer PDFs.",
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
          <span className="flex items-baseline gap-2 font-medium">
            Exam
            <InfoTooltip text="Pick the exam to attach this import to." />
          </span>
          <span className="relative block">
            <select
              {...register("examId")}
              className="w-full cursor-pointer appearance-none rounded-lg border-2 border-sand-400 bg-white px-3 py-2 pr-10 text-slate-900 shadow-sm transition hover:border-sand-500 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
            >
              <option value="">Select exam to import into</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.session} {exam.paper} - {exam.title} ({exam.language})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-600">
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M5.5 7.5L10 12l4.5-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          {errors.examId && <span className="text-xs text-red-600">{errors.examId.message}</span>}
          {exams.length === 0 && (
            <span className="text-xs text-slate-500">
              No empty exams available. Create a new exam first.
            </span>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="flex items-baseline gap-2 font-medium">
            Start page
            <InfoTooltip text="First page number to start parsing from (optional)." />
          </span>
          <input
            type="number"
            min={1}
            {...register("startPage", { valueAsNumber: true })}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="1"
          />
          {errors.startPage && (
            <span className="text-xs text-red-600">{errors.startPage.message}</span>
          )}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="flex items-baseline gap-2 font-medium">
            Question PDF
            <InfoTooltip text="Upload the official question PDF for this exam." />
          </span>
          <span
            className={`group relative flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition ${
              questionName
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-sand-400 hover:border-sand-500 hover:bg-sand-50"
            } focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                questionName ? "bg-emerald-100 text-emerald-700" : "bg-sand-100 text-slate-500"
              }`}
            >
              {questionName ? (
                <span className="text-xs font-semibold">✓</span>
              ) : (
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M10 3v9m0 0l3-3m-3 3L7 9m-3 6h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="flex-1">
              <span className="block font-medium text-slate-800">Upload Question PDF</span>
              <span className="block text-xs text-slate-500">
                {questionName || "PDF only"}
              </span>
            </span>
            <input
              type="file"
              accept="application/pdf"
              {...register("questionPdf")}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </span>
        </label>
        <label className="space-y-1 text-sm">
          <span className="flex items-baseline gap-2 font-medium">
            Answer PDF
            <InfoTooltip text="Upload the official answer PDF for this exam." />
          </span>
          <span
            className={`group relative flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition ${
              answerName
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-sand-300 hover:border-sand-400 hover:bg-sand-50"
            } focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                answerName ? "bg-emerald-100 text-emerald-700" : "bg-sand-100 text-slate-500"
              }`}
            >
              {answerName ? (
                <span className="text-xs font-semibold">✓</span>
              ) : (
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M10 3v9m0 0l3-3m-3 3L7 9m-3 6h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="flex-1">
              <span className="block font-medium text-slate-800">Upload Answer PDF</span>
              <span className="block text-xs text-slate-500">
                {answerName || "PDF only"}
              </span>
            </span>
            <input
              type="file"
              accept="application/pdf"
              {...register("answerPdf")}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </span>
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
