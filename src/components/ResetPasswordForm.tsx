"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

type State = "idle" | "submitting" | "success" | "error";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setState("submitting");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    if (!response.ok) {
      setState("error");
      setError("Invalid or expired reset link.");
      return;
    }
    setState("success");
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
        Missing reset token.
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Password updated</p>
        <p className="mt-2">You can now sign in with your new password.</p>
        <button
          type="button"
          onClick={() => router.push("/signin")}
          className="mt-4 rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-xs font-semibold text-slate-600">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-sand-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
        />
        <p className="text-[11px] text-slate-500">Minimum 10 characters.</p>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state === "submitting" ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
