import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserApi } from "@/lib/rbac";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  chosenOption: z.union([z.string(), z.number()]),
  timeSpentSec: z.number().int().positive().optional(),
});

const payloadSchema = z.object({
  answers: z.array(answerSchema).min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUserApi();
  if (!authResult.ok) return authResult.response;

  const resolvedParams = await params;
  const attemptId = resolvedParams.id;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, status: true, examId: true },
  });

  if (!attempt || attempt.userId !== authResult.session.user.id) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Attempt already submitted." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const answerList = parsed.answers;
  const questionIds = Array.from(new Set(answerList.map((answer) => answer.questionId)));

  const questions = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
      ...(attempt.examId ? { examId: attempt.examId } : {}),
    },
    select: { id: true, correctAnswer: true },
  });

  if (questions.length !== questionIds.length) {
    return NextResponse.json({ error: "Invalid question list." }, { status: 400 });
  }

  const correctMap = new Map(questions.map((q) => [q.id, q.correctAnswer]));
  const normalizedAnswers = answerList.map((answer) => {
    const chosen = String(answer.chosenOption).trim().toLowerCase();
    const correct = correctMap.get(answer.questionId);
    return {
      questionId: answer.questionId,
      chosenOption: chosen,
      isCorrect: correct ? chosen === correct : false,
      timeSpentSec: answer.timeSpentSec ?? null,
    };
  });

  const existing = await prisma.attemptAnswer.findMany({
    where: { attemptId, questionId: { in: questionIds } },
    select: { questionId: true },
  });
  const existingSet = new Set(existing.map((entry) => entry.questionId));

  const toCreate = normalizedAnswers.filter((answer) => !existingSet.has(answer.questionId));
  const toUpdate = normalizedAnswers.filter((answer) => existingSet.has(answer.questionId));

  await prisma.$transaction(async (tx) => {
    if (toCreate.length > 0) {
      await tx.attemptAnswer.createMany({
        data: toCreate.map((answer) => ({
          attemptId,
          questionId: answer.questionId,
          chosenOption: answer.chosenOption,
          isCorrect: answer.isCorrect,
          answeredAt: new Date(),
          timeSpentSec: answer.timeSpentSec,
        })),
        skipDuplicates: true,
      });
    }

    if (toUpdate.length > 0) {
      const casesChosen = Prisma.sql`CASE "questionId" ${Prisma.join(
        toUpdate.map((answer) => Prisma.sql`WHEN ${answer.questionId} THEN ${answer.chosenOption}`),
        Prisma.sql` `
      )} ELSE "chosenOption" END`;
      const casesCorrect = Prisma.sql`CASE "questionId" ${Prisma.join(
        toUpdate.map((answer) => Prisma.sql`WHEN ${answer.questionId} THEN ${answer.isCorrect}`),
        Prisma.sql` `
      )} ELSE "isCorrect" END`;
      const casesTime = Prisma.sql`CASE "questionId" ${Prisma.join(
        toUpdate.map((answer) => Prisma.sql`WHEN ${answer.questionId} THEN ${answer.timeSpentSec}`),
        Prisma.sql` `
      )} ELSE "timeSpentSec" END`;

      await tx.$executeRaw(
        Prisma.sql`UPDATE "AttemptAnswer"
          SET "chosenOption" = ${casesChosen},
              "isCorrect" = ${casesCorrect},
              "timeSpentSec" = ${casesTime},
              "answeredAt" = NOW()
          WHERE "attemptId" = ${attemptId}
            AND "questionId" IN (${Prisma.join(toUpdate.map((answer) => answer.questionId))})`
      );
    }
  });

  return NextResponse.json({ saved: normalizedAnswers.length });
}
