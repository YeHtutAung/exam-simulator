import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

type SearchPageProps = {
  searchParams?: Promise<{ query?: string; examId?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.query?.trim() ?? "";
  const examId = resolvedSearchParams.examId ?? "";
  const t = await getTranslations("search");

  const exams = await prisma.exam.findMany({ orderBy: { createdAt: "desc" } });

  const hasSearch = Boolean(query || examId);
  const questions = hasSearch
    ? await prisma.question.findMany({
        where: {
          ...(query ? { stem: { contains: query, mode: "insensitive" } } : {}),
          ...(examId ? { examId } : {}),
        },
        include: { exam: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-slate-600">{t("subtitle")}</p>
      </div>

      <form action="/exam-runner" method="get" className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          name="query"
          defaultValue={query}
          placeholder={t("placeholder")}
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
        />
        <select
          name="examId"
          defaultValue={examId}
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("allExams")}</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.session} {exam.paper} - {exam.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          {t("button")}
        </button>
      </form>

      {!hasSearch && (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
          {t("emptyPrompt")}
        </div>
      )}

      {hasSearch && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {t("results", {
              count: questions.length,
              querySuffix: query ? t("resultsSuffix", { query }) : "",
            })}
          </p>
          {questions.map((question) => (
            <Link
              key={question.id}
              href={`/questions/${question.id}`}
              className="block rounded-2xl border border-sand-300 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase text-slate-500">
                {question.exam.session} {question.exam.paper} · Q{question.questionNo}
              </p>
              {question.stemImageUrl ? (
                <img
                  src={question.stemImageUrl}
                  alt={`Question ${question.questionNo}`}
                  className="mt-3 w-full rounded-xl border border-sand-300"
                />
              ) : (
                <p className="mt-2 text-sm text-slate-700">{question.stem}</p>
              )}
            </Link>
          ))}
          {questions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
              {t("noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
