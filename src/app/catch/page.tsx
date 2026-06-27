"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { persistNewAchievements } from "@/components/achievement-session-toasts";
import { CatTradingCard } from "@/components/cat-trading-card";
import { InteractiveCard } from "@/components/interactive-card";
import { Camera } from "@/components/capture/camera";
import { CatButton } from "@/components/ui/cat-button";
import { Input } from "@/components/ui/input";
import { isLikelyCat, preloadCoatClassifier } from "@/lib/capture/cat-guard";
import {
  classifyCoat,
  type CoatClassification,
} from "@/lib/capture/classify-coat";
import {
  processCatPhoto,
  type CaptureProgress,
  type ProcessedCapture,
} from "@/lib/capture/pipeline";
import { uploadCapture } from "@/lib/capture/upload";
import { coatToRarity } from "@/lib/coat-rarity";
import { DEMO_COOKIE } from "@/lib/demo";
import { getCurrentPosition } from "@/lib/geo";
import { rarityLabel } from "@/lib/rarity";
import type { Rarity } from "@/lib/supabase/types";
import { useSettingsStore } from "@/stores/settings";
import { saveCapture } from "./actions";

function isDemoSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${DEMO_COOKIE}=1`);
}

type Phase = "capture" | "preview" | "processing" | "review";

export default function CatchPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("capture");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<CaptureProgress | null>(null);
  const [processed, setProcessed] = useState<ProcessedCapture | null>(null);
  const [classification, setClassification] = useState<CoatClassification | null>(
    null,
  );
  const [previewRarity, setPreviewRarity] = useState<Rarity | null>(null);

  const [nickname, setNickname] = useState("");
  const gpsDefaultOn = useSettingsStore((s) => s.gpsDefaultOn);
  const [gpsOverride, setGpsOverride] = useState<boolean | null>(null);
  const gpsOn = gpsOverride ?? gpsDefaultOn;
  const [saving, setSaving] = useState(false);

  const previewUrlRef = useRef<string | null>(null);
  const stickerUrlRef = useRef<string | null>(null);

  useEffect(() => {
    preloadCoatClassifier();
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, []);

  const revokeSticker = useCallback(() => {
    if (stickerUrlRef.current) URL.revokeObjectURL(stickerUrlRef.current);
    stickerUrlRef.current = null;
  }, []);

  function handleCapture(captured: File) {
    revokePreview();
    const url = URL.createObjectURL(captured);
    previewUrlRef.current = url;
    setFile(captured);
    setPreviewUrl(url);
    setPhase("preview");
  }

  function retake() {
    revokePreview();
    revokeSticker();
    setFile(null);
    setPreviewUrl(null);
    setProcessed(null);
    setClassification(null);
    setPreviewRarity(null);
    setNickname("");
    setPhase("capture");
  }

  async function develop() {
    if (!file) return;

    const guard = await isLikelyCat(file);
    if (!guard.ok) {
      toast.error(guard.reason);
      return;
    }

    setPhase("processing");
    setProgress({ stage: "compressing", label: "Compressing photo…", pct: 5 });
    try {
      const result = await processCatPhoto(file, setProgress);
      stickerUrlRef.current = result.stickerPreviewUrl;
      setProcessed(result);

      setProgress({
        stage: "finishing",
        label: "Classifying coat…",
        pct: 92,
      });
      const coatResult = await classifyCoat(result.sticker);
      setClassification(coatResult);
      setPreviewRarity(coatToRarity(coatResult.coat_type));

      setPhase("review");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not process that photo.",
      );
      setPhase("preview");
    }
  }

  async function save() {
    if (!processed) return;
    if (isDemoSession()) {
      toast.info("Demo mode — sign in to save your cats.");
      return;
    }
    setSaving(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      if (gpsOn) {
        try {
          const coords = await getCurrentPosition();
          lat = coords.lat;
          lng = coords.lng;
        } catch {
          toast.warning("Couldn't get your location. Saving without it.");
        }
      }

      const uploaded = await uploadCapture(processed.original, processed.sticker);
      const result = await saveCapture({
        photoPath: uploaded.photoPath,
        stickerPath: uploaded.stickerPath,
        stickerUrl: uploaded.stickerUrl,
        nickname: nickname || null,
        lat,
        lng,
        coat_type: classification?.coat_type ?? null,
        rarity: previewRarity,
      });

      if (!result.success) {
        toast.error(result.error);
        setSaving(false);
        return;
      }

      if (result.newAchievements.length > 0) {
        persistNewAchievements(result.newAchievements);
      }

      revokePreview();
      revokeSticker();
      toast.success("Cat added to your CatDex!");
      router.push(`/cat/${result.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between p-4">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push("/home")}
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <X className="size-5" />
        </button>
        <h1 className="font-bold text-foreground">
          {phase === "review" ? "Your new sticker" : "Catch a cat"}
        </h1>
        <span className="size-10" />
      </header>

      {phase === "capture" && <Camera onCapture={handleCapture} />}

      {phase === "preview" && previewUrl && (
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="relative flex-1 overflow-hidden rounded-3xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Captured cat"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            <CatButton variant="outline" block onClick={retake}>
              <RotateCcw className="size-5" />
              Retake
            </CatButton>
            <CatButton block onClick={develop}>
              Use photo
            </CatButton>
          </div>
        </div>
      )}

      {phase === "processing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="relative flex size-32 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-4xl">🐱</span>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <p className="font-bold text-foreground">
              {progress?.label ?? "Developing…"}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress?.pct ?? 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              All on your device — this can take a moment the first time.
            </p>
          </div>
        </div>
      )}

      {phase === "review" && processed && (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          <AnimatePresence>
            <motion.div
              key="sticker"
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="mx-auto w-full max-w-[17rem]"
            >
              <InteractiveCard holo>
                <CatTradingCard
                  name={nickname.trim() || "New friend"}
                  stickerUrl={processed.stickerPreviewUrl}
                  rarity={previewRarity}
                  coat={classification?.coat_type}
                  unoptimizedSticker
                  sparkle
                  size="lg"
                />
              </InteractiveCard>
            </motion.div>
          </AnimatePresence>

          {classification && (
            <p className="text-center text-sm text-muted-foreground">
              Detected{" "}
              <span className="font-semibold text-foreground">
                {classification.coat_type}
              </span>{" "}
              · {rarityLabel(previewRarity)}
            </p>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="text-sm font-semibold">
                Name this cat (optional)
              </label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Mittens"
                maxLength={40}
                className="h-12 rounded-2xl"
              />
            </div>

            <button
              type="button"
              onClick={() => setGpsOverride((v) => !(v ?? gpsDefaultOn))}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <span className="flex items-center gap-3">
                <MapPin className="size-5 text-primary" />
                <span className="text-left">
                  <span className="block font-semibold text-foreground">
                    Tag location
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Pin this catch on your map
                  </span>
                </span>
              </span>
              <span
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  gpsOn ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                    gpsOn ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          <div className="mt-auto flex gap-3 pt-2">
            <CatButton variant="outline" block onClick={retake} disabled={saving}>
              Retake
            </CatButton>
            <CatButton block onClick={save} loading={saving}>
              {saving ? "Saving…" : "Save to CatDex"}
            </CatButton>
          </div>
        </div>
      )}
    </div>
  );
}
