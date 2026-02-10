import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getBaseUrl, sendEmail } from "@/lib/email";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limiter = rateLimit(`auth:register:${ip}`, 5, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() || null;
  const password = parsed.data.password;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({
      message: "Check your email to verify your account.",
    });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
    },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const verifyUrl = `${getBaseUrl()}/api/auth/verify?token=${token}`;
  await sendEmail({
    to: user.email ?? email,
    subject: "Verify your Exam Simulator account",
    text: `Verify your email to finish signup: ${verifyUrl}`,
  });

  return NextResponse.json({
    message: "Check your email to verify your account.",
  });
}
