/*
 * JSON-file storage — a tiny, dependency-free "database" for the prototype.
 *
 * Data lives in /data/<collection>.json. All mutations to a given file run
 * through a per-file promise chain (`mutate`) that serializes the ENTIRE
 * read-modify-write, so two concurrent requests cannot each read the same
 * array, append, and clobber one another (lost update). Reads are lock-free.
 * For production you would swap this module for MySQL/Postgres and keep the
 * same typed accessors below unchanged.
 */
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { uid } from "./utils";
import type {
  User,
  MoodEntry,
  JournalEntry,
  ChatMessage,
  ChatSession,
  VisionEntry,
} from "./types";

/*
 * Backend selection:
 *   - If a KV/Redis REST endpoint is configured (Upstash or Vercel KV), use it.
 *     Serverless hosts like Vercel have a read-only/ephemeral filesystem, so a
 *     KV store is required there for data to persist.
 *   - Otherwise fall back to local JSON files under /data (zero-setup dev).
 * The typed `db` accessors below are identical either way.
 */
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const DATA_DIR = path.join(process.cwd(), "data");
const keyFor = (collection: string) => `samatva:${collection}`;

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readCollection<T>(collection: string): Promise<T[]> {
  if (redis) {
    try {
      const data = await redis.get<T[]>(keyFor(collection));
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`[storage] KV read failed for ${collection}:`, (err as Error).message);
      return [];
    }
  }
  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${collection}.json`), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    // Corrupt/unreadable file: fail closed with an empty set rather than crash.
    console.error(`[storage] could not read ${collection}:`, err);
    return [];
  }
}

async function persist<T>(collection: string, items: T[]): Promise<void> {
  if (redis) {
    await redis.set(keyFor(collection), items);
    return;
  }
  await ensureDir();
  const tmp = path.join(DATA_DIR, `${collection}.json.tmp`);
  const final = path.join(DATA_DIR, `${collection}.json`);
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmp, final); // atomic replace
}

/**
 * Per-file serialized read-modify-write. The mutator receives the current
 * items and returns the new array to persist (or void to persist in place).
 * Chained so concurrent mutations to the same collection run one at a time.
 */
const chains = new Map<string, Promise<unknown>>();

async function mutate<T, R>(
  collection: string,
  mutator: (items: T[]) => { items: T[]; result: R } | Promise<{ items: T[]; result: R }>,
): Promise<R> {
  const prev = chains.get(collection) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(async () => {
    const current = await readCollection<T>(collection);
    const { items, result } = await mutator(current);
    await persist(collection, items);
    return result;
  });
  chains.set(collection, next.catch(() => {}));
  return next as Promise<R>;
}

/* ---- Typed accessors -------------------------------------------------- */

export const db = {
  // Users
  getUsers: () => readCollection<User>("users"),
  async findUserByEmail(email: string): Promise<User | null> {
    const users = await readCollection<User>("users");
    const target = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === target) ?? null;
  },
  async findUserById(id: string): Promise<User | null> {
    const users = await readCollection<User>("users");
    return users.find((u) => u.id === id) ?? null;
  },
  async addUser(user: User): Promise<void> {
    await mutate<User, void>("users", (users) => ({
      items: [...users, user],
      result: undefined,
    }));
  },
  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    return mutate<User, User | null>("users", (users) => {
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return { items: users, result: null };
      const updated = { ...users[idx], ...patch, id: users[idx].id };
      const items = [...users];
      items[idx] = updated;
      return { items, result: updated };
    });
  },

  // Moods
  async getMoods(userId: string): Promise<MoodEntry[]> {
    const all = await readCollection<MoodEntry>("moods");
    return all
      .filter((m) => m.userId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addMood(entry: MoodEntry): Promise<void> {
    await mutate<MoodEntry, void>("moods", (all) => ({
      items: [...all, entry],
      result: undefined,
    }));
  },
  /**
   * One check-in per calendar day: if the user already has an entry today,
   * update it; otherwise create a new one. Race-safe via the per-file queue.
   */
  async upsertTodayMood(
    userId: string,
    values: Pick<MoodEntry, "mood" | "energy" | "stress" | "sleepHours" | "note">,
  ): Promise<{ entry: MoodEntry; updated: boolean }> {
    return mutate<MoodEntry, { entry: MoodEntry; updated: boolean }>("moods", (all) => {
      const today = new Date().toISOString().slice(0, 10);
      const idx = all.findIndex(
        (m) => m.userId === userId && m.createdAt.slice(0, 10) === today,
      );
      if (idx >= 0) {
        const entry: MoodEntry = { ...all[idx], ...values }; // keep id + createdAt
        const items = [...all];
        items[idx] = entry;
        return { items, result: { entry, updated: true } };
      }
      const entry: MoodEntry = {
        id: uid("m_"),
        userId,
        ...values,
        createdAt: new Date().toISOString(),
      };
      return { items: [...all, entry], result: { entry, updated: false } };
    });
  },

  // Journal
  async getJournal(userId: string): Promise<JournalEntry[]> {
    const all = await readCollection<JournalEntry>("journals");
    return all
      .filter((j) => j.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addJournal(entry: JournalEntry): Promise<void> {
    await mutate<JournalEntry, void>("journals", (all) => ({
      items: [...all, entry],
      result: undefined,
    }));
  },

  // Chat sessions (conversations)
  async getSessions(userId: string): Promise<ChatSession[]> {
    const all = await readCollection<ChatSession>("chatSessions");
    return all
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async getSession(userId: string, sessionId: string): Promise<ChatSession | null> {
    const all = await readCollection<ChatSession>("chatSessions");
    return all.find((s) => s.id === sessionId && s.userId === userId) ?? null;
  },
  async createSession(userId: string, title: string): Promise<ChatSession> {
    const now = new Date().toISOString();
    const session: ChatSession = { id: uid("s_"), userId, title, createdAt: now, updatedAt: now };
    await mutate<ChatSession, void>("chatSessions", (all) => ({
      items: [...all, session],
      result: undefined,
    }));
    return session;
  },
  async touchSession(
    sessionId: string,
    patch: Partial<Pick<ChatSession, "title" | "updatedAt">>,
  ): Promise<void> {
    await mutate<ChatSession, void>("chatSessions", (all) => {
      const idx = all.findIndex((s) => s.id === sessionId);
      if (idx === -1) return { items: all, result: undefined };
      const items = [...all];
      items[idx] = { ...items[idx], ...patch };
      return { items, result: undefined };
    });
  },

  // Chat messages (scoped to a session)
  async getSessionMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const all = await readCollection<ChatMessage>("chats");
    return all
      .filter((c) => c.userId === userId && c.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addChat(message: ChatMessage): Promise<void> {
    await mutate<ChatMessage, void>("chats", (all) => ({
      items: [...all, message],
      result: undefined,
    }));
  },
  /** All of a user's chat messages across every session (for data export). */
  async getAllChats(userId: string): Promise<ChatMessage[]> {
    const all = await readCollection<ChatMessage>("chats");
    return all
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  // Vision (only the text reflection is stored — never the image)
  async getVisions(userId: string): Promise<VisionEntry[]> {
    const all = await readCollection<VisionEntry>("visions");
    return all
      .filter((v) => v.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addVision(entry: VisionEntry): Promise<void> {
    await mutate<VisionEntry, void>("visions", (all) => ({
      items: [...all, entry],
      result: undefined,
    }));
  },

  // Account deletion (data export/erase) — serialized per collection.
  async deleteUserData(userId: string): Promise<void> {
    await Promise.all([
      mutate<User, void>("users", (u) => ({ items: u.filter((x) => x.id !== userId), result: undefined })),
      mutate<MoodEntry, void>("moods", (m) => ({ items: m.filter((x) => x.userId !== userId), result: undefined })),
      mutate<JournalEntry, void>("journals", (j) => ({ items: j.filter((x) => x.userId !== userId), result: undefined })),
      mutate<ChatMessage, void>("chats", (c) => ({ items: c.filter((x) => x.userId !== userId), result: undefined })),
      mutate<ChatSession, void>("chatSessions", (s) => ({ items: s.filter((x) => x.userId !== userId), result: undefined })),
      mutate<VisionEntry, void>("visions", (v) => ({ items: v.filter((x) => x.userId !== userId), result: undefined })),
    ]);
  },
};
