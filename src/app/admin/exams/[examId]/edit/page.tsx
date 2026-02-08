import { prisma } from "@/lib/prisma";
import { ExamForm } from "@/components/admin/ExamForm";
import { requireOwner } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";

type EditExamPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function EditExamPage({ params }: EditExamPageProps) {
  await requireOwner();
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
      <PageHeader title="Edit exam" fallbackHref="/owner/exams" eyebrow="Owner Portal" />
      <ExamForm
        action={`/api/exams/${exam.id}`}
        method="PUT"
        submitLabel="Save changes"
        initialData={exam}
      />
    </div>
  );
}
