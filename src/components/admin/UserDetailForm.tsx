"use client";

import { useState } from "react";

type UserDetail = {
  id: string;
  name: string | null;
  email: string | null;
  role: "OWNER" | "USER";
  status: "ACTIVE" | "SUSPENDED";
};

export function UserDetailForm({ user }: { user: UserDetail }) {
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState<UserDetail["role"]>(user.role);
  const [status, setStatus] = useState<UserDetail["status"]>(user.status);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: name.trim() || undefined,
          role,
          status,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      setMessage("User updated.");
    } catch (error) {
      setMessage("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Soft delete this user?");
    if (!confirmed) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setMessage("User soft deleted.");
    } catch (error) {
      setMessage("Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-sand-300 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"
            placeholder="User name"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
          <div className="mt-2 rounded-xl border border-sand-200 bg-sand-100 px-3 py-2 text-sm text-slate-600">
            {user.email ?? "-"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Role</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserDetail["role"])}
            className="mt-2 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
            disabled={user.role === "OWNER"}
          >
            {user.role === "OWNER" ? (
              <option value="OWNER">OWNER</option>
            ) : (
              <option value="USER">USER</option>
            )}
          </select>
          {user.role === "OWNER" && (
            <p className="mt-1 text-xs text-slate-500">
              Owner role is managed via OWNER_EMAILS.
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as UserDetail["status"])}
            className="mt-2 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {message && <p className="text-xs text-slate-500">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Soft delete user"}
        </button>
      </div>
    </div>
  );
}
