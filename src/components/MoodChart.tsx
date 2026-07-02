"use client";

import { moodColorVar } from "@/lib/utils";

export interface MoodPoint {
  label: string; // x-axis label (e.g. "Mon", "12 Jun")
  mood: number; // 1..5
}

/**
 * Dependency-free SVG line chart for mood over time. Uses a viewBox so it
 * scales fluidly to its container. Dots are coloured by mood value.
 */
export function MoodChart({ data }: { data: MoodPoint[] }) {
  const W = 640;
  const H = 220;
  const padX = 34;
  const padY = 24;

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-ink-faint">
        No check-ins yet — your mood trend will appear here.
      </div>
    );
  }

  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const yFor = (mood: number) => padY + innerH - ((mood - 1) / 4) * innerH;
  const xFor = (i: number) => padX + (data.length > 1 ? i * stepX : innerW / 2);

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.mood), ...d }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padY + innerH} ` +
    `L ${points[0].x.toFixed(1)} ${padY + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Mood over time">
      <defs>
        <linearGradient id="mood-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f9d8f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f9d8f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines for mood 1..5 */}
      {[1, 2, 3, 4, 5].map((m) => (
        <g key={m}>
          <line
            x1={padX}
            x2={W - padX}
            y1={yFor(m)}
            y2={yFor(m)}
            stroke="#e0e8e3"
            strokeWidth={1}
          />
          <text x={12} y={yFor(m) + 4} fontSize={11} fill="#8b9a94">
            {m}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#mood-area)" />
      <path d={linePath} fill="none" stroke="#0f9d8f" strokeWidth={2.5} strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5} fill={moodColorVar(p.mood)} stroke="#fff" strokeWidth={2} />
          {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0) && (
            <text x={p.x} y={H - 6} fontSize={10} fill="#8b9a94" textAnchor="middle">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
