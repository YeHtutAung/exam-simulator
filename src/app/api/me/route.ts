import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireUserApi();
  if (!authResult.ok) return authResult.response;

  const user = await prisma.user.findUnique({
    where: { id: authResult.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}
