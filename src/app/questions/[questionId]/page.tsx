import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AnswerToggle } from "@/components/AnswerToggle";
import { QuestionMCQInlinePractice } from "@/components/QuestionMCQInlinePractice";

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

  const stemImage = question.attachments.find(
    (attachment) => attachment.caption === "STEM"
  );
  const choiceImages = {
    a: question.attachments.find((attachment) => attachment.caption === "CHOICE_A"),
    b: question.attachments.find((attachment) => attachment.caption === "CHOICE_B"),
    c: question.attachments.find((attachment) => attachment.caption === "CHOICE_C"),
    d: question.attachments.find((attachment) => attachment.caption === "CHOICE_D"),
  };
  const hasImageChoices = Object.values(choiceImages).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-slate-500">
        <Link href={`/exams/${question.examId}`} className="font-semibold text-accent">
          {question.exam.session} {question.exam.paper}
        </Link>
        <span>Question {question.questionNo}</span>
        <span>{question.type}</span>
      </div>

      <div className="rounded-3xl border border-sand-300 bg-white p-6 shadow-sm">
        {question.attachments.filter((attachment) => !["STEM", "CHOICE_A", "CHOICE_B", "CHOICE_C", "CHOICE_D"].includes(attachment.caption ?? "")).length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {question.attachments
              .filter(
                (attachment) =>
                  !["STEM", "CHOICE_A", "CHOICE_B", "CHOICE_C", "CHOICE_D"].includes(
                    attachment.caption ?? ""
                  )
              )
              .map((attachment) => (
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

        {question.type === "MCQ_SINGLE" && hasImageChoices && (
          <div className="mt-6 space-y-4">
            {stemImage && (
              <img
                src={stemImage.url}
                alt={stemImage.caption ?? "Question stem"}
                className="w-full rounded-2xl border border-sand-300"
                width={stemImage.width ?? undefined}
                height={stemImage.height ?? undefined}
              />
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {(["a", "b", "c", "d"] as const).map((label) => {
                const image = choiceImages[label];
                if (!image) {
                  return null;
                }
                const inputId = `mcq-${question.id}-${label}`;
                return (
                  <label
                    key={label}
                    htmlFor={inputId}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand-300 bg-sand p-3"
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`mcq-${question.id}`}
                      value={label}
                      className="mt-2 h-4 w-4 accent-teal-700"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">{label})</p>
                      <img
                        src={image.url}
                        alt={`${label} choice`}
                        className="w-full rounded-xl"
                        width={image.width ?? undefined}
                        height={image.height ?? undefined}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {question.type === "MCQ_SINGLE" && !hasImageChoices && (
          <div className="mt-6">
            <QuestionMCQInlinePractice
              questionId={question.id}
              stem={question.stem}
              choices={question.choices.map((choice) => ({
                label: choice.label as "a" | "b" | "c" | "d",
                text: choice.text,
              }))}
            />
          </div>
        )}

        {question.type !== "MCQ_SINGLE" && (
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
