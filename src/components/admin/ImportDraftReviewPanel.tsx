"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublishDraftButton } from "@/components/admin/PublishDraftButton";

type DraftQuestion = {
  id: string;
  questionNo: number;
  stem: string;
  stemImageUrl?: string | null;
  correctAnswer: string | null;
  warnings: unknown;
  attachments: Array<{ id: string; url: string }>;
};

type DraftResponse = {
  id: string;
  title: string;
  session: string;
  paper: string;
  language: string;
  status: string;
  stage?: string | null;
  progressInt?: number | null;
  errors: unknown;
  warnings: unknown;
  publishedExamId?: string | null;
  questions: DraftQuestion[];
};

function countList(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stemPreview(stem: string): string {
  const trimmed = stem.trim();
  if (trimmed.length <= 120) {
    return trimmed;
  }
  return `${trimmed.slice(0, 117)}...`;
}

export function ImportDraftReviewPanel({ initial }: { initial: DraftResponse }) {
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (draft.status !== "PARSING") {
      return;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/admin/import/${draft.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as DraftResponse;
      setDraft(data);
    }, 2000);

    return () => clearInterval(interval);
  }, [draft.id, draft.status]);

  const errors = useMemo(() => (Array.isArray(draft.errors) ? draft.errors : []), [draft]);
  const warnings = useMemo(
    () => (Array.isArray(draft.warnings) ? draft.warnings : []),
    [draft]
  );
  const errorCount = errors.length;
  const warningCount = warnings.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">Import draft</h1>
          <p className="mt-1 text-sm text-slate-500">
            {draft.title} - {draft.session} {draft.paper} - {draft.language}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/import" className="text-sm font-semibold text-accent">
            New import
          </Link>
          <PublishDraftButton
            draftId={draft.id}
            status={draft.status}
            publishedExamId={draft.publishedExamId}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="text-lg font-semibold">{draft.status}</p>
          {draft.stage && (
            <p className="mt-1 text-xs font-medium text-slate-500">{draft.stage}</p>
          )}
          {typeof draft.progressInt === "number" && (
            <div className="mt-2 h-2 w-full rounded-full bg-sand-200">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${draft.progressInt}%` }}
              />
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Questions</p>
          <p className="text-lg font-semibold">{draft.questions.length}</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Issues</p>
          <p className="text-sm text-slate-600">
            {warningCount} warnings - {errorCount} errors
          </p>
        </div>
      </div>

      {(errorCount > 0 || warningCount > 0) && (
        <div className="rounded-2xl border border-sand-300 bg-white p-4 text-sm">
          {errorCount > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-red-600">Errors</p>
              <ul className="list-disc pl-5 text-red-700">
                {errors.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          )}
          {warningCount > 0 && (
            <div className="mt-3 space-y-1">
              <p className="font-semibold text-amber-700">Warnings</p>
              <ul className="list-disc pl-5 text-amber-800">
                {warnings.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Stem</th>
              <th className="px-4 py-3">Answer</th>
              <th className="px-4 py-3">Warnings</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {draft.questions.map((question) => {
              const questionWarnings = countList(question.warnings);
              const hasImage = question.attachments.length > 0;
              return (
                <tr key={question.id} className="border-t border-sand-200">
                  <td className="px-4 py-3 font-semibold">{question.questionNo}</td>
                  <td className="px-4 py-3">
                    {question.stemImageUrl ? (
                      <Image
                        src={question.stemImageUrl}
                        alt={`Q${question.questionNo}`}
                        width={80}
                        height={100}
                        sizes="80px"
                        className="h-auto w-20 rounded border border-sand-300 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {stemPreview(question.stem)}
                  </td>
                  <td className="px-4 py-3 uppercase">{question.correctAnswer ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{questionWarnings}</td>
                  <td className="px-4 py-3 text-slate-600">{hasImage ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/import/${draft.id}/questions/${question.id}`}
                      className="text-xs font-semibold text-accent"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {draft.questions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  {draft.status === "PARSING"
                    ? "Import in progress..."
                    : "No questions available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
