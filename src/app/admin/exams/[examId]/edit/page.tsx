import { prisma } from "@/lib/prisma";
import { ExamForm } from "@/components/admin/ExamForm";

type EditExamPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function EditExamPage({ params }: EditExamPageProps) {
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Edit exam</h1>
      </div>
      <ExamForm
        action={`/api/exams/${exam.id}`}
        method="PUT"
        submitLabel="Save changes"
        initialData={exam}
      />
    </div>
  );
}
