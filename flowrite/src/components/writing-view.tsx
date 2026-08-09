"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { countWords, calculateWpm, formatTimeDigital } from "@/lib/utils";
import { generateId } from "@/lib/id";
import { saveLocalEssay, EssayModel } from "@/lib/storage";

export function WritingView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query params
  const goalType = (searchParams.get("goalType") as "time" | "words") || "time";
  const goalValue = parseInt(searchParams.get("goalValue") || "300", 10);
  const idleSeconds = parseInt(searchParams.get("idleSeconds") || "5", 10);
  const hardcoreMode = searchParams.get("hardcore") === "1";
  const prompt = searchParams.get("prompt") || "";

  // Thread Params
  const threadId = searchParams.get("threadId") || "";
  const parentId = searchParams.get("parentId") || "";
  const part = parseInt(searchParams.get("part") || "1", 10);

  // State
  const [text, setText] = useState<string>("");
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    goalType === "time" ? goalValue : 0
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [idleTimer, setIdleTimer] = useState<number>(idleSeconds);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastKeyTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const wordCount = countWords(text);
  const currentWpm = calculateWpm(wordCount, elapsedSeconds);

  // Focus text area on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Main game loop timer (runs every 100ms for smooth progress bar and precise pressure timing)
  useEffect(() => {
    if (!hasStarted || isEnding) return;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastKey = (now - lastKeyTimeRef.current) / 1000;
      const remainingIdle = Math.max(0, idleSeconds - timeSinceLastKey);
      setIdleTimer(remainingIdle);

      // Check for failure!
      if (timeSinceLastKey >= idleSeconds) {
        clearInterval(timerIntervalRef.current!);
        setIsEnding(true);
        // Destroy work & redirect to failure page
        router.replace(`/failed?wordCount=${wordCount}`);
        return;
      }

      // Track elapsed session time
      setElapsedSeconds((prev) => prev + 0.1);

      // Update goal countdown in time mode
      if (goalType === "time") {
        setTimeRemaining((prev) => {
          const next = prev - 0.1;
          if (next <= 0) {
            handleComplete();
          }
          return Math.max(0, next);
        });
      } else if (goalType === "words") {
        if (wordCount >= goalValue) {
          handleComplete();
        }
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [hasStarted, isEnding, idleSeconds, goalType, goalValue, wordCount]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Hardcore mode: disable Backspace & Delete
    if (hardcoreMode && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      return;
    }

    if (!hasStarted) {
      setHasStarted(true);
    }
    lastKeyTimeRef.current = Date.now();
    setIdleTimer(idleSeconds);
  };

  const handleComplete = async () => {
    if (isEnding) return;
    setIsEnding(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const essayId = generateId(8);
    const newThreadId = threadId || essayId;
    const dateStr = new Date().toISOString();

    const essayData: EssayModel = {
      id: essayId,
      threadId: newThreadId,
      parentId: parentId || null,
      part: part,
      title: `${new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })} ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      body: text,
      goalType,
      goalValue,
      wordCount,
      durationSeconds: Math.round(elapsedSeconds),
      hardcoreMode,
      prompt: prompt || null,
      createdAt: dateStr,
      updatedAt: dateStr,
    };

    // Save locally
    saveLocalEssay(essayData);

    // Also attempt POST to backend API (Supabase)
    try {
      await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(essayData),
      });
    } catch {
      // Fallback works silently via local storage
    }

    router.replace(`/done/${essayId}`);
  };

  // Calculate danger ratio (0 = safe, 1 = danger)
  const dangerRatio = 1 - idleTimer / idleSeconds;
  const isHighDanger = dangerRatio > 0.6;

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] text-neutral-100 flex flex-col justify-between selection:bg-[#B85C38]/40 selection:text-white">
      {/* 1. Top Bar & Pressure Bar */}
      <div className="w-full">
        {/* Danger Pressure Bar */}
        <div className="w-full bg-neutral-900 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              isHighDanger ? "bg-red-600 shadow-[0_0_12px_#d8432e]" : "bg-[#B85C38]"
            }`}
            style={{ width: `${(1 - dangerRatio) * 100}%` }}
          />
        </div>

        {/* Stats header */}
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-xs sm:text-sm text-neutral-400 font-medium border-b border-neutral-800/40">
          <div className="flex items-center gap-4">
            {goalType === "time" ? (
              <span>
                <strong className="text-neutral-100 text-base font-semibold">
                  {formatTimeDigital(Math.ceil(timeRemaining))}
                </strong>{" "}
                remaining
              </span>
            ) : (
              <span>
                <strong className="text-[#B85C38] text-base font-semibold">
                  {wordCount}
                </strong>{" "}
                / {goalValue} words
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            <span>
              <strong className="text-neutral-200">{wordCount}</strong> words
            </span>
            <span>
              <strong className="text-neutral-200">{currentWpm}</strong> wpm
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Writing Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 flex flex-col">
        {/* Optional Prompt Banner */}
        {prompt && (
          <div className="mb-6 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-sm text-neutral-300 italic">
            "{prompt}"
          </div>
        )}

        {!hasStarted && (
          <div className="mb-4 text-center text-xs tracking-wider text-neutral-500 uppercase font-medium animate-pulse">
            Start typing to begin... don't stop writing!
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type here..."
          className={`flex-1 w-full bg-transparent resize-none border-none outline-none font-serif-essay text-lg sm:text-xl leading-relaxed text-neutral-100 placeholder:text-neutral-700 ${
            hardcoreMode ? "select-none text-neutral-900 bg-neutral-900" : ""
          }`}
          style={
            hardcoreMode
              ? { color: "transparent", textShadow: "0 0 8px rgba(255,255,255,0.7)" }
              : {}
          }
          spellCheck="false"
        />
      </div>

      {/* 3. Bottom Status Bar */}
      <div className="py-3 px-6 text-center text-xs text-neutral-600 border-t border-neutral-900 flex justify-between items-center max-w-4xl mx-auto w-full">
        <span>Flowrite Web</span>
        {hardcoreMode && <span className="text-[#B85C38] font-medium">⚡ Hardcore Mode Active</span>}
        <span>{idleSeconds}s sensitivity</span>
      </div>
    </div>
  );
}
