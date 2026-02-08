import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerApi } from "@/lib/rbac";

type Params = {
  params: Promise<{
    draftId: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;
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
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json(draft);
}
