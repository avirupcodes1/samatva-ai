"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Loader2, Sprout } from "lucide-react";
import { CrisisAlert } from "@/components/Helplines";
import { relativeTime } from "@/lib/utils";
import type { JournalEntry } from "@/lib/types";

const PROMPTS = [
  "What drained you today, and what gave you a little energy?",
  "If your stress could talk, what would it say right now?",
  "One thing you handled better than you expected?",
  "What would you tell a friend feeling exactly how you feel?",
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [crisis, setCrisis] = useState<string | null>(null);
  // Set after mount to avoid a server/client hydration mismatch on the date.
  const [prompt, setPrompt] = useState(PROMPTS[0]);

  useEffect(() => {
    setPrompt(PROMPTS[new Date().getDate() % PROMPTS.length]);
    fetch("/api/journal")
      .then((r) => r.json())
      .then((d) => {
        const list: JournalEntry[] = d.entries ?? [];
        setEntries(list);
        // Re-surface helplines if any past entry was flagged as a crisis.
        const flagged = list.find((e) => e.crisis);
        if (flagged) setCrisis(flagged.aiReply);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  async function submit() {
    if (!content.trim()) return;
    setPosting(true);
    setCrisis(null);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setEntries((prev) => [data.entry, ...prev]);
        if (data.crisis) setCrisis(data.entry.aiReply);
        setContent("");
      }
    } catch {
      /* keep the text so the user doesn't lose it */
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Journal</h1>
        <p className="text-ink-soft">Write freely — Samatva will reflect back with care.</p>
      </div>

      {/* Composer */}
      <div className="card p-6">
        <div className="mb-3 flex items-center gap-2 text-sm text-primary-strong">
          <Sprout size={15} />
          <span>{prompt}</span>
        </div>
        <textarea
          className="input min-h-[140px] resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Today I felt…"
          maxLength={4000}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ink-faint">{content.length}/4000</span>
          <button className="btn btn-primary" onClick={submit} disabled={posting || !content.trim()}>
            {posting ? <Loader2 size={18} className="animate-spin" /> : <NotebookPen size={18} />}
            {posting ? "Reflecting…" : "Save entry"}
          </button>
        </div>
      </div>

      {crisis && <CrisisAlert message={crisis} />}

      {/* Past entries */}
      <div className="space-y-4">
        {loading ? (
          <div className="card h-24 skeleton" />
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">
            No entries yet. Your first reflection is a good place to start.
          </p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="card p-5">
              <div className="mb-2 text-xs text-ink-faint">{relativeTime(e.createdAt)}</div>
              <p className="whitespace-pre-wrap text-sm text-ink">{e.content}</p>
              <div
                className={`mt-3 flex gap-2 rounded-[var(--radius-sm)] p-3 ${
                  e.crisis ? "bg-danger-soft" : "bg-primary-soft/40"
                }`}
              >
                <Sprout
                  size={16}
                  className={`mt-0.5 shrink-0 ${e.crisis ? "text-danger-strong" : "text-primary-strong"}`}
                />
                <p className="text-sm text-ink">{e.aiReply}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
