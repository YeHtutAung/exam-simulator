import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    draftId: string;
  }>;
};

function collectIssues(draft: {
  errors: unknown;
  warnings: unknown;
  questions: Array<{ questionNo: number; warnings: unknown }>;
}) {
  const errors = Array.isArray(draft.errors) ? draft.errors : [];
  const warnings = Array.isArray(draft.warnings) ? draft.warnings : [];
  const questionWarnings: string[] = [];
  for (const question of draft.questions) {
    if (Array.isArray(question.warnings)) {
      for (const warning of question.warnings) {
        questionWarnings.push(`Q${question.questionNo}: ${warning}`);
      }
    }
  }

  return {
    errors,
    warnings: warnings.length > 0 ? warnings : questionWarnings,
  };
}

export async function POST(_request: Request, { params }: Params) {
  const resolvedParams = await params;
  const draft = await prisma.importDraft.findUnique({
    where: { id: resolvedParams.draftId },
    include: {
      questions: {
        orderBy: { questionNo: "asc" },
        include: {
          choices: { orderBy: { sortOrder: "asc" } },
          attachments: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (draft.status !== "READY_TO_PUBLISH") {
    const issues = collectIssues(draft);
    return NextResponse.json(
      {
        error: "Draft is not ready to publish.",
        status: draft.status,
        errors: issues.errors,
        warnings: issues.warnings,
      },
      { status: 400 }
    );
  }

  const invalidQuestions = draft.questions.filter((question) => {
    const hasStemImage = Boolean(question.stemImageUrl);
    if (!hasStemImage && !question.stem?.trim()) {
      return true;
    }
    if (!question.correctAnswer) {
      return true;
    }
    if (question.choices.length !== 4) {
      return true;
    }
    if (!hasStemImage && question.choices.some((choice) => !choice.text.trim())) {
      return true;
    }
    return false;
  });

  if (invalidQuestions.length > 0) {
    return NextResponse.json(
      {
        error: "Draft has invalid questions.",
        invalidQuestions: invalidQuestions.map((question) => question.questionNo),
      },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Use the target exam that was selected during import
    // For backwards compatibility, create a new exam if no target was set (legacy drafts)
    let examId = draft.targetExamId;

    if (!examId) {
      const newExam = await tx.exam.create({
        data: {
          title: draft.title,
          session: draft.session,
          paper: draft.paper,
          language: draft.language,
        },
      });
      examId = newExam.id;
    }

    for (const draftQuestion of draft.questions) {
      const question = await tx.question.create({
        data: {
          examId: examId,
          questionNo: draftQuestion.questionNo,
          type: "MCQ_SINGLE",
          stem: draftQuestion.stem,
          stemImageUrl: draftQuestion.stemImageUrl ?? null,
          correctAnswer: draftQuestion.correctAnswer ?? "a",
          explanation: null,
          sourcePage: draftQuestion.sourcePage ? String(draftQuestion.sourcePage) : null,
        },
      });

      if (draftQuestion.choices.length > 0) {
        await tx.choice.createMany({
          data: draftQuestion.choices.map((choice) => ({
            questionId: question.id,
            label: choice.label,
            text: choice.text,
            sortOrder: choice.sortOrder,
          })),
        });
      }

      if (draftQuestion.attachments.length > 0) {
        await tx.attachment.createMany({
          data: draftQuestion.attachments.map((attachment) => ({
            questionId: question.id,
            type: attachment.type,
            url: attachment.url,
            caption: attachment.caption,
            width: attachment.width,
            height: attachment.height,
            sortOrder: attachment.sortOrder,
            createdAt: attachment.createdAt,
          })),
        });
      }
    }

    await tx.importDraft.update({
      where: { id: draft.id },
      data: {
        status: "PUBLISHED",
        publishedExamId: examId,
      },
    });

    return examId;
  });

  return NextResponse.json({ examId: result });
}
