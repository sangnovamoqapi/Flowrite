"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, BookOpen, Clock, Type, Sparkles } from "lucide-react";
import { getLocalEssays, EssayModel } from "@/lib/storage";
import { formatShortDate, formatDuration } from "@/lib/utils";

export default function LibraryPage() {
  const [essays, setEssays] = useState<EssayModel[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load local essays first
    const localList = getLocalEssays();
    setEssays(localList);
    setIsLoading(false);

    // Fetch from backend API if connected
    fetch("/api/essays")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setEssays(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredEssays = essays.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      (e.prompt && e.prompt.toLowerCase().includes(q))
    );
  });

  // Group essays by day header
  const groupedEssays = filteredEssays.reduce<Record<string, EssayModel[]>>(
    (groups, essay) => {
      const dateKey = new Date(essay.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).toUpperCase();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(essay);
      return groups;
    },
    {}
  );

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Library
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {essays.length} {essays.length === 1 ? "essay" : "essays"} saved
          </p>
        </div>

        <Link
          href="/"
          className="btn-primary text-sm py-2.5 px-4 flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New session</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your writing..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#B85C38]"
        />
      </div>

      {/* Essay List grouped by date */}
      {isLoading ? (
        <div className="py-12 text-center text-neutral-400 text-sm">
          Loading library...
        </div>
      ) : Object.keys(groupedEssays).length === 0 ? (
        <div className="flowrite-card p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-neutral-400 stroke-1" />
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">
              {searchQuery ? "No matching essays found" : "Your library is empty"}
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try a different search query."
                : "Complete a timed freewriting session without pausing to save your first piece."}
            </p>
          </div>
          {!searchQuery && (
            <Link href="/" className="inline-block btn-primary text-sm py-2 px-4 mt-2">
              Start writing
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEssays).map(([dateLabel, groupList]) => (
            <div key={dateLabel} className="space-y-3">
              <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
                {dateLabel}
              </h2>

              <div className="space-y-3">
                {groupList.map((item) => {
                  const snippet =
                    item.body.length > 140
                      ? item.body.substring(0, 140) + "..."
                      : item.body;

                  const timeStr = new Date(item.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <Link
                      key={item.id}
                      href={`/essay/${item.id}`}
                      className="block flowrite-card p-5 hover:border-[#B85C38]/50 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-[#B85C38] transition-colors">
                            {item.title || "Untitled Session"}
                          </h3>
                        </div>

                        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-serif-essay line-clamp-2 italic">
                          "{snippet}"
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {timeStr}
                          </span>

                          <span className="flex items-center gap-1">
                            <Type className="w-3.5 h-3.5" />
                            {item.wordCount} words
                          </span>

                          <span>{formatDuration(item.durationSeconds)}</span>

                          {item.part > 1 && (
                            <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-[11px]">
                              Part {item.part}
                            </span>
                          )}

                          {item.summaryText && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium text-[11px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Reflected
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
