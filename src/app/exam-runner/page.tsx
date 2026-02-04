import { ExamRunner } from "@/components/ExamRunner";
import { prisma } from "@/lib/prisma";

const demoQuestions = [
  {
    id: "demo-q1",
    stem: "Which TCP/IP layer does IP belong to?",
    choices: [
      { label: "a", text: "TCP" },
      { label: "b", text: "UDP" },
      { label: "c", text: "IP" },
      { label: "d", text: "HTTP" },
    ],
  },
  {
    id: "demo-q2",
    stem: "Which protocol is used for secure web browsing?",
    choices: [
      { label: "a", text: "FTP" },
      { label: "b", text: "HTTP" },
      { label: "c", text: "HTTPS" },
      { label: "d", text: "SMTP" },
    ],
  },
  {
    id: "demo-q3",
    stem: "Which tag is used to create a hyperlink in HTML?",
    choices: [
      { label: "a", text: "<div>" },
      { label: "b", text: "<a>" },
      { label: "c", text: "<span>" },
      { label: "d", text: "<p>" },
    ],
  },
  {
    id: "demo-q4",
    stem: "Which HTTP method is typically used to create a resource?",
    choices: [
      { label: "a", text: "GET" },
      { label: "b", text: "POST" },
      { label: "c", text: "PUT" },
      { label: "d", text: "TRACE" },
    ],
  },
  {
    id: "demo-q5",
    stem: "Which CSS property controls the text size?",
    choices: [
      { label: "a", text: "font-size" },
      { label: "b", text: "line-height" },
      { label: "c", text: "text-style" },
      { label: "d", text: "font-weight" },
    ],
  },
  {
    id: "demo-q6",
    stem: "Which protocol is used to resolve domain names?",
    choices: [
      { label: "a", text: "DHCP" },
      { label: "b", text: "DNS" },
      { label: "c", text: "ARP" },
      { label: "d", text: "ICMP" },
    ],
  },
  {
    id: "demo-q7",
    stem: "Which SQL clause is used to filter rows?",
    choices: [
      { label: "a", text: "ORDER BY" },
      { label: "b", text: "GROUP BY" },
      { label: "c", text: "WHERE" },
      { label: "d", text: "SELECT" },
    ],
  },
];

type ExamRunnerPageProps = {
  searchParams?: Promise<{ examId?: string }>;
};

export default async function ExamRunnerPage({ searchParams }: ExamRunnerPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const examId = resolvedSearchParams.examId;

  if (!examId) {
    return <ExamRunner title="HTML Quiz" questions={demoQuestions} />;
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  const questions = await prisma.question.findMany({
    where: { examId, type: "MCQ_SINGLE" },
    include: { choices: { orderBy: { sortOrder: "asc" } } },
    orderBy: { questionNo: "asc" },
  });

  const normalizedQuestions =
    questions.length > 0
      ? questions.map((question) => ({
          id: question.id,
          stem: question.stem,
          choices: question.choices.map((choice) => ({
            label: choice.label as "a" | "b" | "c" | "d",
            text: choice.text,
          })),
        }))
      : demoQuestions;

  return <ExamRunner title={exam?.title ?? "Exam Runner"} questions={normalizedQuestions} />;
}
