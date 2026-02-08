import { prisma } from "@/lib/prisma";
import { HomePageClient } from "@/app/_components/home/HomePageClient";
import { getServerAuthSession } from "@/lib/auth";

export default async function HomePage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const session = await getServerAuthSession();

  return <HomePageClient exams={exams} isAuthenticated={!!session?.user} />;
}
