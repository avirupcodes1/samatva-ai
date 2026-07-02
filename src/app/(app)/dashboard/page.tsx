import Link from "next/link";
import {
  SmilePlus,
  MessageCircleHeart,
  NotebookPen,
  Wind,
  Flame,
  CalendarClock,
  Activity,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { MoodChart, type MoodPoint } from "@/components/MoodChart";
import {
  greeting,
  moodEmoji,
  moodLabel,
  daysUntil,
  dayKey,
  dateKey,
  relativeTime,
} from "@/lib/utils";

// Local-timezone day key, consistent with dayKey() used for the entries.
function keyOf(d: Date): string {
  return dateKey(d);
}

function computeStreak(days: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(keyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(keyOf(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout guards this

  const [moods, journal] = await Promise.all([db.getMoods(user.id), db.getJournal(user.id)]);

  const today = keyOf(new Date());
  const todayEntry = [...moods].reverse().find((m) => dayKey(m.createdAt) === today) ?? null;
  const checkinDays = new Set(moods.map((m) => dayKey(m.createdAt)));
  const streak = computeStreak(checkinDays);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = moods.filter((m) => new Date(m.createdAt).getTime() >= weekAgo);
  const avgStress = recent.length
    ? recent.reduce((a, m) => a + m.stress, 0) / recent.length
    : null;

  const chartData: MoodPoint[] = moods.slice(-14).map((m) => ({
    label: new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    mood: m.mood,
  }));

  const dToExam = daysUntil(user.examDate);
  const latestJournal = journal[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {greeting()}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-ink-soft">Here&apos;s how your well-being is looking.</p>
        </div>
        {dToExam != null && dToExam >= 0 && (
          <span className="chip bg-warm-soft text-[color:var(--color-warm)]">
            <CalendarClock size={14} />
            {dToExam === 0 ? "Exam is today — you've got this" : `${dToExam} days to ${user.exam}`}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <SmilePlus size={16} /> Today
          </div>
          {todayEntry ? (
            <div className="mt-2">
              <div className="text-3xl">{moodEmoji(todayEntry.mood)}</div>
              <div className="font-semibold text-ink">{moodLabel(todayEntry.mood)}</div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-ink-soft">You haven&apos;t checked in today.</p>
              <Link href="/check-in" className="btn btn-soft mt-3 text-sm">
                Check in now
              </Link>
            </div>
          )}
        </div>

        {/* Streak */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <Flame size={16} /> Check-in streak
          </div>
          <div className="mt-2 text-3xl font-bold text-ink">{streak}</div>
          <div className="text-sm text-ink-soft">{streak === 1 ? "day" : "days"} in a row</div>
        </div>

        {/* Stress */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <Activity size={16} /> Avg. stress (7d)
          </div>
          {avgStress != null ? (
            <>
              <div className="mt-2 text-3xl font-bold text-ink">{avgStress.toFixed(1)}<span className="text-base font-normal text-ink-faint">/5</span></div>
              <div className="text-sm text-ink-soft">{avgStress >= 3.5 ? "Running high — be kind to yourself" : "Nicely managed"}</div>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">No data yet.</p>
          )}
        </div>
      </div>

      {/* Mood chart */}
      <div className="card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Your mood trend</h2>
          <Link href="/insights" className="text-sm font-medium text-primary-strong hover:underline">
            See insights →
          </Link>
        </div>
        <MoodChart data={chartData} />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-semibold text-ink">Take a moment</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/check-in" icon={SmilePlus} label="Daily check-in" tone="primary" />
          <QuickAction href="/companion" icon={MessageCircleHeart} label="Talk it out" tone="accent" />
          <QuickAction href="/journal" icon={NotebookPen} label="Journal" tone="warm" />
          <QuickAction href="/toolkit" icon={Wind} label="Breathe" tone="primary" />
        </div>
      </div>

      {/* Recent journal */}
      {latestJournal && (
        <div className="card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Last journal reflection</h2>
            <span className="text-xs text-ink-faint">{relativeTime(latestJournal.createdAt)}</span>
          </div>
          <p className="line-clamp-2 text-sm text-ink-soft">“{latestJournal.content}”</p>
          <div className="mt-3 rounded-[var(--radius-sm)] bg-primary-soft/40 p-3 text-sm text-ink">
            {latestJournal.aiReply}
          </div>
          <Link href="/journal" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-strong hover:underline">
            Open journal <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  tone: "primary" | "accent" | "warm";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent-soft text-accent"
      : tone === "warm"
        ? "bg-warm-soft text-[color:var(--color-warm)]"
        : "bg-primary-soft text-primary-strong";
  return (
    <Link href={href} className="card flex items-center gap-3 p-4 transition hover:shadow-[var(--shadow-lift)]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
        <Icon size={18} />
      </span>
      <span className="font-medium text-ink">{label}</span>
    </Link>
  );
}
