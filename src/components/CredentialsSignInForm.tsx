"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function CredentialsSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/signin",
    });
    setIsSubmitting(false);
    if (result?.ok) {
      router.push("/signin");
      return;
    }
    setError("Invalid email or password. Please try again.");
  };

  if (!isExpanded) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full rounded-2xl border border-sand-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          Sign in with email
        </button>
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Create one
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-auth-expand space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-slate-500">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
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
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-900 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-slate-600 transition-colors hover:text-slate-900"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
