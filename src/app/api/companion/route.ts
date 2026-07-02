import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { companionReply } from "@/lib/gemma";
import { screenForCrisis, crisisResponseMessage } from "@/lib/safety";
import { uid, daysUntil } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await db.getChat(user.id);
  return NextResponse.json({ messages });
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

  const text = String(body.message ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  // 1) Safety screen the user's message — independent of the model.
  const safety = screenForCrisis(text);

  // 2) Persist the user's message.
  const userMsg: ChatMessage = {
    id: uid("c_"),
    userId: user.id,
    role: "user",
    content: text.slice(0, 2000),
    crisis: safety.isCrisis,
    createdAt: new Date().toISOString(),
  };
  await db.addChat(userMsg);

  // 3) Produce a reply. Crisis short-circuits the model entirely.
  let replyText: string;
  if (safety.isCrisis) {
    replyText = crisisResponseMessage(user.name);
  } else {
    const history = await db.getChat(user.id);
    const priorTurns = history
      .filter((m) => m.id !== userMsg.id)
      .map((m) => ({ role: m.role, content: m.content }));
    replyText = await companionReply(priorTurns, text.slice(0, 2000), {
      name: user.name,
      exam: user.exam,
      daysToExam: daysUntil(user.examDate),
    });
  }

  const assistantMsg: ChatMessage = {
    id: uid("c_"),
    userId: user.id,
    role: "assistant",
    content: replyText,
    crisis: safety.isCrisis,
    createdAt: new Date().toISOString(),
  };
  await db.addChat(assistantMsg);

  return NextResponse.json({ reply: assistantMsg, crisis: safety.isCrisis }, { status: 201 });
}
