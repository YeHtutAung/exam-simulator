import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { getUserDashboard } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getUserDashboard(user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Dashboard</p>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your progress and focus areas.
          </p>
        </div>
        <Link href="/search" className="text-sm font-semibold text-accent">
          Keep practicing
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Attempts</p>
          <p className="text-lg font-semibold">{dashboard.metrics.totalAttempts}</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Accuracy</p>
          <p className="text-lg font-semibold">{dashboard.metrics.accuracy}%</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Correct</p>
          <p className="text-lg font-semibold">{dashboard.metrics.correctCount}</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Avg score</p>
          <p className="text-lg font-semibold">
            {dashboard.metrics.averageScore ?? "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-sand-300 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent attempts</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {dashboard.attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-200 pb-3"
              >
                <div>
                  <p className="font-semibold">
                    {attempt.exam
                      ? `${attempt.exam.session} ${attempt.exam.paper} - ${attempt.exam.title}`
                      : "Practice session"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {attempt.finishedAt
                      ? new Date(attempt.finishedAt).toLocaleDateString()
                      : "In progress"}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>Score: {attempt.score ?? "-"}</p>
                  <p>
                    {attempt.correctCount}/{attempt.totalQuestions}
                  </p>
                </div>
              </div>
            ))}
            {dashboard.attempts.length === 0 && (
              <p className="text-sm text-slate-500">No attempts yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="text-sm font-semibold">Suggestions</h2>
            <div className="mt-3 space-y-3 text-sm">
              {dashboard.suggestions.weakTopics.length > 0 ? (
                dashboard.suggestions.weakTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="rounded-xl border border-sand-200 bg-sand-100 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">{topic.topic}</p>
                      <span className="text-xs font-semibold text-slate-600">
                        {topic.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {topic.incorrectCount} wrong / {topic.totalAnswered} answered
                      </span>
                      <Link
                        href={`/search?topic=${encodeURIComponent(topic.topic)}`}
                        className="rounded-full border border-sand-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        Practice
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">
                  Complete more practice to get personalized suggestions.
                </p>
              )}
              {dashboard.suggestions.trends && (
                <div className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-xs text-slate-600">
                  Accuracy trend: {dashboard.suggestions.trends.accuracyDelta >= 0 ? "+" : ""}
                  {dashboard.suggestions.trends.accuracyDelta}%
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="text-sm font-semibold">Report</h2>
            <p className="mt-2 text-xs text-slate-500">Coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
