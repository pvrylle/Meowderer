"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X, Check, Loader2, Cat, MapPin } from "lucide-react";
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
import type { CatTraits } from "@/lib/supabase/types";
import {
  fetchNearbyStrayCats,
  fetchStrayHint,
  findStrayMatches,
  verifyStrayMatch,
  type StrayHint,
  type StrayMatch,
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

export default function CatchPageClient({ prelinkedStrayId = null }: { prelinkedStrayId?: string | null }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("capture");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<CaptureProgress | null>(null);
  const [processed, setProcessed] = useState<ProcessedCapture | null>(null);
  const [classification, setClassification] = useState<CoatClassification | null>(
    null,
  );
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
  const [strayMatch, setStrayMatch] = useState<StrayMatch[] | null>(null);
  // If a stray ID was passed via ?stray=, pre-confirm it so the match dialog
  // is skipped and the catch is directly linked to that stray.
  const [confirmedStrayId, setConfirmedStrayId] = useState<string | null>(prelinkedStrayId);
  const [skipMatch, setSkipMatch] = useState(prelinkedStrayId !== null);
  const [strayHint, setStrayHint] = useState<StrayHint | null>(null);
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

  // Fetch the hint data for a pre-linked stray so we can show the user
  // what cat they're hunting and run proximity + similarity verification.
  useEffect(() => {
    if (!prelinkedStrayId) return;
    void fetchStrayHint(prelinkedStrayId).then(setStrayHint);
  }, [prelinkedStrayId]);

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

  // NOTE: geolocation is intentionally NOT requested automatically here.
  // Browsers require a user gesture for geolocation ("Only request geolocation
  // in response to a user gesture"), so location is requested only when the
  // user taps "Add location" in the review panel.

  // Rarity shown while reviewing is derived from the selected coat. The server
  // recomputes the authoritative rarity on save, so this is display-only.
  const previewRarity = coatToRarity(selectedCoat);

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
    setConfirmedStrayId(prelinkedStrayId);
    setSkipMatch(prelinkedStrayId !== null);
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

  async function performSave(
    strayCatId: string | null,
    locationOverride?: Coords | null,
  ) {
    if (!processed) return;

    // Location is optional — save with whatever we have (may be null).
    const location =
      locationOverride !== undefined ? locationOverride : coords;

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
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
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

    // Location is optional and opt-in via the "Add location" button in the
    // review panel. We never auto-request it here — browsers require a user
    // gesture for geolocation, and we don't want a surprise prompt on Save.
    const location = coords;

    setSaving(true);

    // When catching a pre-linked stray, verify GPS proximity + embedding
    // similarity before allowing the save. This ensures the user actually
    // photographed the right cat at the right location.
    if (prelinkedStrayId && strayHint) {
      const vec = embedding ?? (await computeImageEmbedding(processed.sticker));
      setEmbedding(vec);

      if (location) {
        const verify = verifyStrayMatch(strayHint, vec, location.lat, location.lng);
        if (!verify.ok) {
          toast.error(verify.reason);
          setSaving(false);
          return;
        }
      } else {
        // No GPS at all — GPS proximity is required for pre-linked catches.
        toast.error("Location is needed to verify you found the right cat. Please enable GPS and try again.");
        setSaving(false);
        return;
      }
    }

    // Stray-cat matching needs coordinates, so only run it when we have them.
    if (location && !skipMatch && !confirmedStrayId) {
      try {
        const vec = embedding ?? (await computeImageEmbedding(processed.sticker));
        setEmbedding(vec);
        const candidates = await fetchNearbyStrayCats(location.lat, location.lng);
        const matches = findStrayMatches(vec, location.lat, location.lng, candidates);
        if (matches.length > 0) {
          setStrayMatch(matches);
          setSaving(false);
          return;
        }
      } catch {
        // Continue without match prompt
      }
    }

    await performSave(confirmedStrayId, location);
  }

  function handleMatchConfirm(pickedId: string) {
    setConfirmedStrayId(pickedId);
    setStrayMatch(null);
    setSaving(true);
    void performSave(pickedId);
  }

  function handleMatchNewCat() {
    setSkipMatch(true);
    setStrayMatch(null);
    setSaving(true);
    void performSave(null);
  }

  // Location is optional, so a catch can always be saved once processed.
  const canSave = !saving;

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
          matches={strayMatch}
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

      {/* Pre-linked stray hint card */}
      {prelinkedStrayId && phase !== "review" && (
        <div className="mx-3 mb-1 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          {/* Blurred sticker thumbnail */}
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
            {strayHint?.cover_sticker_url ? (
              <Image
                src={strayHint.cover_sticker_url}
                alt=""
                fill
                className="scale-110 object-contain p-1 blur-sm"
                sizes="56px"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl">🐱</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-lg">🔒</span>
            </div>
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {strayHint?.canonical_name?.trim() || "Mystery stray"}
            </p>
            {strayHint?.coat_type && (
              <p className="text-[10px] capitalize text-muted-foreground">
                {strayHint.coat_type} coat
              </p>
            )}
            {strayHint?.place_label && (
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="size-2.5 shrink-0" />
                <span className="truncate">{strayHint.place_label}</span>
              </p>
            )}
            <p className="mt-1 text-[10px] font-semibold text-primary">
              Get close, then snap a photo to unlock
            </p>
          </div>
        </div>
      )}

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
