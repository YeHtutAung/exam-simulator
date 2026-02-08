import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/rbac";
import { getUserById } from "@/lib/services/users";
import { UserDetailForm } from "@/components/admin/UserDetailForm";
import { PageHeader } from "@/components/PageHeader";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  await requireOwner();
  const resolved = await params;
  const user = await getUserById(resolved.id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User detail" fallbackHref="/owner/users" />
      <p className="-mt-2 text-sm text-slate-500">{user.email ?? "No email"}</p>

      <UserDetailForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        }}
      />
    </div>
  );
}
