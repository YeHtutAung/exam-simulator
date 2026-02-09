import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isSupportedLocale } from "./config";

function resolveLocaleFromHeader(acceptLanguage: string | null) {
  if (!acceptLanguage) return defaultLocale;
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

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : resolveLocaleFromHeader(headerStore.get("accept-language"));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    now: new Date(),
    timeZone: "UTC",
  };
});
