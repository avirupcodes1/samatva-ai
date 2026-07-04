"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageCircleHeart, LifeBuoy, Plus, History } from "lucide-react";
import { CompactHelplines } from "@/components/Helplines";
import { screenForCrisis } from "@/lib/safety";
import { cn, relativeTime } from "@/lib/utils";
import type { ChatMessage, ChatSession } from "@/lib/types";

const STARTERS = [
  "I'm feeling really anxious about my exam.",
  "I can't focus while studying today.",
  "I keep comparing myself to others.",
  "I'm exhausted but I feel guilty resting.",
];

export default function CompanionPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshSessions = useCallback(async () => {
    const d = await fetch("/api/companion/sessions").then((r) => r.json()).catch(() => ({}));
    const list: ChatSession[] = d.sessions ?? [];
    setSessions(list);
    return list;
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const d = await fetch(`/api/companion?sessionId=${sessionId}`).then((r) => r.json()).catch(() => ({}));
    const msgs: ChatMessage[] = d.messages ?? [];
    setMessages(msgs);
    setShowCrisis(msgs.some((m) => m.crisis));
    setCrisisOpen(true);
  }, []);

  // On mount: load conversations, open the most recent (or a fresh one).
  useEffect(() => {
    (async () => {
      const list = await refreshSessions();
      if (list.length > 0) {
        setActiveId(list[0].id);
        await loadMessages(list[0].id);
      }
      setLoaded(true);
    })();
  }, [refreshSessions, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // The AI reply is generated server-side and persisted, so it keeps going even
  // if you switch tabs. When you come back, re-sync so the reply shows up.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      refreshSessions();
      if (activeId) loadMessages(activeId);
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [activeId, refreshSessions, loadMessages]);

  function newChat() {
    // Fresh, unsent conversation — the server creates it on the first message.
    setActiveId(null);
    setMessages([]);
    setShowCrisis(false);
    setInput("");
  }

  async function selectSession(id: string) {
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    await loadMessages(id);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (screenForCrisis(trimmed).isCrisis) setShowCrisis(true);
    setInput("");
    const optimistic: ChatMessage = {
      id: `tmp_${Date.now()}`,
      userId: "me",
      sessionId: activeId ?? "",
      role: "user",
      content: trimmed,
      crisis: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeId ?? undefined, message: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        // Dedup by id so a tab-return re-sync + this append can't double it.
        setMessages((m) => (m.some((x) => x.id === data.reply.id) ? m : [...m, data.reply]));
        if (data.crisis) setShowCrisis(true);
        if (data.sessionId && data.sessionId !== activeId) setActiveId(data.sessionId);
        refreshSessions(); // pick up the new/updated title + ordering
      }
    } catch {
      /* keep the optimistic message so text isn't lost */
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="mb-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <MessageCircleHeart className="text-accent" /> Companion
        </h1>
        <p className="text-ink-soft">A calm, private space to talk. Not a therapist — but always here.</p>
      </div>

      {/* Conversation controls */}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={newChat} className="chip gap-1 bg-primary text-on-primary hover:opacity-90">
          <Plus size={14} /> New chat
        </button>
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className={cn("chip gap-1", historyOpen ? "bg-accent-soft text-accent" : "hover:text-ink")}
        >
          <History size={14} /> Past history
          {sessions.length > 0 && <span className="text-ink-faint">({sessions.length})</span>}
        </button>
      </div>

      {/* Past conversations panel */}
      {historyOpen && (
        <div className="card mb-3 max-h-64 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-ink-faint">No past conversations yet.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  selectSession(s.id);
                  setHistoryOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left transition",
                  s.id === activeId ? "bg-primary-soft" : "hover:bg-surface-soft",
                )}
              >
                <span className="truncate text-sm text-ink">{s.title}</span>
                <span className="shrink-0 text-xs text-ink-faint">{relativeTime(s.updatedAt)}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-[var(--radius-md)] border border-border bg-surface p-4">
        {loaded && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl">🌱</span>
            <p className="max-w-xs text-sm text-ink-soft">
              Hi, I&apos;m Samatva. However today is going, you can tell me about it. Where shall we start?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="chip hover:bg-primary-soft hover:text-primary-strong">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-on-primary rounded-br-sm"
                  : m.crisis
                    ? "bg-danger-soft text-ink rounded-bl-sm"
                    : "bg-surface-soft text-ink rounded-bl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-surface-soft px-4 py-3">
              <span className="typing-dot h-2 w-2 rounded-full bg-ink-faint" />
              <span className="typing-dot h-2 w-2 rounded-full bg-ink-faint" />
              <span className="typing-dot h-2 w-2 rounded-full bg-ink-faint" />
            </div>
          </div>
        )}
      </div>

      {showCrisis && (
        <div className="mt-3">
          {crisisOpen ? (
            <div>
              <div className="mb-1 flex justify-end">
                <button
                  onClick={() => setCrisisOpen(false)}
                  className="text-xs font-medium text-ink-faint hover:text-ink"
                >
                  Hide helplines
                </button>
              </div>
              <CompactHelplines />
            </div>
          ) : (
            <button
              onClick={() => setCrisisOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft/60 py-2 text-sm font-semibold text-danger-strong"
            >
              <LifeBuoy size={16} /> Helplines available — tap to view
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          className="input max-h-32 min-h-[48px] resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Type how you're feeling…"
          rows={1}
        />
        <button type="submit" className="btn btn-primary h-12 w-12 !p-0" disabled={sending || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
