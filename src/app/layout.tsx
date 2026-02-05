import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timekeeper",
  description: "Track time across projects with Notion and Google Sheets sync",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <h1 className="text-lg font-semibold tracking-tight">
                Timekeeper
              </h1>
              <nav className="flex gap-4 text-sm">
                <a href="/" className="hover:text-zinc-600 dark:hover:text-zinc-300">
                  Timer
                </a>
                <a href="/history" className="hover:text-zinc-600 dark:hover:text-zinc-300">
                  History
                </a>
                <a href="/projects" className="hover:text-zinc-600 dark:hover:text-zinc-300">
                  Projects
                </a>
                <a href="/settings" className="hover:text-zinc-600 dark:hover:text-zinc-300">
                  Settings
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
