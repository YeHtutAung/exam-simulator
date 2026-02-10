import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";
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
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-sand-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-slate-500">Register</p>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-slate-500">
          Unlock full reports, accuracy by topic, and attempt history.
        </p>
      </div>
      <RegisterForm />
      <p className="text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-slate-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
