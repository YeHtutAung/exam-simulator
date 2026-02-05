import Link from "next/link";
import { headers } from "next/headers";

type DraftQuestion = {
  id: string;
  questionNo: number;
  stem: string;
  correctAnswer: string | null;
  warnings: unknown;
};

type DraftResponse = {
  id: string;
  title: string;
  session: string;
  paper: string;
  language: string;
  status: string;
  errors: unknown;
  warnings: unknown;
  questions: DraftQuestion[];
};

function countList(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stemPreview(stem: string): string {
  const trimmed = stem.trim();
  if (trimmed.length <= 120) {
    return trimmed;
  }
  return `${trimmed.slice(0, 117)}...`;
}

export default async function ImportDraftDetailPage({
  params,
}: {
  params: { draftId: string };
}) {
  const headerList = headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : "";

  const response = await fetch(`${baseUrl}/api/admin/import/${params.draftId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Import draft</h1>
        <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
          Draft not found.
        </div>
      </div>
    );
  }

  const draft = (await response.json()) as DraftResponse;
  const errors = Array.isArray(draft.errors) ? draft.errors : [];
  const warnings = Array.isArray(draft.warnings) ? draft.warnings : [];
  const errorCount = errors.length;
  const warningCount = warnings.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">Import draft</h1>
          <p className="mt-1 text-sm text-slate-500">
            {draft.title} · {draft.session} {draft.paper} · {draft.language}
          </p>
        </div>
        <Link href="/admin/import" className="text-sm font-semibold text-accent">
          New import
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="text-lg font-semibold">{draft.status}</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Questions</p>
          <p className="text-lg font-semibold">{draft.questions.length}</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Issues</p>
          <p className="text-sm text-slate-600">
            {warningCount} warnings · {errorCount} errors
          </p>
        </div>
      </div>

      {(errorCount > 0 || warningCount > 0) && (
        <div className="rounded-2xl border border-sand-300 bg-white p-4 text-sm">
          {errorCount > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-red-600">Errors</p>
              <ul className="list-disc pl-5 text-red-700">
                {errors.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          )}
          {warningCount > 0 && (
            <div className="mt-3 space-y-1">
              <p className="font-semibold text-amber-700">Warnings</p>
              <ul className="list-disc pl-5 text-amber-800">
                {warnings.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Stem</th>
              <th className="px-4 py-3">Answer</th>
              <th className="px-4 py-3">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {draft.questions.map((question) => {
              const questionWarnings = countList(question.warnings);
              return (
                <tr key={question.id} className="border-t border-sand-200">
                  <td className="px-4 py-3 font-semibold">{question.questionNo}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {stemPreview(question.stem)}
                  </td>
                  <td className="px-4 py-3 uppercase">{question.correctAnswer ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{questionWarnings}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
