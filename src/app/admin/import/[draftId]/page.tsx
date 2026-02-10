import { ImportDraftReviewPanel } from "@/components/admin/ImportDraftReviewPanel";
import { requireOwner } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function ImportDraftDetailPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  await requireOwner();
  const resolvedParams = await params;

  const draft = await prisma.importDraft.findUnique({
    where: { id: resolvedParams.draftId },
    include: {
      questions: {
        orderBy: { questionNo: "asc" },
        include: {
          choices: {
            orderBy: { sortOrder: "asc" },
          },
          attachments: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!draft) {
    return (
      <div className="space-y-4">
        <PageHeader title="Import draft" fallbackHref="/owner/import" eyebrow="Owner Portal" />
        <div className="rounded-2xl border border-sand-300 bg-white p-6 text-sm text-slate-600">
          Draft not found.
        </div>
      </div>
    );
  }

  return <ImportDraftReviewPanel initial={draft} />;
}
