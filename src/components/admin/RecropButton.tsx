"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecropButton({
  draftId,
  questionId,
}: {
  draftId: string;
  questionId: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    try {
      const response = await fetch(
        `/api/admin/import/${draftId}/questions/${questionId}/recrop`,
        { method: "POST" }
      );
      if (!response.ok) {
        console.error("Recrop failed");
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sand-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Recropping..." : "Re-crop image"}
    </button>
  );
}
