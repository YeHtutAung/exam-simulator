import { ExamRunner } from "@/components/ExamRunner";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function buildResumeData(
  userId: string,
  examId: string,
  durationSeconds: number,
): Promise<{ attemptId: string; startedAt: string; answers: Record<string, string> } | null> {
  const inProgress = await prisma.attempt.findFirst({
    where: { userId, examId, status: "IN_PROGRESS" },
    orderBy: { createdAt: "desc" },
    include: {
      answers: { select: { questionId: true, chosenOption: true } },
    },
  });
  if (!inProgress) return null;

  const elapsedSec = Math.floor(
    (Date.now() - new Date(inProgress.startedAt).getTime()) / 1000,
  );

  // If time has expired, auto-submit this attempt
  if (elapsedSec >= durationSeconds) {
    const correctCount = await prisma.attemptAnswer.count({
      where: { attemptId: inProgress.id, isCorrect: true },
    });
    const totalQuestions =
      inProgress.totalQuestions > 0
        ? inProgress.totalQuestions
        : await prisma.question.count({ where: { examId } });
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    await prisma.attempt.update({
      where: { id: inProgress.id },
      data: {
        status: "SUBMITTED",
        finishedAt: new Date(),
        totalQuestions,
        correctCount,
        score,
        durationSec: durationSeconds,
      },
    });
    return null; // expired — new attempt will be created
  }

  const answersMap: Record<string, string> = {};
  for (const a of inProgress.answers) {
    if (a.chosenOption) {
      answersMap[a.questionId] = a.chosenOption;
    }
  }
  return {
    attemptId: inProgress.id,
    startedAt: inProgress.startedAt.toISOString(),
    answers: answersMap,
  };
}

const demoQuestions = [
  {
    id: "demo-q1",
    questionNo: 1,
    stem: "Which TCP/IP layer does IP belong to?",
    correctAnswer: "c",
    choices: [
      { label: "a", text: "TCP" },
      { label: "b", text: "UDP" },
      { label: "c", text: "IP" },
      { label: "d", text: "HTTP" },
    ],
  },
  {
    id: "demo-q2",
    questionNo: 2,
    stem: "Which protocol is used for secure web browsing?",
    correctAnswer: "c",
    choices: [
      { label: "a", text: "FTP" },
      { label: "b", text: "HTTP" },
      { label: "c", text: "HTTPS" },
      { label: "d", text: "SMTP" },
    ],
  },
  {
    id: "demo-q3",
    questionNo: 3,
    stem: "Which tag is used to create a hyperlink in HTML?",
    correctAnswer: "b",
    choices: [
      { label: "a", text: "<div>" },
      { label: "b", text: "<a>" },
      { label: "c", text: "<span>" },
      { label: "d", text: "<p>" },
    ],
  },
  {
    id: "demo-q4",
    questionNo: 4,
    stem: "Which HTTP method is typically used to create a resource?",
    correctAnswer: "b",
    choices: [
      { label: "a", text: "GET" },
      { label: "b", text: "POST" },
      { label: "c", text: "PUT" },
      { label: "d", text: "TRACE" },
    ],
  },
  {
    id: "demo-q5",
    questionNo: 5,
    stem: "Which CSS property controls the text size?",
    correctAnswer: "a",
    choices: [
      { label: "a", text: "font-size" },
      { label: "b", text: "line-height" },
      { label: "c", text: "text-style" },
      { label: "d", text: "font-weight" },
    ],
  },
  {
    id: "demo-q6",
    questionNo: 6,
    stem: "Which protocol is used to resolve domain names?",
    correctAnswer: "b",
    choices: [
      { label: "a", text: "DHCP" },
      { label: "b", text: "DNS" },
      { label: "c", text: "ARP" },
      { label: "d", text: "ICMP" },
    ],
  },
  {
    id: "demo-q7",
    questionNo: 7,
    stem: "Which SQL clause is used to filter rows?",
    correctAnswer: "c",
    choices: [
      { label: "a", text: "ORDER BY" },
      { label: "b", text: "GROUP BY" },
      { label: "c", text: "WHERE" },
      { label: "d", text: "SELECT" },
    ],
  },
];

type ExamRunnerPageProps = {
  searchParams?: Promise<{ examId?: string; mode?: string; limit?: string; ids?: string }>;
};

