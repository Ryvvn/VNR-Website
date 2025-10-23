import { NextResponse } from "next/server";
import { readLeaderboard, upsertScore } from "./_store";
import { broadcast } from "./_sse";

export const runtime = "nodejs"; // ensure Node runtime for fs/KV

export async function GET() {
  const data = await readLeaderboard();
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const playerName = String(body.playerName ?? "Anonymous");
    const delta = Number(body.delta ?? 0);
    const total = body.total !== undefined ? Number(body.total) : undefined;
    if (!Number.isFinite(delta) && !Number.isFinite(total || NaN)) {
      return NextResponse.json({ error: "Invalid score input" }, { status: 400 });
    }
    // Debug logging to verify submissions arriving from Unity
    console.log("[LEADERBOARD POST]", { playerName, delta, total });
    const updated = await upsertScore(playerName, delta || 0, total);
    broadcast("leaderboard", updated);
    return NextResponse.json({ ok: true, leaderboard: updated }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}