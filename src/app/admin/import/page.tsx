import { ImportDraftForm } from "@/components/admin/ImportDraftForm";

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Import draft</h1>
      </div>
      <ImportDraftForm />
    </div>
  );
}
