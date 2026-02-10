import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/rbac";
import { getUserDashboard } from "@/lib/services/dashboard";
import AccuracyRing from "@/components/dashboard/AccuracyRing";
import MetricCard from "@/components/dashboard/MetricCard";
import ScoreHistoryChart from "@/components/dashboard/ScoreHistoryChart";
import TopicProgressBar from "@/components/dashboard/TopicProgressBar";
import EmptyDashboard from "@/components/dashboard/EmptyDashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getUserDashboard(user.id);
  const t = await getTranslations("dashboard");

  const { metrics, attempts, suggestions } = dashboard;

  // Empty state
  if (metrics.totalAttempts === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500">{t("title")}</p>
            <h1 className="text-2xl font-semibold">{t("welcome")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
          </div>
        </div>
        <EmptyDashboard
          title={t("emptyTitle")}
          subtitle={t("emptySubtitle")}
          ctaLabel={t("emptyCta")}
        />
      </div>
    );
  }

  // Derive bar chart data — chronological order (oldest first)
  const barData = [...attempts]
    .reverse()
    .map((a, i) => ({
      id: a.id,
      score: a.score,
      label: `#${i + 1}`,
    }));

  const trend = suggestions.trends
    ? { delta: suggestions.trends.accuracyDelta, label: t("trendLabel") }
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">{t("title")}</p>
          <h1 className="text-2xl font-semibold">{t("welcome")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/search" className="text-sm font-semibold text-accent">
          {t("keepPracticing")}
        </Link>
      </div>

      {/* Hero Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex items-center justify-center rounded-2xl border border-sand-300 bg-white p-6 sm:col-span-2 md:col-span-1">
          <AccuracyRing value={metrics.accuracy} label={t("accuracy")} />
        </div>
        <MetricCard
          label={t("attempts")}
          value={metrics.totalAttempts}
          trend={null}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 14V6l4-4 4 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14V8l4-4v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <MetricCard
          label={t("correct")}
          value={metrics.correctCount}
          trend={null}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <MetricCard
          label={t("avgScore")}
          value={metrics.averageScore != null ? `${metrics.averageScore}%` : "-"}
          trend={trend}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>

      {/* Score History */}
      <div className="rounded-2xl border border-sand-300 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold">{t("scoreHistory")}</h2>
        <ScoreHistoryChart attempts={barData} noDataLabel={t("noScoreData")} />
      </div>

      {/* Two columns: Recent Attempts + Weak Topics */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        {/* Recent Attempts */}
        <div className="rounded-2xl border border-sand-300 bg-white p-6">
          <h2 className="text-sm font-semibold">{t("recentAttempts")}</h2>
          <div className="mt-4 space-y-3 text-sm">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-200 pb-3"
              >
                <div>
                  <p className="font-semibold">
                    {attempt.exam
                      ? `${attempt.exam.session} ${attempt.exam.paper} - ${attempt.exam.title}`
                      : t("practiceSession")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {attempt.finishedAt
                      ? new Date(attempt.finishedAt).toLocaleDateString()
                      : t("inProgress")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      (attempt.score ?? 0) >= 60
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {attempt.score ?? "-"}%
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {attempt.correctCount}/{attempt.totalQuestions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Performance */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold">{t("topicPerformance")}</h2>
            {suggestions.allTopics.length > 0 ? (
              <div className="space-y-4">
                {suggestions.allTopics.map((topic) => (
                  <TopicProgressBar
                    key={topic.topic}
                    topic={topic.topic}
                    accuracy={topic.accuracy}
                    incorrectCount={topic.incorrectCount}
                    totalAnswered={topic.totalAnswered}
                    practiceLabel={t("practice")}
                    wrongLabel={t("wrongAnswered", { wrong: topic.incorrectCount, total: topic.totalAnswered })}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t("suggestionsEmpty")}</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold">{t("quickActions")}</h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/search"
                className="rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-strong"
              >
                {t("startExam")}
              </Link>
              <Link
                href="/search"
                className="rounded-xl border border-sand-300 px-4 py-2.5 text-center text-sm font-semibold hover:bg-sand-100"
              >
                {t("browseQuestions")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
