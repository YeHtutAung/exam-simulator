import { headers } from "next/headers";
import { ImportDraftReviewPanel } from "@/components/admin/ImportDraftReviewPanel";

export default async function ImportDraftDetailPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const resolvedParams = await params;
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : "";

  const response = await fetch(
    `${baseUrl}/api/admin/import/${resolvedParams.draftId}`,
    {
      cache: "no-store",
    }
  );

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

  const draft = (await response.json()) as any;

  return <ImportDraftReviewPanel initial={draft} />;
}
