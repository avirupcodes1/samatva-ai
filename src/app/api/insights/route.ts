import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { weeklySummary } from "@/lib/gemma";
import { daysUntil } from "@/lib/utils";

// Gemma 4's thinking can take a while; allow the function room to finish.
export const maxDuration = 60;

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const moods = await db.getMoods(user.id);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = moods.filter((m) => new Date(m.createdAt).getTime() >= weekAgo);

  if (recent.length === 0) {
    return NextResponse.json({
      summary:
        "You haven't checked in this week yet. Whenever you're ready, a quick check-in helps me understand how you're really doing. 💚",
      stats: { checkIns: 0, avgMood: 0, avgStress: 0, trend: "no data" },
    });
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgMood = avg(recent.map((m) => m.mood));
  const avgStress = avg(recent.map((m) => m.stress));

  // Trend: compare first vs second half of the week's check-ins.
  let trend = "steady";
  if (recent.length >= 2) {
    const mid = Math.floor(recent.length / 2);
    const firstHalf = avg(recent.slice(0, mid).map((m) => m.mood));
    const secondHalf = avg(recent.slice(mid).map((m) => m.mood));
    if (secondHalf - firstHalf > 0.4) trend = "improving";
    else if (firstHalf - secondHalf > 0.4) trend = "dipping";
  }

  const stats = {
    checkIns: recent.length,
    avgMood: Number(avgMood.toFixed(1)),
    avgStress: Number(avgStress.toFixed(1)),
    trend,
  };

  const summary = await weeklySummary(
    { avgMood, avgStress, checkIns: recent.length, trend },
    { name: user.name, exam: user.exam, daysToExam: daysUntil(user.examDate) },
  );

  return NextResponse.json({ summary, stats });
}
