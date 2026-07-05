"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X, Check, Loader2, Cat } from "lucide-react";
import { toast } from "sonner";

import { persistNewAchievements } from "@/components/achievement-session-toasts";
import { CatchProcessingOverlay } from "@/components/capture/catch-processing-overlay";
import { CatchReviewPanel } from "@/components/capture/catch-review-panel";
import { StrayMatchDialog } from "@/components/capture/stray-match-dialog";
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
import { getCurrentPosition, GeoError, type Coords } from "@/lib/geo";
import { enqueueCapture } from "@/lib/offline-capture-queue";
import type { CatTraits, Rarity } from "@/lib/supabase/types";
import {
  fetchNearbyStrayCats,
  findBestStrayMatch,
  type StrayCatCandidate,
} from "@/lib/capture/match-stray-cat";
import { computeImageEmbedding } from "@/lib/capture/image-embedding";
import { saveCapture } from "./actions";

const DEFAULT_TRAITS: CatTraits = { chonk: 3, shy: 3, grumpy: 3, floof: 3 };

function isDemoSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${DEMO_COOKIE}=1`);
}

type Phase = "capture" | "preview" | "processing" | "review";

type LocationStatus = "idle" | "loading" | "ready" | "denied";

type CatCheckStatus = "idle" | "checking" | "passed" | "failed";

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
  const [traits, setTraits] = useState<CatTraits>(DEFAULT_TRAITS);
  const [shortDescription, setShortDescription] = useState("");
  const [sharePhoto, setSharePhoto] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationErrorCode, setLocationErrorCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coatClassifying, setCoatClassifying] = useState(false);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [strayMatch, setStrayMatch] = useState<StrayCatCandidate | null>(null);
  const [confirmedStrayId, setConfirmedStrayId] = useState<string | null>(null);
  const [skipMatch, setSkipMatch] = useState(false);
  const [catCheckStatus, setCatCheckStatus] = useState<CatCheckStatus>("idle");
  const [catCheckReason, setCatCheckReason] = useState<string | null>(null);

  const stickerUrlRef = useRef<string | null>(null);
  const catCheckGenRef = useRef(0);

  const previewUrlRef = useRef<string | null>(null);

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
    setLocationErrorCode(null);
    try {
      const position = await getCurrentPosition();
      setCoords(position);
      setLocationStatus("ready");
      return position;
    } catch (err) {
      setCoords(null);
      setLocationStatus("denied");
      setLocationErrorCode(err instanceof GeoError ? err.code : "unknown");
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

  const runCatCheck = useCallback(async (captured: File) => {
    const gen = ++catCheckGenRef.current;
    setCatCheckStatus("checking");
    setCatCheckReason(null);

    try {
      await preloadCaptureAssets();
      const { isLikelyCat } = await import("@/lib/capture/cat-guard");

      let guard = await isLikelyCat(captured);
      if (gen !== catCheckGenRef.current) return;

      if (!guard.ok && guard.reason.includes("still loading")) {
        await new Promise((r) => setTimeout(r, 800));
        if (gen !== catCheckGenRef.current) return;
        guard = await isLikelyCat(captured);
        if (gen !== catCheckGenRef.current) return;
      }

      if (!guard.ok) {
        setCatCheckStatus("failed");
        setCatCheckReason(guard.reason);
        return;
      }

      setCatCheckStatus("passed");
    } catch (err) {
      if (gen !== catCheckGenRef.current) return;
      console.warn("[catch] cat check failed:", err);
      setCatCheckStatus("failed");
      setCatCheckReason("AI is still loading — wait a moment and tap Retake.");
    }
  }, []);

  function handleCapture(captured: File) {
    revokePreview();
    const url = URL.createObjectURL(captured);
    previewUrlRef.current = url;
    setFile(captured);
    setPreviewUrl(url);
    setCatCheckStatus("idle");
    setCatCheckReason(null);
    setPhase("preview");
    void runCatCheck(captured);
  }

  function retake() {
    catCheckGenRef.current += 1;
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
    setTraits(DEFAULT_TRAITS);
    setShortDescription("");
    setSharePhoto(false);
    setShareLocation(false);
    setCoords(null);
    setEmbedding(null);
    setStrayMatch(null);
    setConfirmedStrayId(null);
    setSkipMatch(false);
    setCatCheckStatus("idle");
    setCatCheckReason(null);
    setLocationStatus("idle");
    setLocationErrorCode(null);
    setPhase("capture");
  }

  async function develop() {
    if (!file) return;

    if (catCheckStatus === "failed") {
      toast.error(catCheckReason ?? "This doesn't look like a cat.");
      return;
    }

    if (catCheckStatus === "checking") {
      toast.info("Still checking your photo…");
      return;
    }

    setPhase("processing");
    setProgress({ stage: "compressing", label: "Preparing…", pct: 2 });
    await yieldToMain();

    try {
      const { processCatPhoto } = await import("@/lib/capture/pipeline");

      if (catCheckStatus !== "passed") {
        setProgress({ stage: "compressing", label: "Checking for a cat…", pct: 8 });
        await yieldToMain();
        const { isLikelyCat } = await import("@/lib/capture/cat-guard");
        const guard = await isLikelyCat(file);
        if (!guard.ok) {
          setCatCheckStatus("failed");
          setCatCheckReason(guard.reason);
          setPhase("preview");
          toast.error(guard.reason);
          return;
        }
        setCatCheckStatus("passed");
      }

      const reportProgress = (update: CaptureProgress) => {
        startTransition(() => setProgress(update));
      };

      const result = await processCatPhoto(file, reportProgress);
      stickerUrlRef.current = result.stickerPreviewUrl;
      setProcessed(result);
      setPhase("review");

      setCoatClassifying(true);
      void computeImageEmbedding(result.sticker)
        .then(setEmbedding)
        .catch(() => setEmbedding(null));
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

  async function performSave(strayCatId: string | null) {
    if (!processed) return;

    const location = coords ?? (await requestLocation());
    if (!location) {
      toast.error("Location is required to save this catch.");
      setSaving(false);
      return;
    }

    try {
      const stickerToUpload =
        Math.abs(stickerScale - 1) < 0.02
          ? processed.sticker
          : await scaleStickerBlob(processed.sticker, stickerScale);

      const vec = embedding ?? (await computeImageEmbedding(processed.sticker));
      setEmbedding(vec);

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
        stray_cat_id: strayCatId,
        image_embedding: vec,
        traits,
        short_description: shortDescription || null,
        share_photo: sharePhoto,
        share_location: shareLocation,
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
      toast.success("Cat added to your collection!");
      router.push(`/cat/${result.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
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

    if (!skipMatch && !confirmedStrayId) {
      try {
        const vec = embedding ?? (await computeImageEmbedding(processed.sticker));
        setEmbedding(vec);
        const candidates = await fetchNearbyStrayCats(location.lat, location.lng);
        const match = findBestStrayMatch(vec, location.lat, location.lng, candidates);
        if (match) {
          setStrayMatch(match);
          setSaving(false);
          return;
        }
      } catch {
        // Continue without match prompt
      }
    }

    await performSave(confirmedStrayId);
  }

  function handleMatchConfirm() {
    if (!strayMatch) return;
    setConfirmedStrayId(strayMatch.id);
    setStrayMatch(null);
    setSaving(true);
    void performSave(strayMatch.id);
  }

  function handleMatchNewCat() {
    setSkipMatch(true);
    setStrayMatch(null);
    setSaving(true);
    void performSave(null);
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
      {strayMatch && (
        <StrayMatchDialog
          match={strayMatch}
          onConfirm={handleMatchConfirm}
          onNewCat={handleMatchNewCat}
          onCancel={() => {
            setStrayMatch(null);
            setSaving(false);
          }}
        />
      )}
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
              alt="Captured photo preview"
              className="h-full w-full object-cover"
            />
            {catCheckStatus === "checking" && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-10">
                <div className="flex items-center justify-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-foreground shadow-lg">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  AI checking for a cat…
                </div>
              </div>
            )}
            {catCheckStatus === "passed" && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-green/90 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                <Check className="size-3.5" />
                Cat detected
              </div>
            )}
          </div>

          {catCheckStatus === "failed" && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              <Cat className="mt-0.5 size-4 shrink-0" />
              <p>{catCheckReason ?? "This doesn't look like a cat — try another photo."}</p>
            </div>
          )}

          {catCheckStatus === "passed" && (
            <p className="text-center text-xs text-muted-foreground">
              Location is only needed when you save — you can make the sticker first.
            </p>
          )}

          <div className="flex gap-3">
            <CatButton variant="outline" block onClick={retake}>
              <RotateCcw className="size-5" />
              Retake
            </CatButton>
            <CatButton
              block
              onClick={develop}
              disabled={catCheckStatus !== "passed"}
            >
              {catCheckStatus === "checking"
                ? "Checking…"
                : catCheckStatus === "failed"
                  ? "Not a cat"
                  : "Use photo"}
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
                  <InteractiveCard radiusClassName="rounded-[1.25rem]">
                    <CatTradingCard
                      key={processed.stickerPreviewUrl}
                      name={nickname.trim() || "New friend"}
                      stickerUrl={processed.stickerPreviewUrl}
                      coat={selectedCoat}
                      unoptimizedSticker
                      hideRarity
                      hideStats
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
              nickname={nickname}
              onNicknameChange={setNickname}
              traits={traits}
              onTraitsChange={setTraits}
              shortDescription={shortDescription}
              onShortDescriptionChange={setShortDescription}
              sharePhoto={sharePhoto}
              onSharePhotoChange={setSharePhoto}
              shareLocation={shareLocation}
              onShareLocationChange={setShareLocation}
              locationStatus={locationStatus}
              locationErrorCode={locationErrorCode}
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
