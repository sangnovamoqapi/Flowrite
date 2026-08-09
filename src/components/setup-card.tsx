"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Type, Zap, Shuffle, ArrowRight, CornerDownRight } from "lucide-react";
import { getRandomPrompt } from "@/lib/prompts";

export function SetupCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Thread Continuation params
  const threadIdParam = searchParams.get("threadId");
  const parentIdParam = searchParams.get("parentId");
  const partParam = searchParams.get("part");
  const isContinuation = Boolean(threadIdParam);
  const nextPart = partParam ? parseInt(partParam, 10) : 1;

  // Setup state
  const [goalType, setGoalType] = useState<"time" | "words">("time");
  const [goalValue, setGoalValue] = useState<number>(300); // 5 mins in seconds OR word count
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customValueInput, setCustomValueInput] = useState<string>("5");
  const [idleSeconds, setIdleSeconds] = useState<number>(5);
  const [hardcoreMode, setHardcoreMode] = useState<boolean>(false);
  const [promptText, setPromptText] = useState<string>("");

  const handleRandomizePrompt = () => {
    setPromptText(getRandomPrompt());
  };

  const handleGoalTypeChange = (type: "time" | "words") => {
    setGoalType(type);
    setIsCustom(false);
    if (type === "time") {
      setGoalValue(300); // 5 minutes
    } else {
      setGoalValue(500); // 500 words
    }
  };

  const handlePresetClick = (value: number) => {
    setIsCustom(false);
    setGoalValue(value);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customValueInput, 10);
    if (!isNaN(val) && val > 0) {
      if (goalType === "time") {
        setGoalValue(val * 60); // convert custom mins to seconds
      } else {
        setGoalValue(val);
      }
    }
  };

  const handleBegin = () => {
    const params = new URLSearchParams({
      goalType,
      goalValue: goalValue.toString(),
      idleSeconds: idleSeconds.toString(),
      hardcore: hardcoreMode ? "1" : "0",
    });

    if (promptText) {
      params.set("prompt", promptText);
    }
    if (threadIdParam) {
      params.set("threadId", threadIdParam);
    }
    if (parentIdParam) {
      params.set("parentId", parentIdParam);
    }
    if (partParam) {
      params.set("part", partParam);
    }

    router.push(`/write?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-lg mx-auto flowrite-card p-6 sm:p-8 transition-all">
      {/* Thread Continuation Banner */}
      {isContinuation && (
        <div className="mb-6 p-3 rounded-lg bg-[#B85C38]/10 border border-[#B85C38]/20 flex items-center gap-2 text-sm text-[#B85C38] font-medium">
          <CornerDownRight className="w-4 h-4" />
          <span>Continuing thread — Part {nextPart}</span>
        </div>
      )}

      {/* 1. Goal Type Selection */}
      <div className="space-y-3 mb-6">
        <label className="text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
          Goal Type
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => handleGoalTypeChange("time")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              goalType === "time"
                ? "bg-[#B85C38] text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time</span>
          </button>
          <button
            type="button"
            onClick={() => handleGoalTypeChange("words")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              goalType === "words"
                ? "bg-[#B85C38] text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Words</span>
          </button>
        </div>
      </div>

      {/* 2. Goal Presets */}
      <div className="space-y-3 mb-6">
        <label className="text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
          {goalType === "time" ? "Minutes" : "Word Count"}
        </label>
        <div className="flex flex-wrap gap-2">
          {goalType === "time" ? (
            <>
              {[
                { label: "5 min", val: 300 },
                { label: "10 min", val: 600 },
                { label: "15 min", val: 900 },
                { label: "20 min", val: 1200 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handlePresetClick(item.val)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !isCustom && goalValue === item.val
                      ? "bg-[#B85C38] text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 hover:border-[#B85C38]/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { label: "250", val: 250 },
                { label: "500", val: 500 },
                { label: "750", val: 750 },
                { label: "1000", val: 1000 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handlePresetClick(item.val)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !isCustom && goalValue === item.val
                      ? "bg-[#B85C38] text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 hover:border-[#B85C38]/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}

          <button
            type="button"
            onClick={() => setIsCustom(!isCustom)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isCustom
                ? "bg-[#B85C38] text-white shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60"
            }`}
          >
            Custom
          </button>
        </div>

        {isCustom && (
          <form onSubmit={handleCustomSubmit} className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="50000"
              value={customValueInput}
              onChange={(e) => setCustomValueInput(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:border-[#B85C38]"
              placeholder={goalType === "time" ? "Mins" : "Words"}
            />
            <span className="text-xs text-neutral-500">
              {goalType === "time" ? "minutes" : "words"}
            </span>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg hover:bg-neutral-700"
            >
              Set
            </button>
          </form>
        )}
      </div>

      {/* 3. Danger Sensitivity Slider */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
            Danger Sensitivity
          </label>
          <span className="text-xs font-bold text-[#B85C38] bg-[#B85C38]/10 px-2 py-0.5 rounded">
            {idleSeconds}s
          </span>
        </div>

        <input
          type="range"
          min="3"
          max="15"
          step="1"
          value={idleSeconds}
          onChange={(e) => setIdleSeconds(parseInt(e.target.value, 10))}
          className="w-full accent-[#B85C38] bg-neutral-200 dark:bg-neutral-800 h-2 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-neutral-400">
          <span>Aggressive (3s)</span>
          <span>Forgiving (15s)</span>
        </div>
      </div>

      {/* 4. Hardcore Mode Toggle */}
      <div className="mb-6 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-medium text-sm text-neutral-900 dark:text-neutral-100">
            <Zap className="w-4 h-4 text-[#B85C38]" />
            <span>Hardcore Mode</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Text is masked. No Backspace. No Delete.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHardcoreMode(!hardcoreMode)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            hardcoreMode ? "bg-[#B85C38]" : "bg-neutral-300 dark:bg-neutral-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              hardcoreMode ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* 5. Prompt Picker */}
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
            Prompt (Optional)
          </label>
          <button
            type="button"
            onClick={handleRandomizePrompt}
            className="flex items-center gap-1 text-xs text-[#B85C38] hover:underline font-medium"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random</span>
          </button>
        </div>

        <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-300 italic min-h-[44px] flex items-center">
          {promptText ? (
            <span>"{promptText}"</span>
          ) : (
            <span className="text-neutral-400 not-italic">No prompt — freewrite.</span>
          )}
        </div>
      </div>

      {/* 6. Begin Button */}
      <button
        type="button"
        onClick={handleBegin}
        className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2 shadow-lg shadow-[#B85C38]/20"
      >
        <span>Begin</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
