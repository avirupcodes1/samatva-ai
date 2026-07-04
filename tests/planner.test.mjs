// Unit tests for the planner feature: validation logic + storage CRUD.
// Run with:  npm test   (node --test, uses Node 24's native TS stripping)
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Isolate the fs storage backend to a throwaway temp directory.
const dataDir = mkdtempSync(join(tmpdir(), "samatva-test-"));
process.env.SAMATVA_DATA_DIR = dataDir;
after(() => rmSync(dataDir, { recursive: true, force: true }));

import { validateNewTask, validateTaskPatch, isValidDate, isValidTime } from "../src/lib/tasks.ts";
const { db } = await import("../src/lib/storage.ts");

/* ---- Validation --------------------------------------------------- */

test("isValidDate accepts YYYY-MM-DD, rejects junk", () => {
  assert.equal(isValidDate("2026-07-10"), true);
  assert.equal(isValidDate("notadate"), false);
  assert.equal(isValidDate("2026-13-40"), false);
  assert.equal(isValidDate(20260710), false);
});

test("isValidTime accepts 24h HH:MM, rejects bad", () => {
  assert.equal(isValidTime("09:00"), true);
  assert.equal(isValidTime("23:59"), true);
  assert.equal(isValidTime("24:00"), false);
  assert.equal(isValidTime("9:00"), false);
  assert.equal(isValidTime("09:60"), false);
});

test("validateNewTask: a valid untimed to-do", () => {
  const r = validateNewTask({ title: "  Revise thermodynamics  ", date: "2026-07-10" });
  assert.equal(r.ok, true);
  assert.equal(r.value.title, "Revise thermodynamics"); // trimmed
  assert.equal(r.value.startTime, null);
  assert.equal(r.value.endTime, null);
  assert.equal(r.value.priority, "normal"); // defaulted
});

test("validateNewTask: a valid timetable block", () => {
  const r = validateNewTask({
    title: "Physics revision",
    date: "2026-07-10",
    startTime: "09:00",
    endTime: "11:00",
    priority: "high",
  });
  assert.equal(r.ok, true);
  assert.equal(r.value.startTime, "09:00");
  assert.equal(r.value.endTime, "11:00");
  assert.equal(r.value.priority, "high");
});

test("validateNewTask: rejects empty title, bad date, bad time, end<=start", () => {
  assert.equal(validateNewTask({ title: "   ", date: "2026-07-10" }).ok, false);
  assert.equal(validateNewTask({ title: "x", date: "nope" }).ok, false);
  assert.equal(validateNewTask({ title: "x", date: "2026-07-10", startTime: "25:00" }).ok, false);
  assert.equal(
    validateNewTask({ title: "x", date: "2026-07-10", startTime: "11:00", endTime: "09:00" }).ok,
    false,
  );
  assert.equal(validateNewTask({ title: "y".repeat(201), date: "2026-07-10" }).ok, false);
});

test("validateTaskPatch: partial updates", () => {
  assert.deepEqual(validateTaskPatch({ done: true }), { ok: true, value: { done: true } });
  assert.equal(validateTaskPatch({ title: "  " }).ok, false);
  const cleared = validateTaskPatch({ startTime: "" });
  assert.equal(cleared.ok, true);
  assert.equal(cleared.value.startTime, null);
  assert.equal(validateTaskPatch({ startTime: "nope" }).ok, false);
});

/* ---- Storage CRUD ------------------------------------------------- */

const U = "u_test_owner";
const U2 = "u_test_other";
const mk = (over) => ({
  id: "t_x",
  userId: U,
  date: "2026-07-10",
  title: "A",
  startTime: null,
  endTime: null,
  priority: "normal",
  done: false,
  createdAt: new Date().toISOString(),
  ...over,
});

test("storage: add + get by date", async () => {
  await db.addTask(mk({ id: "t_1", title: "Read notes" }));
  const day = await db.getTasks(U, "2026-07-10");
  assert.equal(day.length, 1);
  assert.equal(day[0].title, "Read notes");
  assert.equal((await db.getTasks(U, "2026-07-11")).length, 0);
});

test("storage: update toggles done; missing id returns null", async () => {
  const upd = await db.updateTask(U, "t_1", { done: true });
  assert.equal(upd.done, true);
  assert.equal(await db.updateTask(U, "does-not-exist", { done: true }), null);
});

test("storage: ownership isolation (another user cannot see/edit)", async () => {
  assert.equal(await db.getTask(U2, "t_1"), null);
  assert.equal(await db.updateTask(U2, "t_1", { done: false }), null);
  assert.equal(await db.deleteTask(U2, "t_1"), false);
});

test("storage: range query + timed-first sort", async () => {
  await db.addTask(mk({ id: "t_2", date: "2026-07-12", startTime: "09:00", endTime: "10:00" }));
  await db.addTask(mk({ id: "t_3", date: "2026-07-12", startTime: null, title: "Untimed" }));
  const range = await db.getTasksInRange(U, "2026-07-10", "2026-07-12");
  assert.equal(range.length, 3);
  assert.equal((await db.getTasksInRange(U, "2026-07-11", "2026-07-11")).length, 0);
  const day12 = await db.getTasks(U, "2026-07-12");
  assert.equal(day12[0].id, "t_2"); // timed block sorts before the untimed to-do
});

test("storage: delete returns true then false", async () => {
  assert.equal(await db.deleteTask(U, "t_1"), true);
  assert.equal(await db.deleteTask(U, "t_1"), false);
  assert.equal((await db.getTasks(U)).some((t) => t.id === "t_1"), false);
});
