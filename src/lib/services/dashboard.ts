import { prisma } from "@/lib/prisma";
import { getSuggestionsForUser } from "@/lib/services/suggestions";

export async function getUserDashboard(userId: string) {
  const [attemptStats, attempts] = await Promise.all([
    prisma.attempt.aggregate({
      where: { userId, status: "SUBMITTED" },
      _count: { id: true },
      _sum: { totalQuestions: true, correctCount: true },
      _avg: { score: true },
    }),
    prisma.attempt.findMany({
      where: { userId, status: "SUBMITTED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        exam: true,
      },
    }),
  ]);

  const totalAttempts = attemptStats._count.id ?? 0;
  const totalQuestions = attemptStats._sum.totalQuestions ?? 0;
  const correctCount = attemptStats._sum.correctCount ?? 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const averageScore = attemptStats._avg.score
    ? Math.round(attemptStats._avg.score)
    : null;

  const recentAttempts = attempts.map((attempt) => ({
    id: attempt.id,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    exam: attempt.exam
      ? {
          id: attempt.exam.id,
          title: attempt.exam.title,
          session: attempt.exam.session,
          paper: attempt.exam.paper,
          language: attempt.exam.language,
        }
      : null,
  }));

  let suggestions = {
    weakTopics: [],
    allTopics: [],
    suggestedActions: [],
  } as Awaited<ReturnType<typeof getSuggestionsForUser>>;
  try {
    suggestions = await getSuggestionsForUser(userId);
  } catch {
    suggestions = { weakTopics: [], allTopics: [], suggestedActions: [] };
  }

  return {
    metrics: {
      totalAttempts,
      totalQuestions,
      correctCount,
      accuracy,
      averageScore,
    },
    attempts: recentAttempts,
    suggestions,
  };
}
