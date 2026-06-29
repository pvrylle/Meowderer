"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Camera as CameraIcon } from "lucide-react";

import { CatButton } from "@/components/ui/cat-button";

export function Camera({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
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
      } catch {
        setUnavailable(true);
      }
    }

    void start();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
          onCapture(
            new File([blob], `cat-${Date.now()}.jpg`, { type: "image/jpeg" }),
          );
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-foreground/95">
        {!unavailable && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        {!ready && !unavailable && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Starting camera...
          </div>
        )}
        {unavailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white/80">
            <CameraIcon className="size-8" />
            <p className="text-sm">Camera unavailable. Upload a photo instead.</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
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
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-5" />
          Upload from gallery
        </CatButton>
      </div>
    </div>
  );
}
