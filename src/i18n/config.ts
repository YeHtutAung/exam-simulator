export const locales = ["en", "my"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isSupportedLocale(value?: string | null): value is Locale {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
}
