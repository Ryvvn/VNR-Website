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
  zadd(key: string, ...args: { score: number; member: string }[]): Promise<number>;
  zrange(
    key: string,
    start: number,
    stop: number,
    opts?: { withScores?: boolean; rev?: boolean }
  ): Promise<Array<string | number> | Array<{ member: string; score: number }>>;
  zincrby(key: string, increment: number, member: string): Promise<number>;
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
      // Read top 50 with scores (highest first)
      const res = await kv.zrange("lb:rank", 0, 49, { rev: true, withScores: true });
      const entries: LeaderboardEntry[] = [];
      const now = new Date().toISOString();

      if (Array.isArray(res)) {
        // Shape A: array of objects { member, score }
        if (
          res.length > 0 &&
          typeof res[0] === "object" &&
          res[0] !== null &&
          "member" in (res[0] as Record<string, unknown>)
        ) {
          for (const item of res as Array<{ member: string; score: number }>) {
            entries.push({ playerName: item.member, score: Number(item.score) || 0, updates: 0, lastUpdate: undefined });
          }
        } else {
          // Shape B: alternating array [member, score, member, score, ...]
          const arr = res as Array<string | number>;
          for (let i = 0; i < arr.length; i += 2) {
            const member = String(arr[i] ?? "");
            const scoreRaw = arr[i + 1];
            const score = typeof scoreRaw === "number" ? scoreRaw : Number(scoreRaw ?? 0);
            if (member) entries.push({ playerName: member, score: Number.isFinite(score) ? score : 0, updates: 0 });
          }
        }
      }

      return { entries, updatedAt: entries.length ? now : null };
    } catch {
      return { entries: [], updatedAt: null };
    }
  } else {
    ensureFile();
    const raw = fs.readFileSync(dataPath, "utf-8");
    try {
      const parsed = JSON.parse(raw) as LeaderboardFile;
      if (!parsed.entries) parsed.entries = [];
      return parsed;
    } catch {
      return { entries: [], updatedAt: null };
    }
  }
}

export async function writeLeaderboard(update: LeaderboardFile): Promise<void> {
  if (USE_KV) {
    // With ZSET-based storage, we don't persist the whole JSON document.
    // No-op in production.
    return;
  } else {
    ensureFile();
    fs.writeFileSync(dataPath, JSON.stringify(update, null, 2), "utf-8");
  }
}

export async function upsertScore(playerName: string, delta: number, total?: number): Promise<LeaderboardFile> {
  const now = new Date().toISOString();
  const name = playerName?.trim() || "Anonymous";

  if (USE_KV) {
    try {
      const kv = await kvClient();
      const hasTotal = typeof total === "number" && Number.isFinite(total);
      const hasDelta = Number.isFinite(delta) && delta !== 0;

      if (hasTotal) {
        await kv.zadd("lb:rank", { score: total as number, member: name });
      } else if (hasDelta) {
        await kv.zincrby("lb:rank", delta, name);
      }

      // Return fresh leaderboard from KV
      return await readLeaderboard();
    } catch {
      return { entries: [], updatedAt: null };
    }
  }

  // File-system dev fallback: keep previous behavior
  const lb = await readLeaderboard();
  const idx = lb.entries.findIndex((e) => e.playerName === name);

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