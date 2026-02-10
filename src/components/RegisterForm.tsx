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
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Check your email</p>
        <p className="mt-2">
          We sent a verification link. Once verified, you can sign in.
        </p>
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
        <label htmlFor="name" className="text-xs font-semibold text-slate-600">
          Name (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-sand-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>
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
        {state === "submitting" ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
