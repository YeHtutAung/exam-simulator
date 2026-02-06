import { ExamRunnerResults } from "@/components/ExamRunnerResults";
import { prisma } from "@/lib/prisma";

type ExamResultsPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function ExamResultsPage({ params }: ExamResultsPageProps) {
  const resolvedParams = await params;
  const examId = resolvedParams.examId;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  const questions = await prisma.question.findMany({
    where: { examId, type: "MCQ_SINGLE" },
    orderBy: { questionNo: "asc" },
    select: {
      id: true,
      questionNo: true,
      correctAnswer: true,
    },
  });

  return (
    <ExamRunnerResults
      examId={examId}
      title={exam?.title ?? "Exam Results"}
      questions={questions.map((question) => ({
        id: question.id,
        questionNo: question.questionNo,
        correctAnswer: question.correctAnswer as "a" | "b" | "c" | "d",
      }))}
    />
  );
}
