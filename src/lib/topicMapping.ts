type TopicRange = { min: number; max: number; topic: string };

const RANGES_60: TopicRange[] = [
  { min: 1, max: 3, topic: "Discrete Math" },
  { min: 4, max: 7, topic: "Data Structures & Algorithms" },
  { min: 8, max: 17, topic: "Computer Hardware" },
  { min: 18, max: 22, topic: "Database" },
  { min: 23, max: 27, topic: "Networking" },
  { min: 28, max: 33, topic: "Security" },
  { min: 34, max: 40, topic: "Software" },
  { min: 41, max: 42, topic: "Project Management" },
  { min: 43, max: 45, topic: "Service Management" },
  { min: 46, max: 60, topic: "Business Strategy" },
];

const RANGES_80: TopicRange[] = [
  { min: 1, max: 5, topic: "Discrete Math" },
  { min: 6, max: 9, topic: "Data Structures & Algorithms" },
  { min: 10, max: 24, topic: "Computer Hardware" },
  { min: 25, max: 29, topic: "Database" },
  { min: 30, max: 35, topic: "Networking" },
  { min: 36, max: 44, topic: "Security" },
  { min: 45, max: 50, topic: "Software" },
  { min: 51, max: 55, topic: "Project Management" },
  { min: 56, max: 60, topic: "Service Management" },
  { min: 61, max: 80, topic: "Business Strategy" },
];

export function getTopicForQuestion(
  questionNo: number,
  totalQuestions: number,
): string | null {
  const ranges = totalQuestions === 60 ? RANGES_60 : totalQuestions === 80 ? RANGES_80 : null;
  if (!ranges) return null;

  const match = ranges.find((r) => questionNo >= r.min && questionNo <= r.max);
  return match?.topic ?? null;
}
