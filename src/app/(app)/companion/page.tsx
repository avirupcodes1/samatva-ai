"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircleHeart, LifeBuoy } from "lucide-react";
import { CompactHelplines } from "@/components/Helplines";
import { screenForCrisis } from "@/lib/safety";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const STARTERS = [
  "I'm feeling really anxious about my exam.",
  "I can't focus while studying today.",
  "I keep comparing myself to others.",
  "I'm exhausted but I feel guilty resting.",
];

export default function CompanionPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/companion")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        if ((d.messages ?? []).some((m: ChatMessage) => m.crisis)) setShowCrisis(true);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    // Defense-in-depth: surface helplines instantly, before the server replies.
    if (screenForCrisis(trimmed).isCrisis) setShowCrisis(true);
    setInput("");
    const optimistic: ChatMessage = {
      id: `tmp_${Date.now()}`,
      userId: "me",
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
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, data.reply]);
        if (data.crisis) setShowCrisis(true);
      }
    } catch {
      /* ignore for prototype */
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <MessageCircleHeart className="text-accent" /> Companion
        </h1>
        <p className="text-ink-soft">A calm, private space to talk. Not a therapist — but always here.</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-[var(--radius-md)] bg-surface p-4 border border-border">
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
