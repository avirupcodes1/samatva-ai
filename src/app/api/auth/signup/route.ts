import { NextResponse } from "next/server";
import { db } from "@/lib/storage";
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { EXAM_TYPES, toPublicUser, type ExamType, type User } from "@/lib/types";
import { uid, isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const exam = String(body.exam ?? "Other") as ExamType;
  const examDate = body.examDate ? String(body.examDate) : null;

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!isValidEmail(email))
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  const safeExam: ExamType = EXAM_TYPES.includes(exam) ? exam : "Other";

  const existing = await db.findUserByEmail(email);
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user: User = {
    id: uid("u_"),
    name,
    email,
    passwordHash: await hashPassword(password),
    exam: safeExam,
    examDate,
    createdAt: new Date().toISOString(),
  };
  await db.addUser(user);

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE));
  return res;
}
