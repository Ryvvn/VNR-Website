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

function ensureFile(): void {
  if (!fs.existsSync(dataPath)) {
    const initial: LeaderboardFile = { entries: [], updatedAt: null };
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function readLeaderboard(): LeaderboardFile {
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

export function writeLeaderboard(update: LeaderboardFile): void {
  ensureFile();
  fs.writeFileSync(dataPath, JSON.stringify(update, null, 2), "utf-8");
}

export function upsertScore(playerName: string, delta: number, total?: number): LeaderboardFile {
  const lb = readLeaderboard();
  const now = new Date().toISOString();
  const name = playerName?.trim() || "Anonymous";
  const idx = lb.entries.findIndex((e) => e.playerName === name);

  // Attempt-based scoring: every submission represents a single attempt.
  // We store the score for the latest attempt (no summation).
  const attemptScore = typeof total === "number" ? total : delta;

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
  writeLeaderboard(lb);
  return lb;
}