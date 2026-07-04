"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, MessageCircleHeart } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { ChatSession } from "@/lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/companion/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? sessions.filter((s) => s.title.toLowerCase().includes(term)) : sessions;
  }, [sessions, q]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/companion" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to companion
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Conversation history</h1>
          <p className="text-ink-soft">All your past chats with Samatva.</p>
        </div>
        <Link href="/companion" className="btn btn-primary shrink-0 text-sm">
          <Plus size={16} /> New chat
        </Link>
      </div>

      {sessions.length > 6 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="input pl-9"
            placeholder="Search conversations…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-16 skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-faint">
          {sessions.length === 0
            ? "No conversations yet — start one from the companion."
            : "No conversations match your search."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/companion?s=${s.id}`)}
              className="card flex w-full items-center justify-between gap-3 p-4 text-left transition hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <MessageCircleHeart size={16} />
                </span>
                <span className="truncate font-medium text-ink">{s.title}</span>
              </span>
              <span className="shrink-0 text-xs text-ink-faint">{relativeTime(s.updatedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
