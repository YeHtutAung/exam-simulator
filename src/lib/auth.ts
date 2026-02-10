import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { credentialsSchema } from "@/lib/validators/auth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

function parseOwnerEmails(value?: string) {
  if (!value) return new Set<string>();
  return new Set(
    value
      .split(/[,\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

const ownerEmails = parseOwnerEmails(process.env.OWNER_EMAILS ?? process.env.OWNER_EMAIL);

function isOwnerEmail(email?: string | null) {
  if (!email) return false;
  return ownerEmails.has(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req?.headers ?? null);
        const limiter = rateLimit(`auth:credentials:${ip}`, 10, 60_000);
        if (!limiter.ok) {
          return null;
        }

        const parsed = credentialsSchema.safeParse(credentials ?? {});
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;
        if (user.deletedAt) return null;
        if (user.status !== "ACTIVE") return null;
        if (!user.passwordHash) return null;
        if (!user.emailVerified) return null;

        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { status: true, deletedAt: true, role: true, email: true },
      });
      if (!dbUser || dbUser.status === "SUSPENDED" || dbUser.deletedAt) return false;

      if (isOwnerEmail(user.email) && dbUser.role !== "OWNER") {
        await prisma.user.updateMany({
          where: { email: user.email },
          data: { role: "OWNER" },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "OWNER" | "USER";
        session.user.status = token.status as "ACTIVE" | "SUSPENDED";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (isOwnerEmail(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "OWNER" },
        });
      }
    },
  },
  pages: {
    signIn: "/signin",
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
