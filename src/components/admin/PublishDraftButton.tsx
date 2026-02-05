"use client";

import { useState } from "react";
import Link from "next/link";

type PublishDraftButtonProps = {
  draftId: string;
  status: string;
  publishedExamId?: string | null;
};

export function PublishDraftButton({
  draftId,
  status,
  publishedExamId,
}: PublishDraftButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(publishedExamId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/admin/import/${draftId}/publish`, {
      method: "POST",
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Failed to publish draft.");
      return;
    }

    const payload = await response.json().catch(() => null);
    if (payload?.examId) {
      setExamId(payload.examId);
    }
  };

  if (examId) {
    return (
      <Link
        href={`/exams/${examId}`}
        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        View published exam
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handlePublish}
        disabled={status !== "READY_TO_PUBLISH" || isSubmitting}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Publishing..." : "Publish"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
