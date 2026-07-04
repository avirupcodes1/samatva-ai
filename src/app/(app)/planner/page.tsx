"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Sprout,
  Clock,
  Download,
} from "lucide-react";
import { cn, dateKey } from "@/lib/utils";
import { TASK_PRIORITIES, type Task, type TaskPriority } from "@/lib/types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "var(--color-ink-faint)",
  normal: "var(--color-primary)",
  high: "var(--color-danger)",
};

export default function PlannerPage() {
  const todayKey = dateKey(new Date());
  const [selected, setSelected] = useState(todayKey);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [monthTasks, setMonthTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [opinion, setOpinion] = useState<string | null>(null);
  const [opining, setOpining] = useState(false);
  const [exporting, setExporting] = useState(false);

  const range = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    return { from: dateKey(new Date(y, m, 1)), to: dateKey(new Date(y, m + 1, 0)) };
  }, [viewMonth]);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    const d = await fetch(`/api/tasks?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .catch(() => ({}));
    setMonthTasks(d.tasks ?? []);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const dayTasks = useMemo(
    () =>
      monthTasks
        .filter((t) => t.date === selected)
        .sort(
          (a, b) =>
            (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") ||
            a.createdAt.localeCompare(b.createdAt),
        ),
    [monthTasks, selected],
  );
  const taskDates = useMemo(() => new Set(monthTasks.map((t) => t.date)), [monthTasks]);

  const cells = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const arr: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(dateKey(new Date(y, m, d)));
    return arr;
  }, [viewMonth]);

  function shiftMonth(delta: number) {
    setOpinion(null);
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  async function addTask() {
    if (!title.trim() || adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selected,
          title,
          startTime: start || null,
          endTime: end || null,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add the task.");
        return;
      }
      setMonthTasks((m) => [...m, data.task]);
      setTitle("");
      setStart("");
      setEnd("");
      setPriority("normal");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function toggle(t: Task) {
    setMonthTasks((m) => m.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    }).catch(() => {});
  }

  async function remove(t: Task) {
    setMonthTasks((m) => m.filter((x) => x.id !== t.id));
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" }).catch(() => {});
  }

  async function askOpinion() {
    setOpining(true);
    setOpinion(null);
    try {
      const d = await fetch("/api/tasks/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selected }),
      }).then((r) => r.json());
      setOpinion(d.opinion ?? "Could not get an opinion right now.");
    } catch {
      setOpinion("Could not reach the opinion service. Please try again.");
    } finally {
      setOpining(false);
    }
  }

  // Export ALL of the user's tasks to a real .xlsx. The library is loaded
  // on demand so it never bloats the initial page bundle.
  async function exportXlsx() {
    setExporting(true);
    try {
      const d = await fetch("/api/tasks").then((r) => r.json());
      const all: Task[] = d.tasks ?? [];
      const rows = [...all]
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"),
        )
        .map((t) => ({
          Date: t.date,
          Task: t.title,
          Start: t.startTime ?? "",
          End: t.endTime ?? "",
          Priority: t.priority,
          Done: t.done ? "Yes" : "No",
        }));

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(
        rows.length ? rows : [{ Date: "", Task: "No tasks yet", Start: "", End: "", Priority: "", Done: "" }],
      );
      ws["!cols"] = [{ wch: 12 }, { wch: 42 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 6 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Study plan");
      XLSX.writeFile(wb, `samatva-planner-${dateKey(new Date())}.xlsx`);
    } catch {
      /* ignore — nothing downloaded */
    } finally {
      setExporting(false);
    }
  }

  const selectedLabel = new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <CalendarDays className="text-accent" /> Planner
          </h1>
          <p className="text-ink-soft">Plan your study days, build a timetable, and ask Samatva if it&apos;s balanced.</p>
        </div>
        <button onClick={exportXlsx} disabled={exporting} className="btn btn-ghost shrink-0 text-sm" title="Download your tasks as an Excel sheet">
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export
        </button>
      </div>

      {/* Calendar */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} className="rounded-full p-2 text-ink-soft hover:bg-surface-soft" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <div className="font-semibold text-ink">
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </div>
          <button onClick={() => shiftMonth(1)} className="rounded-full p-2 text-ink-soft hover:bg-surface-soft" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-faint">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c, i) =>
            c === null ? (
              <div key={i} />
            ) : (
              <button
                key={c}
                onClick={() => {
                  setSelected(c);
                  setOpinion(null);
                }}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-[var(--radius-sm)] text-sm transition",
                  c === selected
                    ? "bg-primary text-on-primary font-semibold"
                    : c === todayKey
                      ? "bg-primary-soft text-primary-strong font-semibold"
                      : "text-ink hover:bg-surface-soft",
                )}
              >
                {Number(c.slice(-2))}
                {taskDates.has(c) && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                      c === selected ? "bg-white" : "bg-primary",
                    )}
                  />
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Selected day */}
      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{selectedLabel}</h2>
          {dayTasks.length > 0 && (
            <span className="text-xs text-ink-faint">
              {dayTasks.filter((t) => t.done).length}/{dayTasks.length} done
            </span>
          )}
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {loading ? (
            <div className="h-10 skeleton rounded-[var(--radius-sm)]" />
          ) : dayTasks.length === 0 ? (
            <p className="py-2 text-sm text-ink-faint">No tasks yet — add your first below.</p>
          ) : (
            dayTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-surface-soft/60 px-3 py-2">
                <button
                  onClick={() => toggle(t)}
                  aria-label={t.done ? "Mark not done" : "Mark done"}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                    t.done ? "border-primary bg-primary text-white" : "border-border-strong",
                  )}
                >
                  {t.done && <span className="text-[11px]">✓</span>}
                </button>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: PRIORITY_DOT[t.priority] }}
                  title={`${t.priority} priority`}
                />
                <div className="min-w-0 flex-1">
                  <div className={cn("truncate text-sm", t.done ? "text-ink-faint line-through" : "text-ink")}>
                    {t.title}
                  </div>
                  {t.startTime && (
                    <div className="flex items-center gap-1 text-xs text-ink-faint">
                      <Clock size={11} /> {t.startTime}
                      {t.endTime ? `–${t.endTime}` : ""}
                    </div>
                  )}
                </div>
                <button onClick={() => remove(t)} className="text-ink-faint hover:text-danger" aria-label="Delete task">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add form */}
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task, e.g. Revise organic chemistry"
            maxLength={200}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-ink-soft">
              <Clock size={13} /> from
              <input type="time" className="input !w-auto !py-1.5" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="flex items-center gap-1 text-xs text-ink-soft">
              to
              <input type="time" className="input !w-auto !py-1.5" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <select className="input !w-auto !py-1.5" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p} priority</option>
              ))}
            </select>
            <button className="btn btn-primary ml-auto" onClick={addTask} disabled={adding || !title.trim()}>
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
            </button>
          </div>
          {error && (
            <p className="rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger-strong">{error}</p>
          )}
        </div>
      </div>

      {/* AI opinion */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Sprout size={18} className="text-accent" /> Is my plan balanced?
          </h2>
          <button className="btn btn-soft text-sm" onClick={askOpinion} disabled={opining}>
            {opining ? <Loader2 size={16} className="animate-spin" /> : <Sprout size={16} />}
            {opining ? "Thinking…" : "Ask Samatva"}
          </button>
        </div>
        {opinion ? (
          <p className="mt-3 text-sm leading-relaxed text-ink">{opinion}</p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Ask Samatva to look over {selectedLabel.toLowerCase()}&apos;s plan and gently flag overload or missing breaks.
          </p>
        )}
      </div>
    </div>
  );
}
