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
import type { User, MoodEntry, JournalEntry, ChatMessage } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileFor(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

async function readCollection<T>(collection: string): Promise<T[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(fileFor(collection), "utf8");
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
  await ensureDir();
  const tmp = fileFor(collection) + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmp, fileFor(collection)); // atomic replace
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

  // Chat
  async getChat(userId: string): Promise<ChatMessage[]> {
    const all = await readCollection<ChatMessage>("chats");
    return all
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addChat(message: ChatMessage): Promise<void> {
    await mutate<ChatMessage, void>("chats", (all) => ({
      items: [...all, message],
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
    ]);
  },
};
