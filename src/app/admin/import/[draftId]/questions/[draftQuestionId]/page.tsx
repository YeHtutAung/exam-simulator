import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImportDraftQuestionForm } from "@/components/admin/ImportDraftQuestionForm";

export default async function ImportDraftQuestionEditPage({
  params,
}: {
  params: { draftId: string; draftQuestionId: string };
}) {
  const question = await prisma.importDraftQuestion.findFirst({
    where: {
      id: params.draftQuestionId,
      draftId: params.draftId,
    },
    include: {
      choices: {
        orderBy: { sortOrder: "asc" },
      },
      draft: true,
    },
  });

  if (!question) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Edit question</h1>
        <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
          Draft question not found.
        </div>
      </div>
    );
  }

  const choices = question.choices.reduce(
    (acc, choice) => {
      acc[choice.label as "a" | "b" | "c" | "d"] = choice.text;
      return acc;
    },
    { a: "", b: "", c: "", d: "" }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">Edit question</h1>
          <p className="mt-1 text-sm text-slate-500">
            Q{question.questionNo} · {question.draft.title}
          </p>
        </div>
        <Link
          href={`/admin/import/${params.draftId}`}
          className="text-sm font-semibold text-accent"
        >
          Back to draft
        </Link>
      </div>

      <ImportDraftQuestionForm
        draftId={params.draftId}
        questionId={question.id}
        initialValues={{
          stem: question.stem,
          correctAnswer: (question.correctAnswer ?? "a") as "a" | "b" | "c" | "d",
          choices,
        }}
      />
    </div>
  );
}
