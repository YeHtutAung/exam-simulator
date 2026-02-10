"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/signin" })}
      className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Sign in with Google
    </button>
  );
}
