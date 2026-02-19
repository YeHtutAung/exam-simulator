"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublishDraftButton } from "@/components/admin/PublishDraftButton";

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

type DraftQuestion = {
  id: string;
  questionNo: number;
  stem: string;
  stemImageUrl?: string | null;
  correctAnswer: string | null;
  topic?: string | null;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTopic, setBulkTopic] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [autoTopicLoading, setAutoTopicLoading] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === draft.questions.length
        ? new Set()
        : new Set(draft.questions.map((q) => q.id))
    );
  }, [draft.questions]);

  const handleAutoTopic = useCallback(async () => {
    setAutoTopicLoading(true);
    const response = await fetch(
      `/api/admin/import/${draft.id}/questions/auto-topic`,
      { method: "POST" },
    );
    if (response.ok) {
      const refreshRes = await fetch(`/api/admin/import/${draft.id}`, {
        cache: "no-store",
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as DraftResponse;
        setDraft(data);
      }
    }
    setAutoTopicLoading(false);
  }, [draft.id]);

  const handleBulkAssign = useCallback(async () => {
    if (!bulkTopic || selectedIds.size === 0) return;
    setBulkLoading(true);
    const response = await fetch(
      `/api/admin/import/${draft.id}/questions/bulk-topic`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: Array.from(selectedIds),
          topic: bulkTopic,
        }),
      }
    );
    if (response.ok) {
      setDraft((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          selectedIds.has(q.id) ? { ...q, topic: bulkTopic } : q
        ),
      }));
      setSelectedIds(new Set());
      setBulkTopic("");
    }
    setBulkLoading(false);
  }, [bulkTopic, selectedIds, draft.id]);

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
  const missingCrops = useMemo(
    () => draft.questions.filter((question) => !question.stemImageUrl).length,
    [draft.questions]
  );

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
          <button
            onClick={handleAutoTopic}
            disabled={autoTopicLoading || draft.status === "PUBLISHED"}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {autoTopicLoading ? "Detecting..." : "Auto-detect topics"}
          </button>
          <PublishDraftButton
            draftId={draft.id}
            status={draft.status}
            publishedExamId={draft.publishedExamId}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{draft.status}</p>
            {draft.status === "PARSING" && (
              <span className="inline-flex h-5 w-5 items-center justify-center text-accent">
                <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.25"
                  />
                  <path
                    d="M21 12a9 9 0 0 1-9 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            )}
          </div>
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
          <p className="text-xs font-semibold uppercase text-slate-500">Missing crops</p>
          <p className="text-lg font-semibold">{missingCrops}</p>
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

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sand-300 bg-white p-4">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} selected
          </span>
          <select
            value={bulkTopic}
            onChange={(e) => setBulkTopic(e.target.value)}
            className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Assign topic...</option>
            {TOPIC_PRESETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkAssign}
            disabled={!bulkTopic || bulkLoading}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkLoading ? "Assigning..." : "Apply"}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === draft.questions.length && draft.questions.length > 0}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5"
                />
              </th>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Stem</th>
              <th className="px-4 py-3">Topic</th>
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
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(question.id)}
                      onChange={() => toggleSelect(question.id)}
                      className="h-3.5 w-3.5"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold">{question.questionNo}</td>
                  <td className="px-4 py-3">
                    {question.stemImageUrl ? (
                      <img
                        src={question.stemImageUrl}
                        alt={`Q${question.questionNo}`}
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
                  <td className="px-4 py-3">
                    {question.topic ? (
                      <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        {question.topic}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
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
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-500">
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
