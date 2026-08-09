import { Suspense } from "react";
import { SetupCard } from "@/components/setup-card";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Header Title */}
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
          Flowrite
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
          Write or lose everything.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-lg mx-auto flowrite-card p-8 h-96 flex items-center justify-center text-neutral-400">
            Loading setup...
          </div>
        }
      >
        <SetupCard />
      </Suspense>
    </div>
  );
}
