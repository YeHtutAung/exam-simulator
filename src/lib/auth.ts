import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;

      if (user.status === "SUSPENDED") {
        return false;
      }

      if (isOwnerEmail(user.email) && user.role !== "OWNER") {
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
