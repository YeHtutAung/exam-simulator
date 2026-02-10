import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-sand-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-slate-500">Reset password</p>
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <p className="text-sm text-slate-500">
          Choose a strong password to keep your account safe.
        </p>
      </div>
      <ResetPasswordForm />
      <p className="text-xs text-slate-500">
        Back to{" "}
        <Link href="/signin" className="font-semibold text-slate-700">
          sign in
        </Link>
      </p>
    </div>
  );
}
