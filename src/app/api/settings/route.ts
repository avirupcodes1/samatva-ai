import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { EXAM_TYPES, toPublicUser, type ExamType } from "@/lib/types";

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: { name?: string; exam?: ExamType; examDate?: string | null } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });
    patch.name = name;
  }
  if (typeof body.exam === "string") {
    patch.exam = EXAM_TYPES.includes(body.exam as ExamType) ? (body.exam as ExamType) : "Other";
  }
  if ("examDate" in body) {
    patch.examDate = body.examDate ? String(body.examDate) : null;
  }

  const updated = await db.updateUser(user.id, patch);
  if (!updated) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ user: toPublicUser(updated) });
}
