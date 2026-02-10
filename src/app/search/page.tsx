import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SearchForm from "@/components/search/SearchForm";

const TOPIC_PRESETS = [
  "Discrete Math",
  "Data Structures & Algorithms",
  "Computer Hardware",
  "Software",
  "Database",
  "Networking",
  "Security",
  "System Development",
  "Project Management",
  "Service Management",
  "Business Strategy",
  "Pseudo Code",
  "Programming",
  "Spreadsheet",
];

type SearchPageProps = {
  searchParams?: Promise<{ examId?: string; topic?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const examId = resolvedSearchParams.examId ?? "";
  const topic = resolvedSearchParams.topic?.trim() ?? "";
  const t = await getTranslations("search");

  const exams = await prisma.exam.findMany({ orderBy: { createdAt: "desc" } });

  const hasSearch = Boolean(examId || topic);
  const questions = hasSearch
    ? await prisma.question.findMany({
        where: {
          ...(examId ? { examId } : {}),
          ...(topic ? { topic } : {}),
        },
        include: { exam: true },
        orderBy: { questionNo: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-slate-600">{t("subtitle")}</p>
      </div>

      <SearchForm
        exams={exams.map((e) => ({ id: e.id, session: e.session, paper: e.paper, title: e.title }))}
        defaultExamId={examId}
        defaultTopic={topic}
        topics={TOPIC_PRESETS}
        labels={{
          allExams: t("allExams"),
          allTopics: t("allTopics"),
          search: t("button"),
          practiceNow: t("practiceNow"),
          selectExam: t("selectExam"),
        }}
      />

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
              querySuffix: "",
            })}
          </p>
          {questions.map((question) => (
            <Link
              key={question.id}
              href={`/questions/${question.id}`}
              className="block rounded-2xl border border-sand-300 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {question.exam.session} {question.exam.paper} · Q{question.questionNo}
                </p>
                {question.topic && (
                  <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {question.topic}
                  </span>
                )}
              </div>
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
