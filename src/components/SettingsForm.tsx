"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Download, Trash2, Check, Loader2 } from "lucide-react";
import { EXAM_TYPES, type PublicUser } from "@/lib/types";

export function SettingsForm({ user }: { user: PublicUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [exam, setExam] = useState(user.exam);
  const [examDate, setExamDate] = useState(user.examDate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, exam, examDate: examDate || null }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-ink">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="exam">Preparing for</label>
              <select id="exam" className="input" value={exam} onChange={(e) => setExam(e.target.value as typeof exam)}>
                {EXAM_TYPES.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="examDate">Exam date</label>
              <input id="examDate" type="date" className="input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
              {saved ? "Saved" : "Save changes"}
            </button>
            <span className="text-sm text-ink-faint">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Privacy / data */}
      <div className="card p-6">
        <h2 className="font-semibold text-ink">Your data</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Your journals and check-ins are yours. Download a copy anytime, or erase everything.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/api/account" download className="btn btn-ghost">
            <Download size={18} /> Export my data
          </a>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft/50 p-6">
        <h2 className="font-semibold text-danger-strong">Delete account</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This permanently removes your account and all your data. This can&apos;t be undone.
        </p>
        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-ink">Are you sure?</span>
            <button className="btn bg-danger text-white hover:bg-danger-strong" onClick={remove} disabled={deleting}>
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              Yes, delete everything
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-ghost mt-4 border-danger/40 text-danger-strong" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} /> Delete my account
          </button>
        )}
      </div>
    </div>
  );
}
