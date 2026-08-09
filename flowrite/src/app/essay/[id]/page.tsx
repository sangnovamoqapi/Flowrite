"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  GitCommit,
  Sparkles,
  Clock,
  Type,
  Check,
  Trash2,
} from "lucide-react";
import { getLocalEssays, updateLocalEssayTitle, deleteLocalEssay, EssayModel } from "@/lib/storage";
import { formatDate, formatDuration, calculateWpm } from "@/lib/utils";

export default function EssayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [essay, setEssay] = useState<EssayModel | null>(null);
  const [allInThread, setAllInThread] = useState<EssayModel[]>([]);
  const [titleInput, setTitleInput] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  useEffect(() => {
    // 1. Local storage load
    const localList = getLocalEssays();
    const current = localList.find((e) => e.id === id);
    if (current) {
      setEssay(current);
      setTitleInput(current.title);
      setAiSummary(current.summaryText || null);
      const thread = localList.filter((e) => e.threadId === current.threadId);
      setAllInThread(thread);
    }

    // 2. API load
    fetch(`/api/essays/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEssay(data.data);
          setTitleInput(data.data.title);
          setAiSummary(data.data.summaryText || null);
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
        Loading essay...
      </div>
    );
  }

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this essay?")) return;
    deleteLocalEssay(id);
    try {
      await fetch(`/api/essays/${id}`, { method: "DELETE" });
    } catch {}
    router.push("/library");
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
      setAiSummary("Writing without inhibition builds instinctive voice and strong narrative clarity.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Library</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingTitle(!isEditingTitle)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 px-2.5 py-1 rounded bg-neutral-200/50 dark:bg-neutral-800/50"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2.5 py-1 rounded bg-red-500/10"
            title="Delete essay"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="space-y-3">
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {essay.title || "Untitled Session"}
          </h1>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-500">
          <span>{formatDate(essay.createdAt)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[#B85C38]" />
            {essay.wordCount} words
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(essay.durationSeconds)}
          </span>
          {essay.part > 1 && (
            <>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs">
                Part {essay.part}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Essay Content Area */}
      <div className="py-4 border-t border-neutral-200 dark:border-neutral-800">
        <article className="font-serif-essay text-lg leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap space-y-4">
          {essay.body}
        </article>
      </div>

      {/* AI Reflection Banner */}
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

      {/* Bottom Action Bar */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleContinueThread}
          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 shadow-md shadow-[#B85C38]/20"
        >
          <GitCommit className="w-4.5 h-4.5" />
          <span>Continue thread</span>
        </button>

        {!aiSummary && (
          <button
            onClick={handleRequestReflection}
            disabled={isGeneratingAi}
            className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isGeneratingAi ? "Reflecting..." : "Reflect"}</span>
          </button>
        )}
      </div>

      {/* Continuations List */}
      {continuations.length > 0 && (
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-neutral-500 uppercase">
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
