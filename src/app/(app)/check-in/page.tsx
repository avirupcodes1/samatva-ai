"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { cn, MOOD_EMOJI, MOOD_LABELS } from "@/lib/utils";
import type { MoodEntry } from "@/lib/types";

const ENERGY_LABELS = ["Drained", "Low", "Okay", "Good", "Buzzing"];
const STRESS_LABELS = ["Calm", "Mild", "Moderate", "High", "Overwhelmed"];

export default function CheckInPage() {
  const router = useRouter();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleepHours, setSleepHours] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [wasUpdate, setWasUpdate] = useState(false);

  // If they already checked in today, prefill so this becomes an update.
  useEffect(() => {
    fetch("/api/moods")
      .then((r) => r.json())
      .then((d) => {
        const today = new Date().toISOString().slice(0, 10);
        const t = ((d.moods ?? []) as MoodEntry[]).find(
          (m) => m.createdAt.slice(0, 10) === today,
        );
        if (t) {
          setMood(t.mood);
          setEnergy(t.energy);
          setStress(t.stress);
          setSleepHours(t.sleepHours != null ? String(t.sleepHours) : "");
          setNote(t.note ?? "");
          setIsUpdate(true);
        }
      })
      .catch(() => {});
  }, []);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, energy, stress, sleepHours, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save. Try again.");
        return;
      }
      setWasUpdate(Boolean(data.updated));
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1400);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
          <Check size={30} />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">{wasUpdate ? "Updated 💚" : "Checked in 💚"}</h1>
        <p className="mt-1 text-ink-soft">Thank you for taking a moment for yourself.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Daily check-in</h1>
        <p className="text-ink-soft">
          {isUpdate
            ? "You've already checked in today — tweak it below to update."
            : "A quick, honest pulse on how you're doing right now."}
        </p>
      </div>

      {/* Mood */}
      <div className="card p-6">
        <label className="label">Overall, how are you feeling?</label>
        <div className="mt-2 flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setMood(v)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-sm)] py-3 transition",
                mood === v ? "bg-primary-soft ring-2 ring-primary" : "bg-surface-soft hover:bg-primary-soft/50",
              )}
            >
              <span className="text-2xl">{MOOD_EMOJI[v]}</span>
              <span className="text-xs font-medium text-ink-soft">{MOOD_LABELS[v]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy + Stress */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ScalePicker label="Energy level" value={energy} onChange={setEnergy} captions={ENERGY_LABELS} tone="primary" />
        <ScalePicker label="Stress level" value={stress} onChange={setStress} captions={STRESS_LABELS} tone="danger" />
      </div>

      {/* Sleep + note */}
      <div className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="sleep">Hours of sleep last night <span className="font-normal text-ink-faint">(optional)</span></label>
          <input
            id="sleep"
            type="number"
            min={0}
            max={24}
            step={0.5}
            inputMode="decimal"
            className="input"
            value={sleepHours}
            onChange={(e) => {
              // Hard-cap as the user types: 24 is the most that's valid.
              const v = e.target.value;
              if (v === "") return setSleepHours("");
              const n = Number(v);
              if (Number.isNaN(n)) return; // ignore junk keystrokes
              if (n > 24) return setSleepHours("24");
              if (n < 0) return setSleepHours("0");
              setSleepHours(v); // keep raw so "6." / "6.5" typing still works
            }}
            onBlur={(e) => {
              // Normalise on exit (e.g. trailing dot) and re-assert the 0–24 range.
              const v = e.target.value.trim();
              if (v === "") return setSleepHours("");
              const n = Number(v);
              if (Number.isNaN(n)) return setSleepHours("");
              setSleepHours(String(Math.min(24, Math.max(0, n))));
            }}
            placeholder="e.g. 6.5"
          />
        </div>
        <div>
          <label className="label" htmlFor="note">Anything on your mind? <span className="font-normal text-ink-faint">(optional)</span></label>
          <textarea
            id="note"
            className="input min-h-[90px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A word or two about your day…"
            maxLength={500}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger-strong">{error}</p>
      )}

      <button onClick={submit} className="btn btn-primary w-full" disabled={saving}>
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {saving ? "Saving…" : isUpdate ? "Update today's check-in" : "Save check-in"}
      </button>
    </div>
  );
}

function ScalePicker({
  label,
  value,
  onChange,
  captions,
  tone,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  captions: string[];
  tone: "primary" | "danger";
}) {
  const activeClass = tone === "danger" ? "bg-danger text-white" : "bg-primary text-white";
  return (
    <div className="card p-6">
      <label className="label">{label}</label>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "h-10 flex-1 rounded-[var(--radius-sm)] text-sm font-semibold transition",
              value === v ? activeClass : "bg-surface-soft text-ink-soft hover:text-ink",
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-ink-soft">{captions[value - 1]}</p>
    </div>
  );
}
