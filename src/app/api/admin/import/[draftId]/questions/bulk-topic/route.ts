import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerApi } from "@/lib/rbac";
import { z } from "zod";

type Params = {
  params: Promise<{
    draftId: string;
  }>;
};

const bulkTopicSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1),
  topic: z.string(),
});

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;
  const resolvedParams = await params;
  const body = await request.json();
  const parsed = bulkTopicSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { questionIds, topic } = parsed.data;

  const updated = await prisma.importDraftQuestion.updateMany({
    where: {
      id: { in: questionIds },
      draftId: resolvedParams.draftId,
    },
    data: {
      topic: topic || null,
    },
  });

  return NextResponse.json({ ok: true, count: updated.count });
}
