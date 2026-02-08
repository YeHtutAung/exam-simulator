import { prisma } from "@/lib/prisma";

const DEFAULT_ATTEMPT_WINDOW = 5;
const MAX_ATTEMPT_WINDOW = 10;

type WeakTopic = {
  topic: string;
  accuracy: number;
  totalAnswered: number;
  incorrectCount: number;
};

type SuggestedAction = {
  label: string;
  href: string;
};

type Trends = {
  accuracyDelta: number;
};

type SuggestionResult = {
  weakTopics: WeakTopic[];
  suggestedActions: SuggestedAction[];
  trends?: Trends;
};

type QuestionWithMeta = {
  id: string;
  exam?: {
    title: string;
    session: string;
    paper: string;
  } | null;
  topic?: string | null;
  tag?: string | null;
  category?: string | null;
};

function getTopicLabel(question: QuestionWithMeta) {
  const topic =
    question.topic?.trim() ||
    question.tag?.trim() ||
    question.category?.trim() ||
    "";
  if (topic) return topic;
  if (question.exam) {
    return `${question.exam.session} ${question.exam.paper} - ${question.exam.title}`;
  }
  return "General";
}

function computeWeakTopics(
  answers: Array<{ isCorrect: boolean; question: QuestionWithMeta }>,
  minAnswers = 3,
  limit = 3
) {
  const map = new Map<string, { total: number; incorrect: number }>();
  for (const answer of answers) {
    const label = getTopicLabel(answer.question);
    const entry = map.get(label) ?? { total: 0, incorrect: 0 };
    entry.total += 1;
    if (!answer.isCorrect) entry.incorrect += 1;
    map.set(label, entry);
  }

  const weakTopics: WeakTopic[] = Array.from(map.entries())
    .filter(([, entry]) => entry.total >= minAnswers)
    .map(([topic, entry]) => ({
      topic,
      totalAnswered: entry.total,
      incorrectCount: entry.incorrect,
      accuracy: Math.round(((entry.total - entry.incorrect) / entry.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);

  return weakTopics;
}

function computeAttemptAccuracy(answers: Array<{ attemptId: string; isCorrect: boolean }>, attemptId: string) {
  const filtered = answers.filter((answer) => answer.attemptId === attemptId);
  if (filtered.length === 0) return null;
  const correct = filtered.filter((answer) => answer.isCorrect).length;
  return Math.round((correct / filtered.length) * 100);
}

export async function getSuggestionsForUser(userId: string, attemptWindow = DEFAULT_ATTEMPT_WINDOW): Promise<SuggestionResult> {
  const take = Math.min(Math.max(attemptWindow, 1), MAX_ATTEMPT_WINDOW);
  const attempts = await prisma.attempt.findMany({
    where: { userId, status: "SUBMITTED" },
    orderBy: { finishedAt: "desc" },
    take,
    select: {
      id: true,
      finishedAt: true,
    },
  });

  if (attempts.length === 0) {
    return { weakTopics: [], suggestedActions: [] };
  }

  const attemptIds = attempts.map((attempt) => attempt.id);
  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId: { in: attemptIds } },
    select: {
      attemptId: true,
      isCorrect: true,
      question: {
        select: {
          id: true,
          exam: {
            select: {
              title: true,
              session: true,
              paper: true,
            },
          },
        },
      },
    },
  });

  const weakTopics = computeWeakTopics(
    answers.map((answer) => ({
      isCorrect: answer.isCorrect,
      question: answer.question as QuestionWithMeta,
    }))
  );

  const suggestedActions: SuggestedAction[] = weakTopics.map((topic) => ({
    label: `Practice ${topic.topic}`,
    href: `/search?topic=${encodeURIComponent(topic.topic)}`,
  }));

  let trends: Trends | undefined = undefined;
  if (attempts.length >= 2) {
    const latest = computeAttemptAccuracy(answers, attempts[0].id);
    const previous = computeAttemptAccuracy(answers, attempts[1].id);
    if (latest !== null && previous !== null) {
      trends = { accuracyDelta: latest - previous };
    }
  }

  return {
    weakTopics,
    suggestedActions,
    trends,
  };
}
