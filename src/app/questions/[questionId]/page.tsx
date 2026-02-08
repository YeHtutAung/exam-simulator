import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AnswerToggle } from "@/components/AnswerToggle";
import { QuestionMCQInlinePractice } from "@/components/QuestionMCQInlinePractice";
import { PageHeader } from "@/components/PageHeader";

type QuestionPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function QuestionPage({ params }: QuestionPageProps) {
  const resolvedParams = await params;
  const question = await prisma.question.findUnique({
    where: { id: resolvedParams.questionId },
    include: {
      exam: true,
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

  const hasStemImage = Boolean(question.stemImageUrl);

  return (
    <div className="space-y-6">
      <PageHeader title={`Question ${question.questionNo}`} fallbackHref="/search" />
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-slate-500">
        <Link href={`/exams/${question.examId}`} className="font-semibold text-accent">
          {question.exam.session} {question.exam.paper}
        </Link>
        <span>Question {question.questionNo}</span>
        <span>{question.type}</span>
      </div>

      <div className="rounded-3xl border border-sand-300 bg-white p-6 shadow-sm">
        {hasStemImage && (
          <img
            src={question.stemImageUrl ?? undefined}
            alt="Question"
            className="w-full rounded-2xl border border-sand-300"
          />
        )}

        {question.attachments.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {question.attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-2xl border border-sand-300 bg-sand p-3">
                {attachment.type === "IMAGE" || attachment.type === "TABLE_IMAGE" ? (
                  <img
                    src={attachment.url}
                    alt={attachment.caption ?? "Attachment"}
                    className="w-full rounded-xl"
                    width={attachment.width ?? undefined}
                    height={attachment.height ?? undefined}
                  />
                ) : (
                  <a
                    href={attachment.url}
                    className="text-sm font-semibold text-accent underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View attachment
                  </a>
                )}
                {attachment.caption && (
                  <p className="mt-2 text-xs text-slate-600">{attachment.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {question.type === "MCQ_SINGLE" && (
          <div className="mt-6">
            <QuestionMCQInlinePractice
              questionId={question.id}
              stem={hasStemImage ? "" : question.stem}
              choices={question.choices.map((choice) => ({
                label: choice.label as "a" | "b" | "c" | "d",
                text: hasStemImage ? "" : choice.text,
              }))}
            />
          </div>
        )}

        {question.type !== "MCQ_SINGLE" && !hasStemImage && (
          <p className="whitespace-pre-line text-base leading-relaxed text-slate-800">
            {question.stem}
          </p>
        )}

        {(question.type === "NUMERIC" || question.type === "TEXT") && (
          <div className="mt-6 rounded-2xl border border-sand-300 bg-sand px-4 py-4">
            <label className="text-sm font-medium text-slate-700">Your answer</label>
            <input
              className="mt-2 w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              placeholder="Type your answer here"
            />
          </div>
        )}

        <AnswerToggle correctAnswer={question.correctAnswer} />

        {question.explanation && (
          <div className="mt-6 rounded-2xl border border-sand-300 bg-sand px-4 py-4">
            <p className="text-sm font-semibold text-slate-700">Explanation</p>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
              {question.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
