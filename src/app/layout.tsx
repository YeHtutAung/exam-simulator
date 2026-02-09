import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_JP, Noto_Sans_Myanmar } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { getServerAuthSession } from "@/lib/auth";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

const notoSans = Noto_Sans_JP({
  variable: "--font-sans",
  subsets: ["latin", "japanese"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansMyanmar = Noto_Sans_Myanmar({
  variable: "--font-myanmar",
  subsets: ["myanmar"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Exam Simulator",
  description: "Practice Japanese FE exam questions with fast search and clean UI.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${notoSansMyanmar.variable} min-h-screen bg-sand text-slate-900`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="border-b border-sand-300/70 bg-white/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Exam Simulator
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <LanguageToggle />
                <ThemeToggle />
                <HeaderUserMenu session={session} />
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
          <footer className="border-t border-sand-300/70 py-8">
            <div className="mx-auto w-full max-w-6xl px-6 text-sm text-slate-600">
              Built for focused FE exam practice. No sign-in required.
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
