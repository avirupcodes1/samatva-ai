/*
 * Gemma client — talks to a locally running Ollama server.
 *
 * The whole "AI" of Samatva is here: we send well-crafted prompts and read
 * back text. There is NO training / fine-tuning. If Ollama is unreachable
 * (common during a demo), every helper degrades gracefully to a warm,
 * hand-written fallback so the app keeps working.
 *
 * Env:
 *   OLLAMA_URL    default http://localhost:11434
 *   GEMMA_MODEL   default gemma4
 */
import { HELPLINES } from "./safety";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma4";
const REQUEST_TIMEOUT_MS = 45_000;

interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Low-level call to Ollama's /api/chat. Returns the assistant text, or null
 * on any failure (timeout, connection refused, bad response). Never throws.
 */
async function ollamaChat(messages: ChatTurn[]): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages,
        stream: false,
        options: { temperature: 0.7, num_predict: 500 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[gemma] Ollama responded ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch (err) {
    console.error("[gemma] Ollama unreachable:", (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Health probe used by the UI to show an "AI online/offline" indicator. */
export async function isGemmaOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Shared persona + guardrails                                        */
/* ------------------------------------------------------------------ */
const PERSONA = `You are Samatva, a warm, calm companion for students preparing for high-stakes exams (like JEE, NEET, UPSC, GATE, CAT, board exams). "Samatva" means equanimity — balance of mind.

Your role:
- Listen with genuine empathy and validate feelings before offering anything.
- Be encouraging, gentle and human. Keep replies fairly short (2-5 sentences) and easy to read.
- Where helpful, offer one small, practical, evidence-based coping idea (a breathing exercise, a short break, reframing an anxious thought, a study-life balance tip).
- Speak simply. You may occasionally use light Hinglish warmth if the student does.

Hard boundaries (never break these):
- You are NOT a doctor or therapist. Never diagnose, never suggest medication.
- Never claim to be human.
- If the student expresses thoughts of self-harm or suicide, respond with care and urge them to contact a helpline or a trusted person immediately — do not minimise it.
- Do not give academic answers or solve exam problems; you support well-being, not coursework.`;

interface UserContext {
  name?: string;
  exam?: string;
  daysToExam?: number | null;
}

function contextLine(ctx?: UserContext): string {
  if (!ctx) return "";
  const bits: string[] = [];
  if (ctx.name) bits.push(`The student's name is ${ctx.name}.`);
  if (ctx.exam) bits.push(`They are preparing for ${ctx.exam}.`);
  if (ctx.daysToExam != null && ctx.daysToExam >= 0)
    bits.push(`Their exam is about ${ctx.daysToExam} days away.`);
  return bits.length ? `\n\nContext: ${bits.join(" ")}` : "";
}

/* ------------------------------------------------------------------ */
/*  High-level helpers used by the API routes                          */
/* ------------------------------------------------------------------ */

/** Companion chat reply. `history` is prior turns (oldest first). */
export async function companionReply(
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  ctx?: UserContext,
): Promise<string> {
  const messages: ChatTurn[] = [
    { role: "system", content: PERSONA + contextLine(ctx) },
    ...history.slice(-10),
    { role: "user", content: userMessage },
  ];
  const reply = await ollamaChat(messages);
  return reply ?? fallbackCompanionReply();
}

/** Short, kind reflection on a journal entry. */
export async function journalReflection(entry: string, ctx?: UserContext): Promise<string> {
  const messages: ChatTurn[] = [
    { role: "system", content: PERSONA + contextLine(ctx) },
    {
      role: "user",
      content:
        `Here is my journal entry for today. Please respond in 2-4 warm sentences: ` +
        `reflect back what you notice, validate it, and offer one gentle suggestion if it fits.\n\n"${entry}"`,
    },
  ];
  const reply = await ollamaChat(messages);
  return reply ?? fallbackJournalReflection();
}

/** Encouraging weekly summary from recent mood check-ins. */
export async function weeklySummary(
  stats: { avgMood: number; avgStress: number; checkIns: number; trend: string },
  ctx?: UserContext,
): Promise<string> {
  const messages: ChatTurn[] = [
    { role: "system", content: PERSONA + contextLine(ctx) },
    {
      role: "user",
      content:
        `Write me a short, encouraging weekly well-being summary (3-4 sentences) based on this data. ` +
        `Be warm and non-judgemental, celebrate the effort of checking in, and suggest one small focus for next week.\n\n` +
        `Check-ins this week: ${stats.checkIns}\n` +
        `Average mood (1-5): ${stats.avgMood.toFixed(1)}\n` +
        `Average stress (1-5): ${stats.avgStress.toFixed(1)}\n` +
        `Overall mood trend: ${stats.trend}`,
    },
  ];
  const reply = await ollamaChat(messages);
  return reply ?? fallbackWeeklySummary(stats);
}

/* ------------------------------------------------------------------ */
/*  Graceful fallbacks (used when Ollama is offline)                   */
/* ------------------------------------------------------------------ */
export function isFallback(text: string): boolean {
  return text.startsWith(FALLBACK_MARK);
}
const FALLBACK_MARK = "​"; // zero-width marker so UI can flag offline replies

function fallbackCompanionReply(): string {
  return (
    FALLBACK_MARK +
    "I'm here with you. I can't reach my thinking engine right now, but that doesn't change that what you're feeling matters. " +
    "Try taking one slow breath in for 4 counts and out for 6 — I'll be right here when you're ready to keep talking."
  );
}

function fallbackJournalReflection(): string {
  return (
    FALLBACK_MARK +
    "Thank you for writing this down — putting feelings into words is a real act of self-care. " +
    "I couldn't reach my thinking engine to reflect fully just now, but your entry is saved. Be gentle with yourself today."
  );
}

function fallbackWeeklySummary(stats: { checkIns: number; trend: string }): string {
  return (
    FALLBACK_MARK +
    `You checked in ${stats.checkIns} time(s) this week — that steady self-awareness is genuinely worth celebrating. ` +
    `Your mood trend looks ${stats.trend}. For next week, try one small anchor: a fixed wind-down time before sleep.`
  );
}

export { HELPLINES };
