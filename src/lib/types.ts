/* Shared domain types for Samatva. */

export type ExamType =
  | "JEE"
  | "NEET"
  | "UPSC"
  | "GATE"
  | "CAT"
  | "Boards"
  | "SAT/GRE"
  | "Other";

export const EXAM_TYPES: ExamType[] = [
  "JEE",
  "NEET",
  "UPSC",
  "GATE",
  "CAT",
  "Boards",
  "SAT/GRE",
  "Other",
];

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  exam: ExamType;
  examDate: string | null; // ISO yyyy-mm-dd
  createdAt: string;
}

/** A user object safe to send to the client (no secrets). */
export type PublicUser = Omit<User, "passwordHash">;

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number; // 1..5  (overall feeling)
  energy: number; // 1..5
  stress: number; // 1..5  (higher = more stressed)
  sleepHours: number | null;
  note: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  aiReply: string;
  crisis: boolean; // true when the safety layer flagged the entry
  createdAt: string;
}

export type ChatRole = "user" | "assistant";

/** A companion conversation. Messages reference it by id. */
export interface ChatSession {
  id: string;
  userId: string;
  title: string; // derived from the first user message, or "New conversation"
  createdAt: string;
  updatedAt: string; // last activity — used to sort the conversation list
}

export interface ChatMessage {
  id: string;
  userId: string;
  sessionId: string; // which conversation this message belongs to
  role: ChatRole;
  content: string;
  crisis: boolean; // true when the safety layer flagged the user message
  createdAt: string;
}

export const DEFAULT_SESSION_TITLE = "New conversation";

/* ---- Vision (multimodal) --------------------------------------------- */

export type VisionKind = "timetable" | "mock-result" | "study-space";

export const VISION_KINDS: { id: VisionKind; label: string; emoji: string; hint: string }[] = [
  { id: "timetable", label: "Study timetable", emoji: "📅", hint: "Spot overload & missing breaks" },
  { id: "mock-result", label: "Mock result", emoji: "📊", hint: "Reframe a tough score, kindly" },
  { id: "study-space", label: "Study space", emoji: "🪴", hint: "Make it calmer & more focused" },
];

/** Only the AI's text reflection is stored — never the image. */
export interface VisionEntry {
  id: string;
  userId: string;
  kind: VisionKind;
  reflection: string;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...pub } = user;
  return pub;
}
