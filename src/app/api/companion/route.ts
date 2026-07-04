import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { companionReply } from "@/lib/gemma";
import { screenForCrisis, crisisResponseMessage } from "@/lib/safety";
import { uid, daysUntil } from "@/lib/utils";
import { DEFAULT_SESSION_TITLE, type ChatMessage } from "@/lib/types";

// Gemma 4's thinking can take a while; allow the function room to finish.
export const maxDuration = 60;

// Messages for one conversation: GET /api/companion?sessionId=...
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId is required." }, { status: 400 });

  const session = await db.getSession(user.id, sessionId);
  if (!session) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const messages = await db.getSessionMessages(user.id, sessionId);
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

  // Resolve the conversation — reuse the given one (if it's the user's) or
  // start a fresh one.
  let sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  let session = sessionId ? await db.getSession(user.id, sessionId) : null;
  if (!session) {
    session = await db.createSession(user.id, DEFAULT_SESSION_TITLE);
    sessionId = session.id;
  }

  // 1) Safety screen — independent of the model.
  const safety = screenForCrisis(text);

  // 2) Persist the user's message (scoped to this session).
  const userMsg: ChatMessage = {
    id: uid("c_"),
    userId: user.id,
    sessionId,
    role: "user",
    content: text.slice(0, 2000),
    crisis: safety.isCrisis,
    createdAt: new Date().toISOString(),
  };
  await db.addChat(userMsg);

  // 3) Reply. Crisis short-circuits the model entirely.
  let replyText: string;
  if (safety.isCrisis) {
    replyText = crisisResponseMessage(user.name);
  } else {
    const history = await db.getSessionMessages(user.id, sessionId);
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
    sessionId,
    role: "assistant",
    content: replyText,
    crisis: safety.isCrisis,
    createdAt: new Date().toISOString(),
  };
  await db.addChat(assistantMsg);

  // 4) Bump the conversation, and title it from the first message.
  const patch: { updatedAt: string; title?: string } = { updatedAt: new Date().toISOString() };
  if (session.title === DEFAULT_SESSION_TITLE) {
    patch.title = text.slice(0, 48) + (text.length > 48 ? "…" : "");
  }
  await db.touchSession(sessionId, patch);

  return NextResponse.json({ reply: assistantMsg, crisis: safety.isCrisis, sessionId }, { status: 201 });
}
