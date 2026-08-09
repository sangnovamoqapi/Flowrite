"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit3,
  Copy,
  Download,
  Plus,
  GitCommit,
  Check,
  Sparkles,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { getLocalEssays, updateLocalEssayTitle, EssayModel } from "@/lib/storage";
import { calculateWpm, formatDuration, formatDate } from "@/lib/utils";

export default function DonePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [essay, setEssay] = useState<EssayModel | null>(null);
  const [allInThread, setAllInThread] = useState<EssayModel[]>([]);
  const [titleInput, setTitleInput] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch from Local Storage
    const localList = getLocalEssays();
    const current = localList.find((e) => e.id === id);

    if (current) {
      setEssay(current);
      setTitleInput(current.title);
      const thread = localList.filter((e) => e.threadId === current.threadId);
      setAllInThread(thread);
    }

    // 2. Fetch from Backend API (if Supabase connected)
    fetch(`/api/essays/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEssay(data.data);
          setTitleInput(data.data.title);
          if (data.allInThread) {
            setAllInThread(data.allInThread);
          }
        }
      })
      .catch(() => {});
  }, [id]);

  if (!essay) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">
        Loading session results...
      </div>
    );
  }

  const wpm = calculateWpm(essay.wordCount, essay.durationSeconds);
  const continuations = allInThread.filter((e) => e.id !== essay.id);

  const handleSaveTitle = async () => {
    if (!titleInput.trim()) return;
    updateLocalEssayTitle(id, titleInput);
    setEssay({ ...essay, title: titleInput });
    setIsEditingTitle(false);

    try {
      await fetch(`/api/essays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput }),
      });
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(essay.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([essay.body], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${essay.title || "essay"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleContinueThread = () => {
    const nextPart = essay.part + 1;
    router.push(
      `/?threadId=${essay.threadId}&parentId=${essay.id}&part=${nextPart}`
    );
  };

  const handleRequestReflection = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: essay.title,
          body: essay.body,
          wordCount: essay.wordCount,
          durationSeconds: essay.durationSeconds,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      setAiSummary("Freewriting under pressure strengthens core clarity and writing speed.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <Link
          href="/library"
          className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Library</span>
        </Link>
        <span className="uppercase tracking-wider font-semibold">
          Session Completed
        </span>
      </div>

      {/* Title & Stats */}
      <div className="space-y-3">
        <div className="text-xs font-semibold tracking-wider text-[#B85C38] uppercase">
          TITLE
        </div>

        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="flex-1 text-2xl sm:text-3xl font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#B85C38]"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              className="px-3 py-2 bg-[#B85C38] text-white rounded-lg text-sm font-medium hover:bg-[#c86e4a]"
            >
              Save
            </button>
          </div>
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to edit title"
          >
            {essay.title || "Untitled Session"}
          </h1>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
          <span>
            <strong className="text-[#B85C38] font-semibold">
              {essay.wordCount}
            </strong>{" "}
            words
          </span>
          <span>•</span>
          <span>
            <strong className="text-[#B85C38] font-semibold">
              {formatDuration(essay.durationSeconds)}
            </strong>{" "}
            duration
          </span>
          <span>•</span>
          <span>
            <strong className="text-[#B85C38] font-semibold">{wpm}</strong> wpm
          </span>
          {essay.part > 1 && (
            <>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Part {essay.part}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Essay Body Container */}
      <div className="flowrite-card p-6 sm:p-8">
        <div className="font-serif-essay text-base sm:text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
          {essay.body}
        </div>
      </div>

      {/* AI Reflection Banner (if generated) */}
      {aiSummary && (
        <div className="p-4 rounded-xl bg-[#B85C38]/10 border border-[#B85C38]/20 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B85C38] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Reflection</span>
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
            "{aiSummary}"
          </p>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingTitle(true)}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>

          <button
            onClick={handleCopy}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleExportTxt}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export .txt</span>
          </button>

          {!aiSummary && (
            <button
              onClick={handleRequestReflection}
              disabled={isGeneratingAi}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isGeneratingAi ? "Reflecting..." : "Reflect"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="btn-secondary text-sm py-2 px-3.5 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New session</span>
          </button>

          <button
            onClick={handleContinueThread}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 shadow-md shadow-[#B85C38]/20"
          >
            <GitCommit className="w-4 h-4" />
            <span>Continue thread</span>
          </button>
        </div>
      </div>

      {/* Continuations Section */}
      {continuations.length > 0 && (
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
            Continuations ({continuations.length})
          </h3>

          <div className="space-y-2">
            {continuations.map((cont) => (
              <Link
                key={cont.id}
                href={`/essay/${cont.id}`}
                className="block flowrite-card p-4 hover:border-[#B85C38]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    Continuation: {cont.title}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Part {cont.part}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-3">
                  <span>{cont.wordCount} words</span>
                  <span>•</span>
                  <span>{formatDate(cont.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
