/*
 * Planner validation — pure, dependency-free functions so they can be unit
 * tested in isolation and reused by the API routes.
 */
import { TASK_PRIORITIES, type TaskPriority } from "./types";

export function isValidDate(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s + "T00:00:00"))
  );
}

/** 24-hour "HH:MM". */
export function isValidTime(s: unknown): s is string {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export interface NewTaskInput {
  date: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  priority: TaskPriority;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_TITLE = 200;

function readTime(v: unknown): "empty" | "invalid" | string {
  if (v == null || v === "") return "empty";
  if (isValidTime(v)) return v;
  return "invalid";
}

/** Validate a brand-new task from a request body. */
export function validateNewTask(body: Record<string, unknown>): Result<NewTaskInput> {
  const title = String(body.title ?? "").trim();
  if (title.length < 1) return { ok: false, error: "Please enter a task." };
  if (title.length > MAX_TITLE) return { ok: false, error: "That task is too long." };
  if (!isValidDate(body.date)) return { ok: false, error: "Invalid date." };

  const s = readTime(body.startTime);
  if (s === "invalid") return { ok: false, error: "Invalid start time." };
  const e = readTime(body.endTime);
  if (e === "invalid") return { ok: false, error: "Invalid end time." };

  const startTime = s === "empty" ? null : s;
  const endTime = e === "empty" ? null : e;
  if (startTime && endTime && endTime <= startTime)
    return { ok: false, error: "End time must be after the start time." };

  const priority = TASK_PRIORITIES.includes(body.priority as TaskPriority)
    ? (body.priority as TaskPriority)
    : "normal";

  return { ok: true, value: { date: body.date as string, title, startTime, endTime, priority } };
}

export interface TaskPatch {
  title?: string;
  done?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  priority?: TaskPriority;
}

/** Validate a partial update (only provided fields are changed). */
export function validateTaskPatch(body: Record<string, unknown>): Result<TaskPatch> {
  const patch: TaskPatch = {};

  if ("done" in body) patch.done = Boolean(body.done);

  if ("title" in body) {
    const t = String(body.title ?? "").trim();
    if (t.length < 1) return { ok: false, error: "Title can't be empty." };
    if (t.length > MAX_TITLE) return { ok: false, error: "That task is too long." };
    patch.title = t;
  }

  if ("priority" in body && TASK_PRIORITIES.includes(body.priority as TaskPriority)) {
    patch.priority = body.priority as TaskPriority;
  }

  if ("startTime" in body) {
    const s = readTime(body.startTime);
    if (s === "invalid") return { ok: false, error: "Invalid start time." };
    patch.startTime = s === "empty" ? null : s;
  }
  if ("endTime" in body) {
    const e = readTime(body.endTime);
    if (e === "invalid") return { ok: false, error: "Invalid end time." };
    patch.endTime = e === "empty" ? null : e;
  }

  const finalStart = patch.startTime !== undefined ? patch.startTime : null;
  const finalEnd = patch.endTime !== undefined ? patch.endTime : null;
  if (finalStart && finalEnd && finalEnd <= finalStart)
    return { ok: false, error: "End time must be after the start time." };

  return { ok: true, value: patch };
}
