"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type RegisterState = "idle" | "submitting" | "success" | "error";

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<RegisterState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setState("submitting");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() ? name.trim() : undefined,
        email,
        password,
      }),
    });
    if (!response.ok) {
      setState("error");
      setError("Unable to register. Please try again.");
      return;
    }
    setState("success");
  };

  if (state === "success") {
    return (
      <div className="animate-auth-expand rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Check your email</p>
            <p className="mt-1 text-emerald-700">
              We sent a verification link. Once verified, you can sign in.
            </p>
            <button
              type="button"
              onClick={() => router.push("/signin")}
              className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-2xl border border-sand-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
      >
        Sign up with email
      </button>
    );
  }

  return (
    <div className="animate-auth-expand space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-medium text-slate-500">
            Name <span className="text-slate-300">(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-xs font-medium text-slate-500">
            Email address
          </label>
          <input
            id="reg-email"
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
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-xs font-medium text-slate-500">
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            placeholder="Minimum 10 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="w-full rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {state === "submitting" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </div>
  );
}
