import Link from "next/link";

type Props = {
  topic: string;
  accuracy: number;
  incorrectCount: number;
  totalAnswered: number;
  practiceLabel: string;
  wrongLabel: string;
};

function barColor(accuracy: number) {
  if (accuracy >= 60) return "bg-teal-500";
  if (accuracy >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default function TopicProgressBar({
  topic,
  accuracy,
  incorrectCount,
  totalAnswered,
  practiceLabel,
  wrongLabel,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{topic}</span>
        <span className="text-xs text-slate-500">{accuracy}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-sand-200">
        <div
          className={`h-2 rounded-full ${barColor(accuracy)}`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{wrongLabel}</span>
        <Link
          href={`/search?topic=${encodeURIComponent(topic)}`}
          className="rounded-full border border-sand-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-sand-100"
        >
          {practiceLabel}
        </Link>
      </div>
    </div>
  );
}
