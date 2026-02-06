import { ImportDraftForm } from "@/components/admin/ImportDraftForm";
import { prisma } from "@/lib/prisma";

export default async function AdminImportPage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Import draft</h1>
      </div>
      <ImportDraftForm exams={exams} />
    </div>
  );
}
