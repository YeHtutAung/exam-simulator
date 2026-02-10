"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type State = "idle" | "submitting" | "success";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState("success");
  };

  if (state === "success") {
    return (
      <div className="animate-auth-expand rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Check your inbox</p>
            <p className="mt-1 text-emerald-700">
              If that email exists, a password reset link has been sent.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium text-slate-500">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        />
      </div>
      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
      >
        {state === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Sending...
          </span>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
