import { getServerAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function getVerifiedUser() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });

  return user;
}

export async function requireUser() {
  const user = await getVerifiedUser();
  if (!user) {
    redirect("/api/auth/signin");
  }
  if (user.status === "SUSPENDED") {
    redirect("/");
  }
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "OWNER") {
    redirect("/?error=owner");
  }
  return user;
}

export async function requireUserApi() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.status === "SUSPENDED") {
    return { ok: false, response: NextResponse.json({ error: "Suspended" }, { status: 403 }) };
  }
  return { ok: true, session, user };
}

export async function requireOwnerApi() {
  const result = await requireUserApi();
  if (!result.ok) return result;
  if (result.user.role !== "OWNER") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
