import { NextResponse } from "next/server";
import { db } from "@/lib/storage";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { toPublicUser } from "@/lib/types";
import { isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!isValidEmail(email) || !password)
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });

  const user = await db.findUserByEmail(email);
  // Same message for missing user vs wrong password (avoid user enumeration).
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_MAX_AGE));
  return res;
}
