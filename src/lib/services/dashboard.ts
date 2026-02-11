import { prisma } from "@/lib/prisma";
import { getSuggestionsForUser } from "@/lib/services/suggestions";

export async function getUserDashboard(userId: string) {
  const [attemptStats, attempts, inProgressRaw] = await Promise.all([
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
    prisma.attempt.findMany({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        exam: { select: { id: true, title: true, session: true, paper: true, durationMinutes: true } },
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

  // Filter out expired in-progress attempts
  const inProgressAttempts = inProgressRaw
    .filter((a) => {
      if (!a.exam) return false;
      const durationSec = (a.exam.durationMinutes ?? 150) * 60;
      const elapsed = Math.floor((Date.now() - new Date(a.startedAt).getTime()) / 1000);
      return elapsed < durationSec;
    })
    .map((a) => ({
      id: a.id,
      startedAt: a.startedAt,
      exam: a.exam
        ? {
            id: a.exam.id,
            title: a.exam.title,
            session: a.exam.session,
            paper: a.exam.paper,
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
    inProgressAttempts,
    suggestions,
  };
}
