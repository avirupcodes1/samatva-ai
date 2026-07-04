import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { validateNewTask } from "@/lib/tasks";
import { uid } from "@/lib/utils";
import type { Task } from "@/lib/types";

// GET /api/tasks?date=YYYY-MM-DD        -> that day's tasks
// GET /api/tasks?from=...&to=...        -> tasks in a range (for calendar dots)
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && to) {
    const tasks = await db.getTasksInRange(user.id, from, to);
    return NextResponse.json({ tasks });
  }
  const date = searchParams.get("date") ?? undefined;
  const tasks = await db.getTasks(user.id, date);
  return NextResponse.json({ tasks });
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

  const v = validateNewTask(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const task: Task = {
    id: uid("t_"),
    userId: user.id,
    ...v.value,
    done: false,
    createdAt: new Date().toISOString(),
  };
  await db.addTask(task);
  return NextResponse.json({ task }, { status: 201 });
}
