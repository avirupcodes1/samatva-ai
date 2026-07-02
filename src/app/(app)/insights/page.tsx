import { Moon, Activity, SmilePlus, CalendarCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { MoodChart, type MoodPoint } from "@/components/MoodChart";
import { WeeklySummary } from "@/components/WeeklySummary";
import { moodEmoji, moodLabel } from "@/lib/utils";

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const moods = await db.getMoods(user.id);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const avgMood = avg(moods.map((m) => m.mood));
  const avgStress = avg(moods.map((m) => m.stress));
  const sleepValues = moods.map((m) => m.sleepHours).filter((s): s is number => s != null);
  const avgSleep = avg(sleepValues);

  const chartData: MoodPoint[] = moods.slice(-30).map((m) => ({
    label: new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    mood: m.mood,
  }));

  // mood distribution (how many check-ins at each level)
  const dist = [1, 2, 3, 4, 5].map((v) => moods.filter((m) => m.mood === v).length);
  const maxDist = Math.max(1, ...dist);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Insights</h1>
        <p className="text-ink-soft">Patterns from your check-ins — gently, without judgement.</p>
      </div>

      {moods.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">
          Once you start checking in, your trends and reflections will appear here. 🌱
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={CalendarCheck} label="Check-ins" value={String(moods.length)} tone="primary" />
            <Stat icon={SmilePlus} label="Avg. mood" value={`${avgMood.toFixed(1)}/5`} tone="primary" />
            <Stat icon={Activity} label="Avg. stress" value={`${avgStress.toFixed(1)}/5`} tone="danger" />
            <Stat icon={Moon} label="Avg. sleep" value={sleepValues.length ? `${avgSleep.toFixed(1)}h` : "—"} tone="accent" />
          </div>

          {/* Mood trend */}
          <div className="card p-6">
            <h2 className="mb-2 font-semibold text-ink">Mood over time</h2>
            <MoodChart data={chartData} />
          </div>

          {/* Distribution */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink">How your days have felt</h2>
            <div className="flex items-end justify-between gap-3" style={{ height: 160 }}>
              {dist.map((count, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-[var(--radius-xs)]"
                      style={{
                        height: `${(count / maxDist) * 100}%`,
                        background: `var(--color-mood-${i + 1})`,
                        minHeight: count > 0 ? 6 : 0,
                      }}
                    />
                  </div>
                  <div className="text-lg">{moodEmoji(i + 1)}</div>
                  <div className="text-xs text-ink-faint">{count}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-ink-soft">
              Most common: <strong className="text-ink">{moodLabel(dist.indexOf(Math.max(...dist)) + 1)}</strong>
            </p>
          </div>

          {/* AI weekly summary */}
          <WeeklySummary />
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone: "primary" | "danger" | "accent";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-danger-soft text-danger-strong"
      : tone === "accent"
        ? "bg-accent-soft text-accent"
        : "bg-primary-soft text-primary-strong";
  return (
    <div className="card p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClass}`}>
        <Icon size={16} />
      </span>
      <div className="mt-3 text-2xl font-bold text-ink">{value}</div>
      <div className="text-sm text-ink-soft">{label}</div>
    </div>
  );
}
