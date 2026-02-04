import { QuestionForm } from "@/components/admin/QuestionForm";

type NewQuestionPageProps = {
  params: { examId: string };
};

export default function NewQuestionPage({ params }: NewQuestionPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">New question</h1>
      </div>
      <QuestionForm
        examId={params.examId}
        action={`/api/exams/${params.examId}/questions`}
        method="POST"
        submitLabel="Create question"
      />
    </div>
  );
}
