import { NextResponse } from "next/server";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { parseFeAnswerPdf } from "../../../../../lib/importer/feAnswerParser";
import { parseFeQuestionPdf } from "../../../../../lib/importer/feQuestionParser";
import { renderPdfPagesToPng } from "@/lib/importer/pdfPageRenderer";

type DraftStatus =
  | "PARSING"
  | "READY_TO_PUBLISH"
  | "NEEDS_REVIEW"
  | "FAILED";

function getFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function getFormFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = getFormValue(formData, "title");
  const session = getFormValue(formData, "session");
  const paper = getFormValue(formData, "paper");
  const language = getFormValue(formData, "language");
  const questionPdf = getFormFile(formData, "questionPdf");
  const answerPdf = getFormFile(formData, "answerPdf");

  if (!title || !session || !paper || !language) {
    return NextResponse.json(
      { error: "Missing required fields: title, session, paper, language." },
      { status: 400 }
    );
  }

  if (!questionPdf || !answerPdf) {
    return NextResponse.json(
      { error: "Missing required files: questionPdf and answerPdf." },
      { status: 400 }
    );
  }

  const draft = await prisma.importDraft.create({
    data: {
      title,
      session,
      paper,
      language,
      status: "PARSING",
    },
  });

  let status: DraftStatus = "PARSING";
  let errors: string[] = [];
  let warnings: string[] = [];

  try {
    const [questionBuffer, answerBuffer] = await Promise.all([
      questionPdf.arrayBuffer(),
      answerPdf.arrayBuffer(),
    ]);

    const [questions, answers, renderedPages] = await Promise.all([
      parseFeQuestionPdf(Buffer.from(questionBuffer)),
      parseFeAnswerPdf(Buffer.from(answerBuffer)),
      renderPdfPagesToPng(
        Buffer.from(questionBuffer),
        path.join(
          process.cwd(),
          "public",
          "uploads",
          "imports",
          draft.id,
          "pages"
        )
      ),
    ]);

    const pageMap = new Map(renderedPages.map((entry) => [entry.page, entry]));

    if (questions.length !== 80) {
      throw new Error(`Expected 80 questions, found ${questions.length}.`);
    }

    const answerKeys = Object.keys(answers).map(Number);
    if (answerKeys.length !== 80) {
      throw new Error(`Expected 80 answers, found ${answerKeys.length}.`);
    }

    const missingAnswers: number[] = [];
    for (let i = 1; i <= 80; i += 1) {
      if (!answers[i]) {
        missingAnswers.push(i);
      }
    }
    if (missingAnswers.length > 0) {
      throw new Error(
        `Missing answers for questions ${missingAnswers.join(", ")}.`
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const question of questions) {
        const questionWarnings: string[] = [];
        if (!question.stem) {
          questionWarnings.push("Missing stem.");
        }
        if (!question.choices) {
          questionWarnings.push("Missing choices.");
        }
        if (!answers[question.questionNo]) {
          questionWarnings.push("Missing answer.");
        }

        if (questionWarnings.length > 0) {
          warnings.push(`Q${question.questionNo}: ${questionWarnings.join(" ")}`);
        }

        const created = await tx.importDraftQuestion.create({
          data: {
            draftId: draft.id,
            questionNo: question.questionNo,
            type: "MCQ_SINGLE",
            stem: question.stem,
            correctAnswer: answers[question.questionNo] ?? null,
            sourcePage: question.sourcePage ? String(question.sourcePage) : null,
            warnings: questionWarnings.length > 0 ? questionWarnings : null,
          },
        });

        if (question.choices) {
          const choiceEntries = [
            { label: "a", text: question.choices.a, sortOrder: 1 },
            { label: "b", text: question.choices.b, sortOrder: 2 },
            { label: "c", text: question.choices.c, sortOrder: 3 },
            { label: "d", text: question.choices.d, sortOrder: 4 },
          ];

          await tx.importDraftChoice.createMany({
            data: choiceEntries.map((choice) => ({
              draftQuestionId: created.id,
              label: choice.label,
              text: choice.text,
              sortOrder: choice.sortOrder,
            })),
          });
        }

        if (question.sourcePage) {
          const pageInfo = pageMap.get(question.sourcePage);
          if (pageInfo) {
            await tx.importDraftAttachment.create({
              data: {
                draftQuestionId: created.id,
                type: "IMAGE",
                url: pageInfo.url,
                caption: `Source page ${pageInfo.page}`,
                width: pageInfo.width,
                height: pageInfo.height,
                sortOrder: 1,
              },
            });
          }
        }
      }
    });

    status = warnings.length > 0 ? "NEEDS_REVIEW" : "READY_TO_PUBLISH";
  } catch (error) {
    status = "FAILED";
    errors = [
      error instanceof Error ? error.message : "Unknown import error.",
    ];
  }

  await prisma.importDraft.update({
    where: { id: draft.id },
    data: {
      status,
      errors: errors.length > 0 ? errors : null,
      warnings: warnings.length > 0 ? warnings : null,
    },
  });

  return NextResponse.json({
    draftId: draft.id,
    status,
    errors,
    warnings,
  });
}
