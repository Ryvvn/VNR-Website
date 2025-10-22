"use client";
import React from "react";
import Leaderboard from "@/components/Leaderboard";
import GameTimerOverlay from "@/components/GameTimerOverlay";

// Unity loader typings
interface UnityLoaderConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl?: string;
  companyName?: string;
  productName?: string;
  productVersion?: string;
}

interface UnityInstance {
  SendMessage: (objectName: string, methodName: string, value?: string | number) => void;
  Quit: () => Promise<void> | void;
}

// Declare Unity globals
declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: UnityLoaderConfig,
      onProgress?: (p: number) => void
    ) => Promise<UnityInstance>;
    Module?: {
      canvas?: HTMLCanvasElement;
      keyboardEventTarget?: EventTarget;
    };
  }
}

export default function GamePage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const [unityLoaded, setUnityLoaded] = React.useState(false);
  const [unityInstance, setUnityInstance] = React.useState<UnityInstance | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [playerName, setPlayerName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [started, setStarted] = React.useState(false);
  const [assetChecks, setAssetChecks] = React.useState<{ name: string; url: string; ok: boolean; status?: number; length?: number; error?: string }[]>([]);
  const [overlayEnded, setOverlayEnded] = React.useState(false);

  const buildBase = "/unity/Build/unity"; // Matches public/unity/Build/unity.* files

  React.useEffect(() => {
    // Quick debug: prefetch likely StreamingAssets to confirm availability
    const candidates = [
      { name: "preset.json", url: "/unity/StreamingAssets/preset.json" },
      { name: "preset_M3_RutLui_121946.json", url: "/unity/StreamingAssets/preset_M3_RutLui_121946.json" },
      { name: "quiz.csv", url: "/unity/StreamingAssets/quiz.csv" },
      { name: "quiz_mission3.csv", url: "/unity/StreamingAssets/quiz_mission3.csv" },
    ];
    Promise.all(
      candidates.map(async (c) => {
        try {
          const res = await fetch(c.url, { cache: "no-cache" });
          const text = await res.text();
          return { name: c.name, url: c.url, ok: res.ok, status: res.status, length: text.length };
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          return { name: c.name, url: c.url, ok: false, error: message };
        }
      })
    ).then(setAssetChecks);

    return () => {
      if (unityInstance && "Quit" in unityInstance) {
        try { (unityInstance as UnityInstance).Quit(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initUnity() {
    try {
      if (!window.createUnityInstance) {
        setError("Unity loader not ready.");
        return;
      }
      const canvas = canvasRef.current!;
      const config: UnityLoaderConfig = {
        dataUrl: `${buildBase}.data.br`,
        frameworkUrl: `${buildBase}.framework.js.br`,
        codeUrl: `${buildBase}.wasm.br`,
        streamingAssetsUrl: "/unity/StreamingAssets",
        companyName: "VNR",
        productName: "Mortar Game",
        productVersion: "1.0",
      };
      const inst = await window.createUnityInstance!(canvas, config, (p) => setProgress(Math.round(p * 100)));
      setUnityInstance(inst);
      setUnityLoaded(true);
      // After Unity is ready, send the name immediately
      const name = playerName.trim() || "Anonymous";
      try { inst.SendMessage("LeaderboardReporter", "SetPlayerName", name); } catch { }
      // Ensure leaderboard posts are attempt-based (total only)
      try { inst.SendMessage("LeaderboardReporter", "SetSubmitModeTotal", "true"); } catch { }
      // Unity owns cursor/pointer control. No web-side pointer management here.
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      setError(`Failed to initialize Unity: ${msg}`);
    }
  }

  // Start loading Unity only after the player enters their name and clicks Start
  function startGame() {
    setStarted(true);
    setError(null);
    const canvas = canvasRef.current!;
    canvas.id = "unity-canvas";
    canvas.tabIndex = 0; // allow keyboard focus

    // Direct keyboard while starting
    window.Module = window.Module || {};
    window.Module.canvas = canvas;
    window.Module.keyboardEventTarget = document;

    const maybeStart = () => initUnity();

    if (window.createUnityInstance) {
      // Loader already available
      maybeStart();
    } else {
      const script = document.createElement("script");
      script.src = `${buildBase}.loader.js`;
      script.async = true;
      script.onload = () => maybeStart();
      script.onerror = () => setError("Failed to load Unity loader script.");
      document.body.appendChild(script);
    }
  }

  function onPrimaryButtonClick() {
    if (!unityLoaded) {
      // Start Game phase
      startGame();
    } else {
      // Update name after game started
      const name = playerName.trim() || "Anonymous";
      try { unityInstance?.SendMessage("LeaderboardReporter", "SetPlayerName", name); } catch { }
    }
  }

  const primaryButtonLabel = unityLoaded ? "Set Name" : "Start Game";

  return (
    <main className="w-full max-w-none p-4 grid grid-cols-1 gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mortar Game (WebGL)</h1>
        {/* Timer overlay: Unity drives timer; overlay ends only when GameManager reports timeRemaining==0 */}
        {started && (
          <GameTimerOverlay
            seconds={480}
            playerName={playerName.trim() || "Anonymous"}
            syncWithUnity={true}
            onEnd={() => {
              setOverlayEnded(true);
              try { unityInstance?.SendMessage("LeaderboardReporter", "ReportFinalScore"); } catch {}
            }}
          />
        )}
        <div className="mb-3 flex items-center gap-2">
          <input
            ref={nameInputRef}
            id="player-name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your player name"
            className="border rounded px-3 py-2 w-64"
          />
          <button
            className="bg-blue-600 text-white px-3 py-2 rounded"
            onClick={onPrimaryButtonClick}
            title={!unityLoaded ? "Start the game" : "Send name to Unity"}
          >
            {primaryButtonLabel}
          </button>
          {started && progress < 100 && (
            <span className="text-sm text-gray-600">Loading: {progress}%</span>
          )}
        </div>
        <div className="border rounded overflow-hidden mx-auto w-full md:w-[80%]">
          {/* Canvas shows the game once started; remains idle before */}
          <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: "16/9", background: "#000" }} />
        </div>
        {/* {error && <p className="text-red-600 mt-2">{error}</p>} */}
      </div>
      <div>
        <Leaderboard />
      </div>
    </main>
  );
}