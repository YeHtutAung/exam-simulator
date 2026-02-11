import { prisma } from "@/lib/prisma";
import { HomePageClient } from "@/app/_components/home/HomePageClient";
import { getServerAuthSession } from "@/lib/auth";
import { getUserDashboard } from "@/lib/services/dashboard";

export default async function HomePage() {
  const [exams, session] = await Promise.all([
    prisma.exam.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    getServerAuthSession(),
  ]);

  const userId = session?.user?.id;
  const dashboard = userId ? await getUserDashboard(userId) : null;

  return (
    <HomePageClient
      exams={exams}
      isAuthenticated={!!session?.user}
      userStats={
        dashboard && dashboard.metrics.totalAttempts > 0
          ? {
              accuracy: dashboard.metrics.accuracy,
              totalAttempts: dashboard.metrics.totalAttempts,
              topics: dashboard.suggestions.allTopics.map((t) => ({
                key: t.topic,
                value: t.accuracy,
              })),
            }
          : null
      }
    />
  );
}
