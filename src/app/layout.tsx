import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  variable: "--font-sans",
  subsets: ["latin", "japanese"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Exam Simulator",
  description: "Practice Japanese FE exam questions with fast search and clean UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} min-h-screen bg-sand text-slate-900`}>
        <header className="border-b border-sand-300/70 bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Exam Simulator
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/search" className="text-slate-700 hover:text-slate-900">
                Search
              </Link>
              <Link href="/admin" className="text-slate-700 hover:text-slate-900">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
        <footer className="border-t border-sand-300/70 py-8">
          <div className="mx-auto w-full max-w-6xl px-6 text-sm text-slate-600">
            Built for focused FE exam practice. No sign-in required.
          </div>
        </footer>
      </body>
    </html>
  );
}
