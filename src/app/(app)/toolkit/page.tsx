"use client";

import { useEffect, useRef, useState } from "react";
import { Wind, Hand, Timer, Play, Pause, RotateCcw, ArrowRight } from "lucide-react";
import { BreathingExercise } from "@/components/BreathingExercise";
import { cn } from "@/lib/utils";

type Tab = "breathe" | "ground" | "focus";

export default function ToolkitPage() {
  const [tab, setTab] = useState<Tab>("breathe");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Calm toolkit</h1>
        <p className="text-ink-soft">Quick techniques for when the pressure builds.</p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === "breathe"} onClick={() => setTab("breathe")} icon={Wind} label="Breathe" />
        <TabButton active={tab === "ground"} onClick={() => setTab("ground")} icon={Hand} label="Grounding" />
        <TabButton active={tab === "focus"} onClick={() => setTab("focus")} icon={Timer} label="Focus" />
      </div>

      <div className="card p-8">
        {tab === "breathe" && <BreathingExercise />}
        {tab === "ground" && <Grounding />}
        {tab === "focus" && <FocusTimer />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] py-2.5 text-sm font-semibold transition",
        active ? "bg-primary text-on-primary" : "bg-surface text-ink-soft hover:text-ink border border-border",
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

/* ---- 5-4-3-2-1 grounding ------------------------------------------- */
const GROUND_STEPS = [
  { count: 5, sense: "see", prompt: "Name 5 things you can see around you.", emoji: "👀" },
  { count: 4, sense: "feel", prompt: "Notice 4 things you can physically feel.", emoji: "✋" },
  { count: 3, sense: "hear", prompt: "Listen for 3 sounds you can hear.", emoji: "👂" },
  { count: 2, sense: "smell", prompt: "Find 2 things you can smell.", emoji: "👃" },
  { count: 1, sense: "taste", prompt: "Notice 1 thing you can taste.", emoji: "👅" },
];

function Grounding() {
  const [step, setStep] = useState(-1); // -1 = intro

  if (step === -1) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="text-4xl">🌿</span>
        <h2 className="mt-3 text-lg font-semibold text-ink">5-4-3-2-1 grounding</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">
          A gentle way to come back to the present when anxiety spikes. We&apos;ll move through your
          five senses, one at a time.
        </p>
        <button className="btn btn-primary mt-6" onClick={() => setStep(0)}>
          Begin <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (step >= GROUND_STEPS.length) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="text-4xl">💚</span>
        <h2 className="mt-3 text-lg font-semibold text-ink">Nicely done</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">
          Notice how your body feels now compared to a minute ago. You can return here anytime.
        </p>
        <button className="btn btn-ghost mt-6" onClick={() => setStep(-1)}>
          <RotateCcw size={16} /> Start over
        </button>
      </div>
    );
  }

  const s = GROUND_STEPS[step];
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-6xl font-bold text-primary">{s.count}</div>
      <div className="mt-1 text-3xl">{s.emoji}</div>
      <p className="mt-4 max-w-sm text-lg font-medium text-ink">{s.prompt}</p>
      <div className="mt-6 flex items-center gap-2">
        {GROUND_STEPS.map((_, i) => (
          <span
            key={i}
            className={cn("h-2 w-2 rounded-full", i <= step ? "bg-primary" : "bg-border-strong")}
          />
        ))}
      </div>
      <button className="btn btn-primary mt-6" onClick={() => setStep((v) => v + 1)}>
        {step === GROUND_STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ---- Focus (Pomodoro) timer ---------------------------------------- */
function FocusTimer() {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = mode === "focus" ? 25 * 60 : 5 * 60;

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const next = mode === "focus" ? "break" : "focus";
          setMode(next);
          setRunning(false);
          return next === "focus" ? 25 * 60 : 5 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, mode]);

  function switchMode(next: "focus" | "break") {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setMode(next);
    setSecondsLeft(next === "focus" ? 25 * 60 : 5 * 60);
  }

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const pct = ((total - secondsLeft) / total) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => switchMode("focus")}
          className={cn("rounded-full px-4 py-1.5 text-sm font-semibold", mode === "focus" ? "bg-primary text-on-primary" : "bg-surface-soft text-ink-soft")}
        >
          Focus · 25m
        </button>
        <button
          onClick={() => switchMode("break")}
          className={cn("rounded-full px-4 py-1.5 text-sm font-semibold", mode === "break" ? "bg-accent text-white" : "bg-surface-soft text-ink-soft")}
        >
          Break · 5m
        </button>
      </div>

      <div className="relative flex h-56 w-56 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e8e3" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={mode === "focus" ? "#0f9d8f" : "#7c6ce0"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(1 - pct / 100) * 2 * Math.PI * 45}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center">
          <div className="text-5xl font-bold tabular-nums text-ink">{mm}:{ss}</div>
          <div className="text-sm capitalize text-ink-faint">{mode} time</div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? "Pause" : "Start"}
        </button>
        <button className="btn btn-ghost" onClick={() => switchMode(mode)}>
          <RotateCcw size={18} /> Reset
        </button>
      </div>
    </div>
  );
}
