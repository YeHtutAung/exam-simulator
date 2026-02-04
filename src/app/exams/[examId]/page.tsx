import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";

type ExamPageProps = {
  params: Promise<{ examId: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function ExamPage({ params, searchParams }: ExamPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = Number(resolvedSearchParams.page ?? "1");
  const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;

  const [exam, totalQuestions] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: resolvedParams.examId },
    }),
    prisma.question.count({
      where: { examId: resolvedParams.examId },
    }),
  ]);

  if (!exam) {
    return (
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm">
        Exam not found.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalQuestions / PAGE_SIZE));
  const questions = await prisma.question.findMany({
    where: { examId: resolvedParams.examId },
    orderBy: { questionNo: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">
          {exam.session} {exam.paper}
        </p>
        <h1 className="text-2xl font-semibold">{exam.title}</h1>
        <p className="text-sm text-slate-600">{exam.language}</p>
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <Link
            key={question.id}
            href={`/questions/${question.id}`}
            className="block rounded-2xl border border-sand-300 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              Question {question.questionNo} · {question.type}
            </p>
            <p className="mt-2 text-sm text-slate-700">{question.stem}</p>
          </Link>
        ))}
        {questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
            No questions yet.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        makeHref={(pageNum) => `/exams/${resolvedParams.examId}?page=${pageNum}`}
      />
    </div>
  );
}
