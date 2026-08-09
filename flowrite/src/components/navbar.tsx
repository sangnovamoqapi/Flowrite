"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Settings, PenTool, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();

  // Hide Navbar during active writing session & failure screens for zero-distraction pressure
  if (pathname === "/write" || pathname === "/failed") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 font-medium tracking-tight text-neutral-900 dark:text-neutral-100 hover:opacity-90"
        >
          <span className="text-xl font-light text-neutral-400 group-hover:text-[#B85C38] transition-colors">
            flowrite
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#B85C38]/10 text-[#B85C38] font-medium border border-[#B85C38]/20">
            web
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <PenTool className="w-4 h-4 text-[#B85C38]" />
            <span>Write</span>
          </Link>

          <Link
            href="/library"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith("/library") || pathname.startsWith("/essay")
                ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Library</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname === "/settings"
                ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
