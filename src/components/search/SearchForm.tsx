"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Exam = { id: string; session: string; paper: string; title: string };

type SearchFormProps = {
  exams: Exam[];
  defaultExamId: string;
  defaultTopic: string;
  topics: string[];
  labels: {
    allExams: string;
    allTopics: string;
    search: string;
    practiceNow: string;
    selectExam: string;
  };
};

export default function SearchForm({
  exams,
  defaultExamId,
  defaultTopic,
  topics,
  labels,
}: SearchFormProps) {
  const router = useRouter();
  const [examId, setExamId] = useState(defaultExamId);
  const [topic, setTopic] = useState(defaultTopic);
  const [error, setError] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (examId) params.set("examId", examId);
    if (topic) params.set("topic", topic);
    router.push(`/search?${params.toString()}`);
  }

  function handlePractice() {
    if (!examId) {
      setError(labels.selectExam);
      return;
    }
    setError("");
    router.push(`/exam-runner?examId=${examId}`);
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
        <select
          value={examId}
          onChange={(e) => {
            setExamId(e.target.value);
            setError("");
          }}
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{labels.allExams}</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.session} {exam.paper} - {exam.title}
            </option>
          ))}
        </select>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{labels.allTopics}</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-full border border-sand-300 px-5 py-2 text-sm font-semibold hover:bg-sand-100"
        >
          {labels.search}
        </button>
        <button
          type="button"
          onClick={handlePractice}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          {labels.practiceNow}
        </button>
      </div>
      {error && (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}
