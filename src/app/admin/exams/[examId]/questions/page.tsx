import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/DeleteButton";

type AdminExamQuestionsPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function AdminExamQuestionsPage({ params }: AdminExamQuestionsPageProps) {
  const resolvedParams = await params;
  const exam = await prisma.exam.findUnique({
    where: { id: resolvedParams.examId },
  });

  if (!exam) {
    return (
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm">
        Exam not found.
      </div>
    );
  }

  const questions = await prisma.question.findMany({
    where: { examId: resolvedParams.examId },
    orderBy: { questionNo: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">{exam.title} questions</h1>
        </div>
        <Link
          href={`/admin/exams/${exam.id}/questions/new`}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          New question
        </Link>
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <div
            key={question.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sand-300 bg-white p-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Question {question.questionNo} · {question.type}
              </p>
              <p className="text-sm text-slate-700">{question.stem}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link href={`/questions/${question.id}`} className="font-semibold text-accent">
                View
              </Link>
              <Link href={`/admin/questions/${question.id}/edit`} className="font-semibold text-slate-600">
                Edit
              </Link>
              <DeleteButton url={`/api/questions/${question.id}`} />
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
            No questions yet.
          </div>
        )}
      </div>
    </div>
  );
}
