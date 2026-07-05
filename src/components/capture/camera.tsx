"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Camera as CameraIcon } from "lucide-react";

import { CatButton } from "@/components/ui/cat-button";

function usePrefersGalleryFirst() {
  const [prefersGallery, setPrefersGallery] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    setPrefersGallery(coarse || narrow);
  }, []);

  return prefersGallery;
}

export function Camera({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prefersGalleryFirst = usePrefersGalleryFirst();
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const shouldRunCamera = !prefersGalleryFirst || useLiveCamera;

  useEffect(() => {
    if (!shouldRunCamera) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setReady(false);
      return;
    }

    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
        setUnavailable(false);
      } catch {
        setUnavailable(true);
        setReady(false);
      }
    }

    void start();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [shouldRunCamera]);

  function stopCamera() {
    setUseLiveCamera(false);
  }

  function openGallery() {
    galleryRef.current?.click();
  }

  function handleGalleryPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onCapture(file);
  }

  function shoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setUseLiveCamera(false);
          onCapture(
            new File([blob], `cat-${Date.now()}.jpg`, { type: "image/jpeg" }),
          );
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-foreground/95">
        {prefersGalleryFirst && !useLiveCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-white/85">
            <ImagePlus className="size-12 text-white/70" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Pick a cat photo</p>
              <p className="text-sm text-white/70">
                Choose from your gallery — same cat check and safeguards apply.
              </p>
            </div>
          </div>
        )}

        {shouldRunCamera && !unavailable && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {shouldRunCamera && !ready && !unavailable && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Starting camera...
          </div>
        )}

        {shouldRunCamera && unavailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white/80">
            <CameraIcon className="size-8" />
            <p className="text-sm">
              Camera unavailable. {prefersGalleryFirst ? "Use gallery instead." : "Upload a photo instead."}
            </p>
          </div>
        )}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        onChange={handleGalleryPick}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        {prefersGalleryFirst ? (
          <>
            {!useLiveCamera ? (
              <>
                <CatButton type="button" size="md" block onClick={openGallery}>
                  <ImagePlus className="size-5" />
                  Choose from gallery
                </CatButton>
                <CatButton
                  type="button"
                  variant="outline"
                  size="md"
                  block
                  onClick={() => setUseLiveCamera(true)}
                >
                  <CameraIcon className="size-5" />
                  Use camera instead
                </CatButton>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Take photo"
                  onClick={shoot}
                  disabled={!ready}
                  className="flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg disabled:opacity-50"
                >
                  <CameraIcon className="size-7" strokeWidth={2.2} />
                </button>
                <CatButton type="button" variant="outline" size="sm" onClick={stopCamera}>
                  Back to gallery
                </CatButton>
              </>
            )}
          </>
        ) : (
          <>
            {!unavailable && (
              <button
                type="button"
                aria-label="Take photo"
                onClick={shoot}
                disabled={!ready}
                className="flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg disabled:opacity-50"
              >
                <CameraIcon className="size-7" strokeWidth={2.2} />
              </button>
            )}
            <CatButton
              type="button"
              variant={unavailable ? "primary" : "outline"}
              size="md"
              block
              onClick={openGallery}
            >
              <ImagePlus className="size-5" />
              Upload from gallery
            </CatButton>
          </>
        )}
      </div>
    </div>
  );
}
