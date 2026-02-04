import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchPageProps = {
  searchParams?: Promise<{ query?: string; examId?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.query?.trim() ?? "";
  const examId = resolvedSearchParams.examId ?? "";

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
        <h1 className="text-2xl font-semibold">Search questions</h1>
        <p className="text-sm text-slate-600">
          Search by keyword in the question stem and optionally filter by exam.
        </p>
      </div>

      <form action="/exam-runner" method="get" className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          name="query"
          defaultValue={query}
          placeholder="例: TCP/IP, SQL, セキュリティ..."
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
        />
        <select
          name="examId"
          defaultValue={examId}
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All exams</option>
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
          Search
        </button>
      </form>

      {!hasSearch && (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
          Enter a keyword to start searching.
        </div>
      )}

      {hasSearch && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Found {questions.length} result{questions.length === 1 ? "" : "s"}
            {query ? ` for "${query}"` : ""}.
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
              <p className="mt-2 text-sm text-slate-700">{question.stem}</p>
            </Link>
          ))}
          {questions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
              No results. Try another keyword.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
