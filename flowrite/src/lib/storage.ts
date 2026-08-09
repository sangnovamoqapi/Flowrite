export interface EssayModel {
  id: string;
  userId?: string | null;
  threadId: string;
  parentId?: string | null;
  part: number;
  title: string;
  body: string;
  goalType: "time" | "words";
  goalValue: number;
  wordCount: number;
  durationSeconds: number;
  hardcoreMode: boolean;
  prompt?: string | null;
  summaryText?: string | null;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = "flowrite_essays_v1";

export function getLocalEssays(): EssayModel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalEssay(essay: EssayModel): void {
  if (typeof window === "undefined") return;
  const essays = getLocalEssays();
  const existingIdx = essays.findIndex((e) => e.id === essay.id);
  if (existingIdx >= 0) {
    essays[existingIdx] = essay;
  } else {
    essays.unshift(essay);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(essays));
}

export function updateLocalEssayTitle(id: string, newTitle: string): void {
  if (typeof window === "undefined") return;
  const essays = getLocalEssays();
  const essay = essays.find((e) => e.id === id);
  if (essay) {
    essay.title = newTitle;
    essay.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(essays));
  }
}

export function deleteLocalEssay(id: string): void {
  if (typeof window === "undefined") return;
  const essays = getLocalEssays().filter((e) => e.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(essays));
}
