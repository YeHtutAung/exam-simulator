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
    setError("Invalid credentials");
  };

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
      <div className="space-y-2">
        <label htmlFor="password" className="text-xs font-semibold text-slate-600">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-sand-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#1F2937] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in with email"}
      </button>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/register" className="font-semibold text-slate-700">
          Create account
        </Link>
        <Link href="/forgot-password" className="font-semibold text-slate-700">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
