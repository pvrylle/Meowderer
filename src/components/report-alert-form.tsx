"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { createAlertAction } from "@/app/(app)/community/actions";
import { CatButton } from "@/components/ui/cat-button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { getCurrentPosition } from "@/lib/geo";

export function ReportAlertForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [gpsOn, setGpsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    let lat: number | null = null;
    let lng: number | null = null;
    if (gpsOn) {
      try {
        const pos = await getCurrentPosition();
        lat = pos.lat;
        lng = pos.lng;
      } catch {
        toast.warning("Could not get location.");
      }
    }

    const result = await createAlertAction({
      title: title.trim(),
      body: body.trim() || undefined,
      urgent,
      lat,
      lng,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not report alert.");
      return;
    }
    toast.success("Alert reported!");
    setTitle("");
    setBody("");
    setUrgent(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-extrabold text-foreground">Report alert</h2>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What happened?"
        maxLength={120}
        className="h-12 rounded-2xl"
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Details (optional)"
        rows={3}
        maxLength={500}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="button"
        onClick={() => setUrgent((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
      >
        <span className="min-w-0 font-semibold text-foreground">Mark as urgent</span>
        <Switch checked={urgent} tone="destructive" />
      </button>
      <button
        type="button"
        onClick={() => setGpsOn((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
      >
        <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
          <MapPin className="size-5 text-primary" />
          Include location
        </span>
        <Switch checked={gpsOn} />
      </button>
      <CatButton type="submit" block loading={loading}>
        Submit alert
      </CatButton>
    </form>
  );
}
