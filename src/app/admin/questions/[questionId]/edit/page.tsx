import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/QuestionForm";

type EditQuestionPageProps = {
  params: { questionId: string };
};

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const question = await prisma.question.findUnique({
    where: { id: params.questionId },
    include: {
      choices: { orderBy: { sortOrder: "asc" } },
      attachments: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!question) {
    return (
      <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm">
        Question not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Edit question</h1>
      </div>
      <QuestionForm
        examId={question.examId}
        action={`/api/questions/${question.id}`}
        method="PUT"
        submitLabel="Save changes"
        initialData={{
          questionNo: question.questionNo,
          type: question.type,
          stem: question.stem,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation ?? "",
          sourcePage: question.sourcePage ?? "",
          choices: question.choices.map((choice) => ({
            label: choice.label as "a" | "b" | "c" | "d",
            text: choice.text,
            sortOrder: choice.sortOrder,
          })),
          attachments: question.attachments.map((attachment) => ({
            type: attachment.type,
            url: attachment.url,
            caption: attachment.caption ?? "",
            width: attachment.width ?? undefined,
            height: attachment.height ?? undefined,
            sortOrder: attachment.sortOrder,
          })),
        }}
      />
    </div>
  );
}
