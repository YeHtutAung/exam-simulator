import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";
import { SignInButton } from "@/components/SignInButton";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await getServerAuthSession();
  if (session?.user?.role === "OWNER") {
    redirect("/owner");
  }
  if (session?.user) {
    redirect("/dashboard");
  }

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
                d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track your progress and unlock detailed exam reports
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-sand-300/80 bg-white p-7 shadow-sm">
          <div className="space-y-5">
            {/* Primary: Google sign-up */}
            <SignInButton />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sand-300 to-transparent" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-300">
                or
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sand-300 to-transparent" />
            </div>

            {/* Secondary: Email registration */}
            <RegisterForm />
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
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
