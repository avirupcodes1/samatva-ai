"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  key: string;
  label: string;
  seconds: number;
  scale: number; // circle scale target for this phase
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  phases: Phase[];
}

const PATTERNS: Pattern[] = [
  {
    id: "box",
    name: "Box breathing",
    description: "4-4-4-4 · calm & focus",
    phases: [
      { key: "in", label: "Breathe in", seconds: 4, scale: 1 },
      { key: "hold1", label: "Hold", seconds: 4, scale: 1 },
      { key: "out", label: "Breathe out", seconds: 4, scale: 0.55 },
      { key: "hold2", label: "Hold", seconds: 4, scale: 0.55 },
    ],
  },
  {
    id: "478",
    name: "4-7-8",
    description: "Ease anxiety & sleep",
    phases: [
      { key: "in", label: "Breathe in", seconds: 4, scale: 1 },
      { key: "hold", label: "Hold", seconds: 7, scale: 1 },
      { key: "out", label: "Breathe out", seconds: 8, scale: 0.55 },
    ],
  },
  {
    id: "calm",
    name: "Calm 4-6",
    description: "Longer exhale to settle",
    phases: [
      { key: "in", label: "Breathe in", seconds: 4, scale: 1 },
      { key: "out", label: "Breathe out", seconds: 6, scale: 0.55 },
    ],
  },
];

/**
 * The whole animation is DERIVED from a single `elapsed` seconds counter, so
 * there are no nested state updates or stale closures — phase, remaining and
 * completed cycles are all computed deterministically from elapsed.
 */
export function BreathingExercise() {
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const cycleLen = pattern.phases.reduce((s, p) => s + p.seconds, 0);
  const t = elapsed % cycleLen;
  const cycles = Math.floor(elapsed / cycleLen);

  // Walk the phases to find where `t` currently sits.
  let acc = 0;
  let phaseIdx = 0;
  let remaining = pattern.phases[0].seconds;
  for (let i = 0; i < pattern.phases.length; i++) {
    const p = pattern.phases[i];
    if (t < acc + p.seconds) {
      phaseIdx = i;
      remaining = p.seconds - (t - acc);
      break;
    }
    acc += p.seconds;
  }
  const phase = pattern.phases[phaseIdx];
  const started = running || elapsed > 0;

  function reset(p: Pattern = pattern) {
    setRunning(false);
    setPattern(p);
    setElapsed(0);
  }

  return (
    <div className="flex flex-col items-center">
      {/* pattern selector */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => reset(p)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              p.id === pattern.id
                ? "bg-primary text-on-primary shadow-[0_6px_16px_rgba(15,157,143,0.28)]"
                : "bg-surface-soft text-ink-soft hover:text-ink",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* the breathing circle */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        <span className="absolute h-full w-full rounded-full bg-primary-soft/50" />
        <span
          className="absolute rounded-full bg-gradient-to-br from-primary to-accent opacity-90"
          style={{
            height: "100%",
            width: "100%",
            transform: `scale(${started ? phase.scale : 0.7})`,
            transition: `transform ${started ? phase.seconds : 0.6}s ease-in-out`,
          }}
        />
        <div className="relative z-10 text-center text-on-primary">
          <div className="text-lg font-semibold drop-shadow">{started ? phase.label : "Ready?"}</div>
          <div className="text-4xl font-bold tabular-nums drop-shadow">{started ? remaining : "•"}</div>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-faint">{pattern.description}</p>
      <p className="text-sm text-ink-soft">Completed cycles: {cycles}</p>

      {/* controls */}
      <div className="mt-6 flex gap-3">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pause" : "Begin"}
        </button>
        <button className="btn btn-ghost" onClick={() => reset()}>
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </div>
  );
}
