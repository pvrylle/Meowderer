"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import type { Achievement } from "@/lib/achievements";

const STORAGE_KEY = "catdex-new-achievements";

export function persistNewAchievements(achievements: Achievement[]): void {
  if (achievements.length === 0) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
}

export function AchievementSessionToasts() {
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(STORAGE_KEY);

    try {
      const achievements = JSON.parse(raw) as Achievement[];
      for (const ach of achievements) {
        toast.success(`Achievement unlocked: ${ach.title}`, {
          description: ach.description ?? undefined,
          duration: 5000,
        });
      }
    } catch {
      // Ignore malformed storage.
    }
  }, []);

  return null;
}
