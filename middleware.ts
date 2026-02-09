import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";

const protectedPrefixes = ["/admin", "/dashboard", "/owner"];
type AuthToken = {
  role?: string;
  status?: string;
};

function resolveLocale(req: NextRequest) {
  const cookieLocale = req.cookies.get("locale")?.value;
  if (isSupportedLocale(cookieLocale)) return cookieLocale;
  const acceptLanguage = req.headers.get("accept-language") ?? "";
  const tokens = acceptLanguage.split(",").map((part) => part.split(";")[0]?.trim());
  for (const token of tokens) {
    const normalized = token?.toLowerCase();
    if (!normalized) continue;
    if (isSupportedLocale(normalized)) return normalized;
    const base = normalized.split("-")[0];
    if (isSupportedLocale(base)) return base;
  }
  return defaultLocale;
}

function withLocaleCookie(res: NextResponse, locale: string) {
  res.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = resolveLocale(req);

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isOwner = pathname.startsWith("/owner");
  const isAdmin = pathname.startsWith("/admin");

  if (pathname === "/owner/signin") {
    return withLocaleCookie(NextResponse.next(), locale);
  }

  if (isProtected) {
    const token = (await getToken({ req })) as AuthToken | null;

    if (!token) {
      const redirectUrl = isOwner ? "/owner/signin" : "/api/auth/signin";
      return withLocaleCookie(NextResponse.redirect(new URL(redirectUrl, req.url)), locale);
    }

    if (token.status === "SUSPENDED") {
      return withLocaleCookie(NextResponse.redirect(new URL("/", req.url)), locale);
    }

    if ((isAdmin || isOwner) && token.role !== "OWNER") {
      return withLocaleCookie(NextResponse.redirect(new URL("/", req.url)), locale);
    }
  }

  return withLocaleCookie(NextResponse.next(), locale);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
