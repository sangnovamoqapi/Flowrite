"use client";

import { useState, useEffect } from "react";
import { Sparkles, Database, Check, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";

export default function SettingsPage() {
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "local">("checking");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check DB status via API
    fetch("/api/essays")
      .then((res) => res.json())
      .then((data) => {
        if (data.dbConnected) {
          setDbStatus("connected");
        } else {
          setDbStatus("local");
        }
      })
      .catch(() => setDbStatus("local"));

    const storedAi = localStorage.getItem("flowrite_ai_enabled");
    if (storedAi !== null) {
      setAiEnabled(storedAi === "true");
    }
  }, []);

  const handleToggleAi = () => {
    const nextVal = !aiEnabled;
    setAiEnabled(nextVal);
    localStorage.setItem("flowrite_ai_enabled", String(nextVal));
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Configure AI reflection and app preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Database & Storage Settings */}
        <div className="flowrite-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              <Database className="w-4 h-4 text-[#B85C38]" />
              <span>Database & Cloud Storage</span>
            </div>

            {dbStatus === "connected" ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20 flex items-center gap-1">
                <Check className="w-3 h-3" /> Supabase Connected
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20">
                Local Storage Fallback
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-400 overflow-x-auto">
            {dbStatus === "connected"
              ? "postgresql://postgres.[ref].supabase.co:5432/postgres"
              : "Browser LocalStorage (c:\\Users\\You\\Documents\\Flowrite)"}
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            All essays are saved automatically. Point your <code className="text-[#B85C38]">DATABASE_URL</code> to Supabase in Vercel environment variables for multi-device sync and backups.
          </p>
        </div>

        {/* 2. AI Reflection Settings */}
        <div className="flowrite-card p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Reflection</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Send essays to an AI model for reflection/summary.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAi}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              aiEnabled ? "bg-[#B85C38]" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                aiEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 3. GitHub OAuth Card */}
        <div className="flowrite-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            <GithubIcon className="w-4 h-4" />
            <span>GitHub Authentication</span>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Sign in with GitHub to link your saved essay threads to your account.
          </p>

          <a
            href="/api/auth/signin"
            className="inline-flex items-center gap-2 btn-secondary text-xs py-2 px-3.5"
          >
            <span>Connect GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings saved!</span>
            </>
          ) : (
            <span>Save settings</span>
          )}
        </button>
      </div>
    </div>
  );
}
