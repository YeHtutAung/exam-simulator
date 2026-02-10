import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limiter = rateLimit(`auth:reset:${ip}`, 5, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ message: "Invalid token" }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: {
      passwordHash,
      emailVerified: record.user.emailVerified ?? new Date(),
    },
  });
  await prisma.passwordResetToken.delete({ where: { token: parsed.data.token } });

  return NextResponse.json({ message: "Password updated." });
}
