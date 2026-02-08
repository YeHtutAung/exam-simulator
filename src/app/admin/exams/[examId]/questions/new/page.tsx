import { QuestionForm } from "@/components/admin/QuestionForm";
import { requireOwner } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";

type NewQuestionPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function NewQuestionPage({ params }: NewQuestionPageProps) {
  await requireOwner();
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <PageHeader
        title="New question"
        fallbackHref={`/owner/exams/${resolvedParams.examId}/questions`}
        eyebrow="Owner Portal"
      />
      <QuestionForm
        examId={resolvedParams.examId}
        action={`/api/exams/${resolvedParams.examId}/questions`}
        method="POST"
        submitLabel="Create question"
      />
    </div>
  );
}
