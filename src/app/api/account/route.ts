import { NextResponse } from "next/server";
import { requireUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { db } from "@/lib/storage";

/** Export all of the signed-in user's data (data portability). */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [moods, journals, chats] = await Promise.all([
    db.getMoods(user.id),
    db.getJournal(user.id),
    db.getChat(user.id),
  ]);

  const payload = { user, moods, journals, chats, exportedAt: new Date().toISOString() };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="samatva-data-${user.id}.json"`,
    },
  });
}

/** Permanently erase the user's account and all associated data. */
export async function DELETE() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.deleteUserData(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}
