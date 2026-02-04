import { ExamForm } from "@/components/admin/ExamForm";

export default function NewExamPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">New exam</h1>
      </div>
      <ExamForm action="/api/exams" method="POST" submitLabel="Create exam" />
    </div>
  );
}
