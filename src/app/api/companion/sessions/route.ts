import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { DEFAULT_SESSION_TITLE } from "@/lib/types";

// List the signed-in user's conversations (most recent first).
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await db.getSessions(user.id);
  return NextResponse.json({ sessions });
}

// Start a new conversation.
export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await db.createSession(user.id, DEFAULT_SESSION_TITLE);
  return NextResponse.json({ session }, { status: 201 });
}
