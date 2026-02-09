import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerAuthSession } from "@/lib/auth";
import { OwnerSignInButton } from "@/components/OwnerSignInButton";

export default async function OwnerSignInPage() {
  const session = await getServerAuthSession();
  const t = await getTranslations("owner");
  if (session?.user?.role === "OWNER") {
    redirect("/owner");
  }
  if (session?.user) {
    redirect("/?error=owner");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-sand-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase text-slate-500">{t("portalLabel")}</p>
        <h1 className="text-2xl font-semibold">{t("signInTitle")}</h1>
        <p className="text-sm text-slate-500">{t("signInSubtitle")}</p>
      </div>
      <OwnerSignInButton />
    </div>
  );
}
