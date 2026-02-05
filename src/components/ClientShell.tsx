"use client";

import { type ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Timer" },
  { href: "/history", label: "History" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

export default function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Timekeeper
            </Link>

            {/* Desktop nav */}
            <nav className="hidden gap-4 text-sm sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 ${
                    pathname === link.href
                      ? "font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="flex flex-col gap-1 sm:hidden p-2"
              aria-label="Toggle navigation"
            >
              <span className={`block h-0.5 w-5 bg-current transition-transform ${mobileNavOpen ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition-opacity ${mobileNavOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition-transform ${mobileNavOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </button>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <nav className="flex flex-col border-t border-zinc-200 dark:border-zinc-800 sm:hidden">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                    pathname === link.href
                      ? "font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
