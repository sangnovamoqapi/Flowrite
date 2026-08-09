import { Suspense } from "react";
import { WritingView } from "@/components/writing-view";

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#121212] flex items-center justify-center text-neutral-400 text-sm">
          Initializing writing session...
        </div>
      }
    >
      <WritingView />
    </Suspense>
  );
}
