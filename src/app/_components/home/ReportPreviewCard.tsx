"use client";

import { useTranslations } from "next-intl";

type TopicStat = {
  key: string;
  value: number;
};

type UserStats = {
  accuracy: number;
  totalAttempts: number;
  topics: TopicStat[];
} | null;

const placeholderTopics: TopicStat[] = [
  { key: "networking", value: 45 },
  { key: "database", value: 68 },
  { key: "os", value: 80 },
];

export function ReportPreviewCard({ userStats }: { userStats?: UserStats }) {
  const t = useTranslations("home");

  const isReal = !!userStats;
  const topics = userStats?.topics ?? placeholderTopics;
  const accuracy = userStats?.accuracy ?? 72;
  const attempts = userStats?.totalAttempts ?? 4;

  return (
    <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("reportPreview.title")}
          </p>
          <p className="text-sm text-slate-600">{t("reportPreview.caption")}</p>
        </div>
        {!isReal && (
          <span className="rounded-full border border-sand-200 bg-sand-100/60 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {t("reportPreview.afterSignup")}
          </span>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-100/60 p-4">
        <p className="text-xs font-semibold text-slate-500">{t("reportPreview.overallScore")}</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-semibold text-slate-900">{accuracy}%</span>
          <span className="text-xs text-slate-500">{t("reportPreview.recentAttempt")}</span>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("reportPreview.accuracyByTopic")}
          </p>
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>{isReal ? topic.key : t(`topics.${topic.key}`)}</span>
                  <span>{topic.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-sand-200/80">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${topic.value}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">
          {t("reportPreview.attemptsLast7Days")}:
        </span>{" "}
        {attempts}
      </div>
    </div>
  );
}
