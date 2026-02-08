import { prisma } from "@/lib/prisma";
import { HomePageClient } from "@/app/_components/home/HomePageClient";

export default async function HomePage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return <HomePageClient exams={exams} />;
}
