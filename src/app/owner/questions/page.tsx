import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/rbac";

export default async function OwnerQuestionsPage() {
  await requireOwner();
  const t = await getTranslations("owner");
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">{t("portalLabel")}</p>
        <h1 className="text-2xl font-semibold">{t("questionsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("questionsSubtitle")}</p>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sand-300 bg-white p-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                {exam.session} {exam.paper}
              </p>
              <p className="text-sm font-semibold">{exam.title}</p>
              <p className="text-xs text-slate-500">{exam.language}</p>
            </div>
            <Link
              href={`/owner/exams/${exam.id}/questions`}
              className="text-xs font-semibold text-accent"
            >
              {t("manageQuestionsLink")}
            </Link>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
            {t("noExams")}
          </div>
        )}
      </div>
    </div>
  );
}
