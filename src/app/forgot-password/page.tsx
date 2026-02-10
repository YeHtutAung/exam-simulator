import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md animate-auth-enter">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 shadow-lg">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-sand-300/80 bg-white p-7 shadow-sm">
          <ForgotPasswordForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Remembered your password?{" "}
          <Link
            href="/signin"
            className="font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