export default async function ExamRunnerPage({ searchParams }: ExamRunnerPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const examId = resolvedSearchParams.examId;
  const mode = resolvedSearchParams.mode;
  const limit = Number(resolvedSearchParams.limit ?? "10");
  const idsParam = resolvedSearchParams.ids;
  const defaultDurationSeconds = 150 * 60;

  if (!examId && mode !== "latest" && mode !== "random") {
    return (
      <ExamRunner
        examId="demo"
        title="HTML Quiz"
        questions={demoQuestions}
        durationSeconds={defaultDurationSeconds}
        persistAttempts={false}
        enableTimer={false}
        summaryRedirectHref="/"
      />
    );
  }

  if (mode === "random") {
    const parsedIds = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const sourceIds =
      parsedIds.length > 0
        ? parsedIds
        : (await prisma.question.findMany({
            select: { id: true },
          })).map((entry) => entry.id);

    if (sourceIds.length === 0) {
      return (
        <ExamRunner
          examId="demo"
          title="HTML Quiz"
          questions={demoQuestions}
          durationSeconds={defaultDurationSeconds}
        />
      );
    }
    const selectedIds =
      parsedIds.length > 0
        ? parsedIds
        : sourceIds
            .map((id) => id)
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.max(1, Math.min(limit, sourceIds.length)));
    const questions = await prisma.question.findMany({
      where: { id: { in: selectedIds }, type: "MCQ_SINGLE" },
      include: { choices: { orderBy: { sortOrder: "asc" } } },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const orderedQuestions = selectedIds
      .map((id) => questionMap.get(id))
      .filter(Boolean);

    return (
      <ExamRunner
        examId="random"
        title="Random Practice"
        questions={orderedQuestions.map((question) => ({
          id: question!.id,
          questionNo: question!.questionNo,
          stem: question!.stem,
          stemImageUrl: question!.stemImageUrl ?? null,
          correctAnswer: question!.correctAnswer as "a" | "b" | "c" | "d",
          choices: question!.choices.map((choice) => ({
            label: choice.label as "a" | "b" | "c" | "d",
            text: choice.text,
          })),
        }))}
        durationSeconds={defaultDurationSeconds}
        persistAttempts={false}
        enableTimer={false}
        randomIds={selectedIds}
        summaryRedirectHref="/"
      />
    );
  }

  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/signin");
  }

  if (mode === "latest") {
    const latestExam = await prisma.exam.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!latestExam) {
      return (
        <ExamRunner
          examId="demo"
          title="HTML Quiz"
          questions={demoQuestions}
          durationSeconds={defaultDurationSeconds}
        />
      );
    }
    const latestDurationSec = (latestExam.durationMinutes ?? 150) * 60;
    const latestResumeData = await buildResumeData(
      session.user.id,
      latestExam.id,
      latestDurationSec,
    );
    return (
      <ExamRunner
        examId={latestExam.id}
        title={latestExam.title ?? "Latest Exam"}
        questions={(
          await prisma.question.findMany({
            where: { examId: latestExam.id, type: "MCQ_SINGLE" },
            include: { choices: { orderBy: { sortOrder: "asc" } } },
            orderBy: { questionNo: "asc" },
          })
        ).map((question) => ({
          id: question.id,
          questionNo: question.questionNo,
          stem: question.stem,
          stemImageUrl: question.stemImageUrl ?? null,
          correctAnswer: question.correctAnswer as "a" | "b" | "c" | "d",
          choices: question.choices.map((choice) => ({
            label: choice.label as "a" | "b" | "c" | "d",
            text: choice.text,
          })),
        }))}
        durationSeconds={latestDurationSec}
        resumeData={latestResumeData}
      />
    );
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });
  const durationMinutes =
    (exam as { durationMinutes?: number | null } | null)?.durationMinutes ?? 150;
  const examDurationSec = durationMinutes * 60;

  const questions = await prisma.question.findMany({
    where: { examId, type: "MCQ_SINGLE" },
    include: { choices: { orderBy: { sortOrder: "asc" } } },
    orderBy: { questionNo: "asc" },
  });

  const normalizedQuestions =
    questions.length >= 2
      ? questions.map((question) => ({
          id: question.id,
          questionNo: question.questionNo,
          stem: question.stem,
          stemImageUrl: question.stemImageUrl ?? null,
          correctAnswer: question.correctAnswer as "a" | "b" | "c" | "d",
          choices: question.choices.map((choice) => ({
            label: choice.label as "a" | "b" | "c" | "d",
            text: choice.text,
          })),
        }))
      : demoQuestions;

  const examResumeData = examId
    ? await buildResumeData(session.user.id, examId, examDurationSec)
    : null;

  return (
      <ExamRunner
        examId={examId}
        title={exam?.title ?? "Exam Runner"}
        questions={normalizedQuestions}
        durationSeconds={examDurationSec}
        resumeData={examResumeData}
      />
    );
}
