import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { randomBytes } from "node:crypto";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limiter = rateLimit(`auth:forgot:${ip}`, 5, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.passwordHash && !user.deletedAt && user.status === "ACTIVE") {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email ?? email,
      subject: "Reset your Exam Simulator password",
      text: `Reset your password: ${resetUrl}`,
    });
  }

  return NextResponse.json({
    message: "If that email exists, a reset link has been sent.",
  });
}
