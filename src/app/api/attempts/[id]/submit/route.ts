import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserApi } from "@/lib/rbac";

const submitSchema = z.object({
  finishedAt: z.string().datetime().optional(),
  durationSec: z.number().int().positive().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUserApi();
  if (!authResult.ok) return authResult.response;

  const resolvedParams = await params;
  const attemptId = resolvedParams.id;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      status: true,
      examId: true,
      totalQuestions: true,
      correctCount: true,
      score: true,
      finishedAt: true,
    },
  });

  if (!attempt || attempt.userId !== authResult.session.user.id) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.status === "SUBMITTED") {
    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        score: attempt.score,
        finishedAt: attempt.finishedAt,
      },
    });
  }

  const body = await request.json().catch(() => ({}));
  let parsed: z.infer<typeof submitSchema>;
  try {
    parsed = submitSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const [correctCount, totalQuestions] = await Promise.all([
    prisma.attemptAnswer.count({
      where: { attemptId, isCorrect: true },
    }),
    attempt.totalQuestions && attempt.totalQuestions > 0
      ? Promise.resolve(attempt.totalQuestions)
      : attempt.examId
        ? prisma.question.count({ where: { examId: attempt.examId } })
        : prisma.attemptAnswer.count({ where: { attemptId } }),
  ]);

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const finishedAt = parsed.finishedAt ? new Date(parsed.finishedAt) : new Date();

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      finishedAt,
      durationSec: parsed.durationSec ?? null,
      totalQuestions,
      correctCount,
      score,
    },
    select: {
      id: true,
      status: true,
      totalQuestions: true,
      correctCount: true,
      score: true,
      finishedAt: true,
      durationSec: true,
    },
  });

  return NextResponse.json({ attempt: updated });
}
