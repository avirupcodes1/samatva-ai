import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { planOpinion } from "@/lib/gemma";
import { isValidDate } from "@/lib/tasks";
import { daysUntil } from "@/lib/utils";

// Gemma 4's thinking can take a while; allow the function room to finish.
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const date = String(body.date ?? "");
  if (!isValidDate(date)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });

  const tasks = await db.getTasks(user.id, date);
  const opinion = await planOpinion(
    date,
    tasks.map((t) => ({ title: t.title, startTime: t.startTime, endTime: t.endTime, done: t.done })),
    { name: user.name, exam: user.exam, daysToExam: daysUntil(user.examDate) },
  );
  return NextResponse.json({ opinion });
}
