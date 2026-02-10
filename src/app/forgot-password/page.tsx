import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-sand-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-slate-500">Reset password</p>
        <h1 className="text-2xl font-semibold">Forgot your password?</h1>
        <p className="text-sm text-slate-500">
          We will send a reset link to your email.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-xs text-slate-500">
        Remembered your password?{" "}
        <Link href="/signin" className="font-semibold text-slate-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
