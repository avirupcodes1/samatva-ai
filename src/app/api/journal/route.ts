import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { journalReflection } from "@/lib/gemma";
import { screenForCrisis, crisisResponseMessage } from "@/lib/safety";
import { uid, daysUntil } from "@/lib/utils";
import type { JournalEntry } from "@/lib/types";

// Gemma 4's thinking can take a while; allow the function room to finish.
export const maxDuration = 60;

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await db.getJournal(user.id);
  return NextResponse.json({ entries });
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

  const content = String(body.content ?? "").trim();
  if (content.length < 1)
    return NextResponse.json({ error: "Please write something first." }, { status: 400 });

  // Safety layer runs BEFORE and independently of the model.
  const safety = screenForCrisis(content);

  let aiReply: string;
  let crisis = false;
  if (safety.isCrisis) {
    crisis = true;
    aiReply = crisisResponseMessage(user.name);
  } else {
    aiReply = await journalReflection(content.slice(0, 4000), {
      name: user.name,
      exam: user.exam,
      daysToExam: daysUntil(user.examDate),
    });
  }

  const entry: JournalEntry = {
    id: uid("j_"),
    userId: user.id,
    content: content.slice(0, 4000),
    aiReply,
    crisis,
    createdAt: new Date().toISOString(),
  };
  await db.addJournal(entry);
  return NextResponse.json({ entry, crisis }, { status: 201 });
}
