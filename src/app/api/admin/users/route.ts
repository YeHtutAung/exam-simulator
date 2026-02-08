import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerApi } from "@/lib/rbac";
import { listUsers, softDeleteUserById, updateUserById } from "@/lib/services/users";

const updateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["OWNER", "USER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  name: z.string().min(1).max(120).optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request: Request) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");
  const query = searchParams.get("q") ?? undefined;

  const data = await listUsers({
    page: Number.isNaN(page) ? 1 : page,
    pageSize: Number.isNaN(pageSize) ? 20 : pageSize,
    query,
  });

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.role === "OWNER") {
    const existing = await getUserById(parsed.data.id);
    if (!existing || existing.role !== "OWNER") {
      return NextResponse.json(
        { error: "Cannot promote users to OWNER." },
        { status: 403 }
      );
    }
  }

  const updated = await updateUserById(parsed.data.id, {
    role: parsed.data.role,
    status: parsed.data.status,
    name: parsed.data.name,
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: Request) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await softDeleteUserById(parsed.data.id);
  return NextResponse.json({ user: updated });
}
