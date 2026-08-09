"use client";

import { signIn } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flowrite-card p-8 text-center space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Flowrite</span>
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Sign In to Flowrite
          </h1>
          <p className="text-xs text-neutral-500">
            Sync your essays across devices and back up your threads to Supabase.
          </p>
        </div>

        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white text-white font-medium"
        >
          <GithubIcon className="w-5 h-5" />
          <span>Continue with GitHub</span>
        </button>

        <p className="text-[11px] text-neutral-500">
          No GitHub account? You can continue using Flowrite in anonymous local mode without signing in.
        </p>
      </div>
    </div>
  );
}
