"use client";
import React from "react";

type LeaderboardEntry = {
  playerName: string;
  score: number;
  updates: number;
  lastUpdate?: string;
};

type LeaderboardData = {
  entries: LeaderboardEntry[];
  updatedAt: string | null;
};

export default function Leaderboard({ className = "" }: { className?: string }) {
  const [data, setData] = React.useState<LeaderboardData>({ entries: [], updatedAt: null });

  const isProd = process.env.NODE_ENV === "production";

  React.useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let interval: number | null = null;

    async function load() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = (await res.json()) as LeaderboardData;
        if (!cancelled) setData(json);
      } catch { }
    }

    if (isProd) {
      // Production: use simple polling instead of SSE (serverless friendly)
      load();
      interval = window.setInterval(load, 2000);
    } else {
      // Development: use SSE for true live updates
      load();
      es = new EventSource("/api/leaderboard/stream");
      es.addEventListener("leaderboard", (e) => {
        try {
          const json = JSON.parse((e as MessageEvent).data) as LeaderboardData;
          setData(json);
        } catch { }
      });
      es.onerror = () => {
        // auto-reconnect after 2s in dev
        es?.close();
        setTimeout(() => {
          if (cancelled) return;
          es = new EventSource("/api/leaderboard/stream");
          es.addEventListener("leaderboard", (e) => {
            try {
              const json = JSON.parse((e as MessageEvent).data) as LeaderboardData;
              setData(json);
            } catch { }
          });
        }, 2000);
      };
    }

    return () => {
      cancelled = true;
      es?.close();
      if (interval) clearInterval(interval);
    };
  }, [isProd]);

  const sorted = [...data.entries].sort((a, b) => b.score - a.score).slice(0, 20);
  const showDebug = process.env.NODE_ENV !== "production";
  const colCount = 3 + (showDebug ? 2 : 0);

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold">Leaderboard</h2>
      <p className="text-sm text-gray-500">Live updates</p>
      <div className="mt-3 border rounded-md overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Rank</th>
              <th className="p-2">Player</th>
              <th className="p-2">Score</th>
              {showDebug && <th className="p-2">Updates</th>}
              {showDebug && <th className="p-2">Last Update</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((e, i) => (
              <tr key={e.playerName + i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{e.playerName}</td>
                <td className="p-2 font-mono">{e.score}</td>
                {showDebug && <td className="p-2">{e.updates}</td>}
                {showDebug && (
                  <td className="p-2 text-xs">{e.lastUpdate ? new Date(e.lastUpdate).toLocaleString() : ""}</td>
                )}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="p-3 text-center" colSpan={colCount}>
                  No entries yet. Play the game to post your score!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}