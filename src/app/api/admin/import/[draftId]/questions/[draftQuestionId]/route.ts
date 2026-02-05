import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importDraftQuestionSchema } from "@/lib/validators/importDraftQuestion";

type Params = {
  params: {
    draftId: string;
    draftQuestionId: string;
  };
};

function buildQuestionWarnings(payload: {
  stem: string;
  correctAnswer: string;
  choices: { a: string; b: string; c: string; d: string };
}): string[] {
  const warnings: string[] = [];
  if (!payload.stem.trim()) {
    warnings.push("Missing stem.");
  }
  if (!payload.correctAnswer) {
    warnings.push("Missing correct answer.");
  }

  const choiceWarnings = Object.entries(payload.choices).filter(
    ([, value]) => !value.trim()
  );
  if (choiceWarnings.length > 0) {
    warnings.push("Missing choice text.");
  }

  return warnings;
}

function computeDraftStatus(draft: {
  status: string;
  errors: unknown;
  warnings: unknown;
  questions: Array<{ questionNo: number; warnings: unknown }>;
}) {
  if (draft.status === "PUBLISHED") {
    return "PUBLISHED";
  }

  const errorCount = Array.isArray(draft.errors) ? draft.errors.length : 0;
  if (errorCount > 0) {
    return "FAILED";
  }

  const warningEntries: string[] = [];
  for (const question of draft.questions) {
    if (Array.isArray(question.warnings)) {
      for (const warning of question.warnings) {
        warningEntries.push(`Q${question.questionNo}: ${warning}`);
      }
    }
  }

  return warningEntries.length > 0 ? "NEEDS_REVIEW" : "READY_TO_PUBLISH";
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();
  const parsed = importDraftQuestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid question payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const draftQuestion = await prisma.importDraftQuestion.findFirst({
    where: {
      id: params.draftQuestionId,
      draftId: params.draftId,
    },
    include: {
      draft: true,
      choices: true,
    },
  });

  if (!draftQuestion) {
    return NextResponse.json({ error: "Draft question not found." }, { status: 404 });
  }

  if (draftQuestion.draft.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Published drafts cannot be edited." },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const warnings = buildQuestionWarnings(payload);

  await prisma.$transaction(async (tx) => {
    await tx.importDraftQuestion.update({
      where: { id: draftQuestion.id },
      data: {
        stem: payload.stem,
        correctAnswer: payload.correctAnswer,
        warnings: warnings.length > 0 ? warnings : null,
      },
    });

    const choiceEntries = [
      { label: "a", text: payload.choices.a, sortOrder: 1 },
      { label: "b", text: payload.choices.b, sortOrder: 2 },
      { label: "c", text: payload.choices.c, sortOrder: 3 },
      { label: "d", text: payload.choices.d, sortOrder: 4 },
    ];

    for (const choice of choiceEntries) {
      await tx.importDraftChoice.upsert({
        where: {
          draftQuestionId_label: {
            draftQuestionId: draftQuestion.id,
            label: choice.label,
          },
        },
        update: {
          text: choice.text,
          sortOrder: choice.sortOrder,
        },
        create: {
          draftQuestionId: draftQuestion.id,
          label: choice.label,
          text: choice.text,
          sortOrder: choice.sortOrder,
        },
      });
    }

    const draft = await tx.importDraft.findUnique({
      where: { id: draftQuestion.draftId },
      include: {
        questions: {
          select: { questionNo: true, warnings: true },
        },
      },
    });

    if (!draft) {
      return;
    }

    const status = computeDraftStatus(draft);
    const draftWarnings: string[] = [];
    for (const question of draft.questions) {
      if (Array.isArray(question.warnings)) {
        for (const warning of question.warnings) {
          draftWarnings.push(`Q${question.questionNo}: ${warning}`);
        }
      }
    }

    await tx.importDraft.update({
      where: { id: draft.id },
      data: {
        status,
        warnings: draftWarnings.length > 0 ? draftWarnings : null,
      },
    });
  });

  return NextResponse.json({ ok: true, warnings });
}
