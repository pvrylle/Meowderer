"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { persistNewAchievements } from "@/components/achievement-session-toasts";
import { CatchProcessingOverlay } from "@/components/capture/catch-processing-overlay";
import { CatchReviewPanel } from "@/components/capture/catch-review-panel";
import { CatTradingCard } from "@/components/cat-trading-card";
import { InteractiveCard } from "@/components/interactive-card";
import { Camera } from "@/components/capture/camera";
import { CatButton } from "@/components/ui/cat-button";
import type { CoatClassification } from "@/lib/capture/classify-coat";
import type {
  CaptureProgress,
  ProcessedCapture,
} from "@/lib/capture/pipeline";
import {
  scaleStickerBlob,
  STICKER_SCALE_DEFAULT,
  STICKER_SCALE_MAX,
  STICKER_SCALE_MIN,
} from "@/lib/capture/scale-sticker";
import { preloadCaptureAssets } from "@/lib/capture/preload-capture";
import { uploadCapture } from "@/lib/capture/upload";
import { yieldToMain } from "@/lib/capture/yield-to-main";
import { coatToRarity, type CoatType } from "@/lib/coat-rarity";
import { DEMO_COOKIE } from "@/lib/demo";
import { getCurrentPosition, type Coords } from "@/lib/geo";
import { enqueueCapture } from "@/lib/offline-capture-queue";
import type { Rarity } from "@/lib/supabase/types";
import { saveCapture } from "./actions";

function isDemoSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${DEMO_COOKIE}=1`);
}

type Phase = "capture" | "preview" | "processing" | "review";

type LocationStatus = "idle" | "loading" | "ready" | "denied";

export default function CatchPageClient() {
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
  const [selectedCoat, setSelectedCoat] = useState<CoatType>("gray tabby");
  const [stickerScale, setStickerScale] = useState(STICKER_SCALE_DEFAULT);

  const [nickname, setNickname] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [coatClassifying, setCoatClassifying] = useState(false);

  const previewUrlRef = useRef<string | null>(null);
  const stickerUrlRef = useRef<string | null>(null);

  useEffect(() => {
    sessionStorage.removeItem("catch-chunk-retry");
  }, []);

  useEffect(() => {
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason ?? "");
      if (
        !message.includes("ChunkLoadError") &&
        !message.includes("Loading chunk")
      ) {
        return;
      }
      if (sessionStorage.getItem("catch-chunk-retry")) return;
      sessionStorage.setItem("catch-chunk-retry", "1");
      window.location.reload();
    }
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  useEffect(() => {
    void preloadCaptureAssets().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (phase === "preview") {
      void preloadCaptureAssets().catch(() => undefined);
    }
  }, [phase]);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, []);

  const revokeSticker = useCallback(() => {
    if (stickerUrlRef.current) URL.revokeObjectURL(stickerUrlRef.current);
    stickerUrlRef.current = null;
  }, []);

  const requestLocation = useCallback(async (): Promise<Coords | null> => {
    setLocationStatus("loading");
    try {
      const position = await getCurrentPosition();
      setCoords(position);
      setLocationStatus("ready");
      return position;
    } catch {
      setCoords(null);
      setLocationStatus("denied");
      return null;
    }
  }, []);

  useEffect(() => {
    if (phase === "review") {
      void requestLocation();
    }
  }, [phase, requestLocation]);

  useEffect(() => {
    setPreviewRarity(coatToRarity(selectedCoat));
  }, [selectedCoat]);

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
    setCoatClassifying(false);
    setPreviewRarity(null);
    setSelectedCoat("gray tabby");
    setStickerScale(STICKER_SCALE_DEFAULT);
    setNickname("");
    setCoords(null);
    setLocationStatus("idle");
    setPhase("capture");
  }

  async function develop() {
    if (!file) return;

    setPhase("processing");
    setProgress({ stage: "compressing", label: "Preparing…", pct: 2 });
    await yieldToMain();

    setProgress({ stage: "compressing", label: "Checking photo…", pct: 8 });
    await yieldToMain();

    try {
      await preloadCaptureAssets();

      const [{ isLikelyCat }, { processCatPhoto }] = await Promise.all([
        import("@/lib/capture/cat-guard"),
        import("@/lib/capture/pipeline"),
      ]);

      const guard = await isLikelyCat(file);
      if (!guard.ok) {
        setPhase("preview");
        toast.error(guard.reason);
        return;
      }

      const reportProgress = (update: CaptureProgress) => {
        startTransition(() => setProgress(update));
      };

      const result = await processCatPhoto(file, reportProgress);
      stickerUrlRef.current = result.stickerPreviewUrl;
      setProcessed(result);
      setPhase("review");

      setCoatClassifying(true);
      void import("@/lib/capture/classify-coat")
        .then(({ classifyCoat }) => classifyCoat(result.sticker))
        .then((coatResult) => {
          setClassification(coatResult);
          setSelectedCoat(coatResult.coat_type);
        })
        .catch(() => undefined)
        .finally(() => setCoatClassifying(false));
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

    const location = coords ?? (await requestLocation());
    if (!location) {
      toast.error("Location is required to save this catch.");
      return;
    }

    setSaving(true);
    try {
      const stickerToUpload =
        Math.abs(stickerScale - 1) < 0.02
          ? processed.sticker
          : await scaleStickerBlob(processed.sticker, stickerScale);

      const uploaded = await uploadCapture(processed.original, stickerToUpload);
      const result = await saveCapture({
        captureId: uploaded.captureId,
        photoUrl: uploaded.photoUrl,
        stickerUrl: uploaded.stickerUrl,
        nickname: nickname || null,
        lat: location.lat,
        lng: location.lng,
        coat_type: selectedCoat,
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
      const offline =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (offline && processed && location) {
        try {
          const stickerToQueue =
            Math.abs(stickerScale - 1) < 0.02
              ? processed.sticker
              : await scaleStickerBlob(processed.sticker, stickerScale);
          await enqueueCapture({
            photoBlob: processed.original,
            stickerBlob: stickerToQueue,
            nickname: nickname || null,
            lat: location.lat,
            lng: location.lng,
            coat_type: selectedCoat,
            rarity: previewRarity,
          });
          toast.success("Saved offline — will sync when you're back online.");
          router.push("/catdex");
          return;
        } catch {
          // fall through
        }
      }

      toast.error(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  const canSave = locationStatus === "ready" && coords != null;

  function adjustStickerScale(delta: number) {
    setStickerScale((current) => {
      const next = Math.round((current + delta) * 100) / 100;
      return Math.min(STICKER_SCALE_MAX, Math.max(STICKER_SCALE_MIN, next));
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between p-3 sm:p-4">
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
          <p className="text-center text-xs text-muted-foreground">
            Location is only needed when you save — you can make the sticker first.
          </p>
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
        <div className="relative min-h-0 flex-1">
          <CatchProcessingOverlay progress={progress} />
        </div>
      )}

      {phase === "review" && processed && (
        <div className="catch-review-layout">
          <div className="catch-preview-stage">
            <AnimatePresence>
              <motion.div
                key="sticker"
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="catch-preview-slot"
              >
                <div className="catch-preview-scale">
                  <InteractiveCard holoRarity={previewRarity} radiusClassName="rounded-[1.25rem]">
                    <CatTradingCard
                      name={nickname.trim() || "New friend"}
                      stickerUrl={processed.stickerPreviewUrl}
                      rarity={previewRarity}
                      coat={selectedCoat}
                      unoptimizedSticker
                      sparkle
                      stickerScale={stickerScale}
                      size="tcg"
                      className="shadow-none shadow-[0_4px_14px_rgba(58,53,80,0.1)]"
                    />
                  </InteractiveCard>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="catch-review-sheet">
            <CatchReviewPanel
              stickerScale={stickerScale}
              onStickerScaleChange={setStickerScale}
              onAdjustStickerScale={adjustStickerScale}
              selectedCoat={selectedCoat}
              onCoatChange={setSelectedCoat}
              classification={classification}
              coatClassifying={coatClassifying}
              previewRarity={previewRarity}
              nickname={nickname}
              onNicknameChange={setNickname}
              locationStatus={locationStatus}
              onRetryLocation={() => void requestLocation()}
              canSave={canSave}
              saving={saving}
              onRetake={retake}
              onSave={save}
            />
          </div>
        </div>
      )}
    </div>
  );
}
