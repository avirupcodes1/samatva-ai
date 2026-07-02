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

export interface ChatMessage {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  crisis: boolean; // true when the safety layer flagged the user message
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...pub } = user;
  return pub;
}
