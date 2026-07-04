import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";

function clamp1to5(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const moods = await db.getMoods(user.id);
  return NextResponse.json({ moods });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const mood = clamp1to5(body.mood);
  const energy = clamp1to5(body.energy);
  const stress = clamp1to5(body.stress);
  if (mood === null || energy === null || stress === null)
    return NextResponse.json({ error: "Mood, energy and stress are required." }, { status: 400 });

  let sleepHours: number | null = null;
  if (body.sleepHours != null && body.sleepHours !== "") {
    const s = Number(body.sleepHours);
    if (Number.isFinite(s)) sleepHours = Math.min(24, Math.max(0, s));
  }

  // One check-in per day: creates today's entry, or updates it if it exists.
  const { entry, updated } = await db.upsertTodayMood(user.id, {
    mood,
    energy,
    stress,
    sleepHours,
    note: String(body.note ?? "").slice(0, 500),
  });
  return NextResponse.json({ entry, updated }, { status: updated ? 200 : 201 });
}
