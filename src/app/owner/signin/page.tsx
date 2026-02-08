import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { OwnerSignInButton } from "@/components/OwnerSignInButton";

export default async function OwnerSignInPage() {
  const session = await getServerAuthSession();
  if (session?.user?.role === "OWNER") {
    redirect("/owner");
  }
  if (session?.user) {
    redirect("/?error=owner");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-sand-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-slate-500">Owner Portal</p>
        <h1 className="text-2xl font-semibold">Sign in as Owner</h1>
        <p className="text-sm text-slate-500">
          Restricted access for application owners.
        </p>
      </div>
      <OwnerSignInButton />
    </div>
  );
}
