import fs from "fs";
import path from "path";

export type LeaderboardEntry = {
  playerName: string;
  score: number;
  updates: number;
  lastUpdate?: string;
};

export type LeaderboardFile = {
  entries: LeaderboardEntry[];
  updatedAt: string | null;
};

const dataPath = path.join(process.cwd(), "src", "data", "leaderboard.json");

// Decide storage backend: KV in production (requires env + @vercel/kv), FS in dev
const USE_KV = process.env.NODE_ENV === "production";

function ensureFile(): void {
  if (!fs.existsSync(dataPath)) {
    const initial: LeaderboardFile = { entries: [], updatedAt: null };
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2), "utf-8");
  }
}

// Minimal KV client interface to avoid `any` types
type KVClient = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
};

async function kvClient(): Promise<KVClient> {
  // Dynamic import to avoid requiring the dependency in dev
  const mod = await import("@vercel/kv");
  return mod.kv as KVClient;
}

export async function readLeaderboard(): Promise<LeaderboardFile> {
  if (USE_KV) {
    try {
      const kv = await kvClient();
      const data = await kv.get<LeaderboardFile>("leaderboard");
      if (data && typeof data === "object" && Array.isArray((data as LeaderboardFile).entries)) {
        return data as LeaderboardFile;
      }
      return { entries: [], updatedAt: null };
    } catch {
      // Fallback empty
      return { entries: [], updatedAt: null };
    }
  } else {
    ensureFile();
    const raw = fs.readFileSync(dataPath, "utf-8");
    try {
      const parsed = JSON.parse(raw) as LeaderboardFile;
      if (!parsed.entries) parsed.entries = [];
      return parsed;
    } catch (e) {
      return { entries: [], updatedAt: null };
    }
  }
}

export async function writeLeaderboard(update: LeaderboardFile): Promise<void> {
  if (USE_KV) {
    try {
      const kv = await kvClient();
      await kv.set("leaderboard", update);
    } catch {
      // No-op on failure
    }
  } else {
    ensureFile();
    fs.writeFileSync(dataPath, JSON.stringify(update, null, 2), "utf-8");
  }
}

export async function upsertScore(playerName: string, delta: number, total?: number): Promise<LeaderboardFile> {
  const lb = await readLeaderboard();
  const now = new Date().toISOString();
  const name = playerName?.trim() || "Anonymous";
  const idx = lb.entries.findIndex((e) => e.playerName === name);

  // Live update semantics:
  // - If total is provided, it is authoritative for the current attempt.
  // - If delta is provided and non-zero, accumulate it onto existing score.
  // - If delta==0 and no total, preserve existing score.
  const hasTotal = typeof total === "number" && Number.isFinite(total);
  const hasDelta = Number.isFinite(delta);

  let attemptScore: number;
  if (hasTotal) {
    attemptScore = total as number;
  } else if (hasDelta && delta !== 0) {
    const prev = idx >= 0 ? lb.entries[idx].score : 0;
    attemptScore = prev + delta;
  } else if (hasDelta && delta === 0 && idx >= 0) {
    attemptScore = lb.entries[idx].score;
  } else {
    attemptScore = idx >= 0 ? lb.entries[idx].score : 0;
  }

  if (idx >= 0) {
    const existing = lb.entries[idx];
    lb.entries[idx] = {
      ...existing,
      score: attemptScore,
      updates: (existing.updates ?? 0) + 1,
      lastUpdate: now,
    };
  } else {
    lb.entries.push({ playerName: name, score: attemptScore, updates: 1, lastUpdate: now });
  }
  lb.updatedAt = now;
  await writeLeaderboard(lb);
  return lb;
}