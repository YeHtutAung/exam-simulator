import Link from "next/link";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ImportDraftQuestionForm } from "@/components/admin/ImportDraftQuestionForm";
import { RecropButton } from "@/components/admin/RecropButton";
import { ImportDraftQuestionCropper } from "@/components/admin/ImportDraftQuestionCropper";

export default async function ImportDraftQuestionEditPage({
  params,
}: {
  params: Promise<{ draftId: string; draftQuestionId: string }>;
}) {
  const resolvedParams = await params;
  const question = await prisma.importDraftQuestion.findFirst({
    where: {
      id: resolvedParams.draftQuestionId,
      draftId: resolvedParams.draftId,
    },
    include: {
      choices: {
        orderBy: { sortOrder: "asc" },
      },
      attachments: {
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

  const siblings = await prisma.importDraftQuestion.findMany({
    where: { draftId: resolvedParams.draftId },
    orderBy: { questionNo: "asc" },
    select: { id: true },
  });
  const currentIndex = siblings.findIndex((entry) => entry.id === question.id);
  const prevQuestionId = currentIndex > 0 ? siblings[currentIndex - 1]?.id : null;
  const nextQuestionId =
    currentIndex >= 0 && currentIndex < siblings.length - 1
      ? siblings[currentIndex + 1]?.id
      : null;

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
            Q{question.questionNo} - {question.draft.title}
          </p>
        </div>
        <Link
          href={`/admin/import/${resolvedParams.draftId}`}
          className="text-sm font-semibold text-accent"
        >
          Back to draft
        </Link>
      </div>

      <ImportDraftQuestionForm
        draftId={resolvedParams.draftId}
        questionId={question.id}
        hasStemImage={Boolean(question.stemImageUrl)}
        initialValues={{
          stem: question.stem,
          correctAnswer: (question.correctAnswer ?? "a") as "a" | "b" | "c" | "d",
          choices,
        }}
      />

      {question.pageImageUrl && (
        <ImportDraftQuestionCropper
          draftId={resolvedParams.draftId}
          questionId={question.id}
          pageImageUrl={question.pageImageUrl}
          stemImageUrl={question.stemImageUrl}
          initialCrop={
            question.cropX !== null &&
            question.cropY !== null &&
            question.cropW !== null &&
            question.cropH !== null
              ? {
                  x: question.cropX,
                  y: question.cropY,
                  width: question.cropW,
                  height: question.cropH,
                }
              : null
          }
          prevQuestionId={prevQuestionId}
          nextQuestionId={nextQuestionId}
        />
      )}

      {question.stemImageUrl && (
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">Stem image preview</p>
          <img
            src={question.stemImageUrl}
            alt="Stem preview"
            className="mt-3 w-full rounded-xl border border-sand-300"
          />
          <div className="mt-3">
            <RecropButton
              draftId={resolvedParams.draftId}
              questionId={question.id}
            />
          </div>
        </div>
      )}

      {question.attachments.length > 0 && (
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">Attachment preview</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {question.attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-xl border border-sand-300 bg-sand p-3">
                <img
                  src={attachment.url}
                  alt={attachment.caption ?? "Attachment"}
                  className="w-full rounded-lg"
                  width={attachment.width ?? undefined}
                  height={attachment.height ?? undefined}
                />
                {attachment.caption && (
                  <p className="mt-2 text-xs text-slate-600">{attachment.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
