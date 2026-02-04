"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteButtonProps = {
  url: string;
  redirectTo?: string;
  label?: string;
};

export function DeleteButton({ url, redirectTo, label = "Delete" }: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setLoading(true);
    const response = await fetch(url, { method: "DELETE" });
    setLoading(false);

    if (!response.ok) {
      alert("Delete failed.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-60"
    >
      {label}
    </button>
  );
}
