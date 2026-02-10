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
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
        If that email exists, a reset link has been sent.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-semibold text-slate-600">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-sand-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>
      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state === "submitting" ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
