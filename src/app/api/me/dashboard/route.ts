import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/rbac";
import { getUserDashboard } from "@/lib/services/dashboard";

export async function GET() {
  const authResult = await requireUserApi();
  if (!authResult.ok) return authResult.response;

  const dashboard = await getUserDashboard(authResult.session.user.id);
  return NextResponse.json(dashboard);
}
