import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";
import { CredentialsSignInForm } from "@/components/CredentialsSignInForm";

export default async function SignInPage() {
  const session = await getServerAuthSession();
  if (session?.user?.role === "OWNER") {
    redirect("/owner");
  }
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-sand-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-slate-500">Sign in</p>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-slate-500">
          Access your dashboard and track practice progress.
        </p>
      </div>
      <div className="space-y-3">
        <SignInButton />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-sand-300" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-sand-300" />
        </div>
        <CredentialsSignInForm />
      </div>
    </div>
  );
}
