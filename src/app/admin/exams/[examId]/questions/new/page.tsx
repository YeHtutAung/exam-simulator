import { QuestionForm } from "@/components/admin/QuestionForm";

type NewQuestionPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function NewQuestionPage({ params }: NewQuestionPageProps) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">New question</h1>
      </div>
      <QuestionForm
        examId={resolvedParams.examId}
        action={`/api/exams/${resolvedParams.examId}/questions`}
        method="POST"
        submitLabel="Create question"
      />
    </div>
  );
}
