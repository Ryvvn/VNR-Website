"use client";
import React from "react";

type Props = {
  seconds?: number;
  onEnd?: () => void;
  playerName?: string;
  syncWithUnity?: boolean;
};

// Typed detail for Unity timer events dispatched from WebGL
interface UnityTimerDetail { seconds: number }

declare global {
  interface Window {
    Module?: {
      canvas?: HTMLCanvasElement;
      keyboardEventTarget?: EventTarget;
    };
  }
}

export default function GameTimerOverlay({ seconds = 480, onEnd, playerName, syncWithUnity = true }: Props) {
  const [timeLeft, setTimeLeft] = React.useState(seconds);
  const [ended, setEnded] = React.useState(false);
  const [finalScore, setFinalScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!syncWithUnity) return;
    const onInit = (e: Event) => {
      const detail = (e as CustomEvent<UnityTimerDetail>).detail;
      const s = Math.round(detail?.seconds ?? seconds);
      setTimeLeft(s);
    };
    const onTick = (e: Event) => {
      const detail = (e as CustomEvent<UnityTimerDetail>).detail;
      const s = Math.round(detail?.seconds ?? 0);
      setTimeLeft(s);
      if (s <= 0 && !ended) {
        setEnded(true);
        try { document.exitPointerLock?.(); } catch { }
        try {
          const canvas = document.getElementById("unity-canvas") as HTMLCanvasElement | null;
          if (canvas) canvas.style.pointerEvents = "none";
          const Module = window.Module;
          if (Module) Module.keyboardEventTarget = document;
        } catch { }
        try { onEnd?.(); } catch { }
      }
    };
    const onEnded: EventListener = () => {
      if (!ended) {
        setEnded(true);
        try { document.exitPointerLock?.(); } catch { }
        try {
          const canvas = document.getElementById("unity-canvas") as HTMLCanvasElement | null;
          if (canvas) canvas.style.pointerEvents = "none";
          const Module = window.Module;
          if (Module) Module.keyboardEventTarget = document;
        } catch { }
        try { onEnd?.(); } catch { }
      }
    };
    window.addEventListener("unity-timer-init", onInit);
    window.addEventListener("unity-time-remaining", onTick);
    window.addEventListener("unity-timer-ended", onEnded);
    return () => {
      window.removeEventListener("unity-timer-init", onInit);
      window.removeEventListener("unity-time-remaining", onTick);
      window.removeEventListener("unity-timer-ended", onEnded);
    };
  }, [syncWithUnity, seconds, ended, onEnd]);

  React.useEffect(() => {
    if (ended || syncWithUnity) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, seconds - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setEnded(true);
        // Pause input capture immediately when overlay appears
        try { document.exitPointerLock?.(); } catch { }
        try {
          const canvas = document.getElementById("unity-canvas") as HTMLCanvasElement | null;
          if (canvas) canvas.style.pointerEvents = "none";
          const Module = window.Module;
          if (Module) Module.keyboardEventTarget = document;
        } catch { }
        try { onEnd?.(); } catch { }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [seconds, ended, onEnd, syncWithUnity]);

  React.useEffect(() => {
    if (!ended) return;
    // Fetch latest score for summary
    const name = (playerName ?? "Anonymous").trim() || "Anonymous";
    (async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const data = await res.json();
        type Entry = { playerName: string; score: number; updates: number; lastUpdate?: string };
        const entries: Entry[] | undefined = Array.isArray(data?.entries) ? (data.entries as Entry[]) : undefined;
        const entry = entries?.find((e) => e.playerName === name);
        if (entry && typeof entry.score === "number") setFinalScore(entry.score);
      } catch { }
    })();
  }, [ended, playerName]);

  function format(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  }

  return (
    <>
      {/* Top-right countdown: don't block clicks on navigation */}
      <div className="fixed top-3 right-3 z-40 pointer-events-none bg-black/70 text-white rounded px-3 py-2 shadow">
        <span className="font-semibold">Time left:</span> <span className="font-mono">{format(timeLeft)}</span>
      </div>

      {/* End-of-demo win animation / overlay */}
      {ended && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 text-white">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="text-5xl animate-bounce" aria-hidden>🥇</div>
              <div className="text-3xl font-bold">Demo complete!</div>
            </div>
            <p className="mb-2 text-sm text-gray-200">Thanks for playing. Your score has been posted to the leaderboard.</p>
            {finalScore !== null && (
              <p className="mb-4 text-base"><span className="font-semibold">Your score:</span> <span className="font-mono">{finalScore}</span></p>
            )}
            <div className="flex items-center justify-center gap-3">
              <a href="/leaderboard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">View Leaderboard</a>
              <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Play Again</button>
            </div>
            {/* Simple confetti */}
            <div aria-hidden className="mt-6">
              <div style={{ fontSize: 24 }}>🎊 🎉 🎈 🥳 🎉 🎊</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}