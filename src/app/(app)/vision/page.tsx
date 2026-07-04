"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, Sparkles, Loader2, ShieldCheck, X } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import { VISION_KINDS, type VisionEntry, type VisionKind } from "@/lib/types";

/** Downscale + compress client-side so uploads stay small (fast + cheap). */
async function fileToResizedDataUrl(file: File, maxDim = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.7);
}

export default function VisionPage() {
  const [kind, setKind] = useState<VisionKind>("timetable");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<VisionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/vision")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setImage(await fileToResizedDataUrl(file));
    } catch {
      setError("Couldn't read that image. Try another photo.");
    }
  }

  async function analyze() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setEntries((prev) => [data.entry, ...prev]);
      setImage(null); // discard the image from the UI too
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const activeKind = VISION_KINDS.find((k) => k.id === kind)!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <ImageUp className="text-accent" /> Show &amp; reflect
        </h1>
        <p className="text-ink-soft">
          Share a photo and Samatva will look at it with you — powered by Gemma&nbsp;4 vision.
        </p>
      </div>

      {/* Kind picker */}
      <div className="grid gap-3 sm:grid-cols-3">
        {VISION_KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "card p-4 text-left transition",
              k.id === kind ? "ring-2 ring-primary" : "hover:shadow-[var(--shadow-lift)]",
            )}
          >
            <div className="text-2xl">{k.emoji}</div>
            <div className="mt-1 font-semibold text-ink">{k.label}</div>
            <div className="text-xs text-ink-faint">{k.hint}</div>
          </button>
        ))}
      </div>

      {/* Uploader */}
      <div className="card p-6">
        {image ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="preview" className="mx-auto max-h-72 rounded-[var(--radius-sm)]" />
            <button
              onClick={() => {
                setImage(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white"
              aria-label="Remove"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-border-strong py-10 text-ink-soft transition hover:border-primary hover:text-primary-strong"
          >
            <ImageUp size={28} />
            <span className="font-medium">Tap to upload or take a photo</span>
            <span className="text-xs text-ink-faint">of your {activeKind.label.toLowerCase()}</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="hidden"
        />

        {error && (
          <p className="mt-3 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger-strong">
            {error}
          </p>
        )}

        <button className="btn btn-primary mt-4 w-full" onClick={analyze} disabled={busy || !image}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {busy ? "Looking…" : `Reflect on my ${activeKind.label.toLowerCase()}`}
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <ShieldCheck size={13} /> Your photo is analysed, then discarded — only the reflection is saved.
        </p>
      </div>

      {/* History (reflections only) */}
      <div className="space-y-4">
        {loading ? (
          <div className="card h-20 skeleton" />
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">
            Your reflections will appear here.
          </p>
        ) : (
          entries.map((e) => {
            const k = VISION_KINDS.find((x) => x.id === e.kind);
            return (
              <div key={e.id} className="card p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="chip">{k?.emoji} {k?.label}</span>
                  <span className="text-xs text-ink-faint">{relativeTime(e.createdAt)}</span>
                </div>
                <div className="flex gap-2 rounded-[var(--radius-sm)] bg-primary-soft/40 p-3">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-primary-strong" />
                  <p className="text-sm text-ink">{e.reflection}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
