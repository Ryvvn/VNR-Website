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
  // We store the score for the latest attempt. Some Unity builds send a final
  // submission with delta=0 and no total; in that case we avoid overwriting a
  // previously non-zero score with 0.
  const hasTotal = typeof total === "number" && Number.isFinite(total);
  const hasDelta = Number.isFinite(delta);

  let attemptScore: number;
  if (hasTotal) {
    attemptScore = total as number;
  } else if (hasDelta && delta !== 0) {
    attemptScore = delta;
  } else if (hasDelta && delta === 0 && idx >= 0) {
    // Preserve existing score if the submission carries no total and delta==0
    attemptScore = lb.entries[idx].score;
  } else {
    attemptScore = 0;
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
  writeLeaderboard(lb);
  return lb;
}