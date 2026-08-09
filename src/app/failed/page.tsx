"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";

function FailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wordCount = searchParams.get("wordCount") || "0";

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-sm w-full animate-in fade-in zoom-in duration-300">
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Words Written
          </span>
          <div className="text-6xl font-light tracking-tight text-neutral-100 font-mono">
            {wordCount}
          </div>
        </div>

        <p className="text-sm text-neutral-400 font-light">
          Gone. Nothing saved.
        </p>

        <div className="pt-4">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try again</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#121212] flex items-center justify-center text-neutral-400">
          Loading...
        </div>
      }
    >
      <FailureContent />
    </Suspense>
  );
}
