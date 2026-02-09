import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireOwner } from "@/lib/rbac";

export default async function OwnerDashboardPage() {
  await requireOwner();
  const t = await getTranslations("owner");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">{t("portalLabel")}</p>
        <h1 className="text-2xl font-semibold">{t("dashboardTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("dashboardSubtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/owner/exams"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">{t("manageExams")}</p>
          <p className="mt-2 text-xs text-slate-500">{t("manageExamsDesc")}</p>
        </Link>
        <Link
          href="/owner/questions"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">{t("manageQuestions")}</p>
          <p className="mt-2 text-xs text-slate-500">{t("manageQuestionsDesc")}</p>
        </Link>
        <Link
          href="/owner/users"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">{t("manageUsers")}</p>
          <p className="mt-2 text-xs text-slate-500">{t("manageUsersDesc")}</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-sand-300 bg-white p-5">
        <p className="text-sm font-semibold">{t("quickLinks")}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/owner/exams" className="font-semibold text-accent">
            {t("exams")}
          </Link>
          <Link href="/owner/users" className="font-semibold text-accent">
            {t("users")}
          </Link>
          <Link href="/owner/import" className="font-semibold text-accent">
            {t("importDrafts")}
          </Link>
        </div>
      </div>
    </div>
  );
}
